import numpy as np
import datetime
from dateutil.relativedelta import relativedelta

def run_buchner_model(
    historical_data,
    kappa=2.0,
    theta=0.5,
    sigma_delta=0.3,
    alpha=0.03,
    m=1.6,
    sigma_P=0.2,
    projection_years=5.0,
    dt=0.25,
    random_state=42,
    committed_cap=100.0
):
    """
    A Buchner-style forward projection that 'respects' already-called and 
    already-distributed amounts so we don't overshoot by an order of magnitude.

    1) We parse the historical data: sum of calls => called_so_far,
       sum of distributions => dist_so_far.
    2) leftover_cap = committed_cap - called_so_far   (the new calls can't exceed leftover_cap).
    3) leftover_dist_target = m*committed_cap - dist_so_far 
       (the new distribution target is what's needed to reach the fund's final multiple).
    4) We'll run a 'scaled' model with newC = leftover_cap and newM = leftover_dist_target / leftover_cap,
       so that if the leftover_cap is 30 but we want 50 more in total distributions, newM = 50/30 = 1.666...
    5) The short forward simulation uses leftover_cap + newM, then we reassemble final results 
       (adding the historical data + the new calls & distributions).

    This approach keeps the new calls/distributions in a realistic range, 
    rather than re-projecting as though we were at time zero.

    Returns a dict with "dates", "calls", "dists", "nav", 
    combining the historical portion and the forward projection.
    """

    rng = np.random.default_rng(random_state)

    # --- 1) Sort / parse the historical data ---
    hist_data_sorted = sorted(historical_data, key=lambda x: x["date"])
    if not hist_data_sorted:
        # If there's no historical data, we just simulate from scratch
        called_so_far = 0.0
        dist_so_far = 0.0
        hist_dates = []
        hist_calls = []
        hist_dists = []
        start_date = datetime.date(2020, 1, 1)  # arbitrary
    else:
        # Convert date strings to actual date objects
        parsed_dates = [datetime.date.fromisoformat(d["date"]) for d in hist_data_sorted]
        hist_calls = [float(d["call"]) for d in hist_data_sorted]
        hist_dists = [float(d["dist"]) for d in hist_data_sorted]
        hist_dates = parsed_dates

        called_so_far = sum(hist_calls)
        dist_so_far  = sum(hist_dists)

        start_date = parsed_dates[-1]  # last historical date

    # --- 2) leftover capital & leftover distribution target ---
    leftover_cap = max(committed_cap - called_so_far, 0.0)
    # total target distribution would be m*C, so leftover target is:
    leftover_dist_target = m*committed_cap - dist_so_far
    if leftover_dist_target < 0.0:
        leftover_dist_target = 0.0  # we've already exceeded final multiple

    # If leftover_cap is 0 or leftover_dist_target is 0, we can only project trivial results
    if leftover_cap <= 0 and leftover_dist_target <= 0:
        # Nothing left to call/distribute
        return assemble_result(
            hist_dates, hist_calls, hist_dists, 
            leftover_nav=0.0, # because we've presumably already reached or exceeded m*C
        )

    # --- 3) Scale the forward model so it only deals with leftover ---
    # newCommittedCap = leftover_cap
    # newM = leftover_dist_target / leftover_cap
    # but clamp if leftover_cap=0 to avoid division by zero
    if leftover_cap > 0:
        scaled_m = leftover_dist_target / leftover_cap
    else:
        scaled_m = 0.0  # no leftover capital => no more distributions

    # We'll track initial fraction M_so_far = 0 in the scaled sense,
    # because we've 're-based' to leftover portion. Similarly, leftover calls are the new "C".
    # We can skip complicated partial fraction steps here because we have effectively re-based 
    # the model to "time zero" = last historical date for the leftover portion.

    # --- 4) Build a timeline for the forward projection ---
    num_proj_steps = int(np.ceil(projection_years / dt))
    proj_dates = []
    for i in range(num_proj_steps):
        next_d = start_date + relativedelta(months=int(3*(i+1)))  # dt=0.25 => ~3 months
        proj_dates.append(next_d)

    # We'll store projected calls & dists in arrays
    proj_calls = np.zeros(num_proj_steps)
    proj_dists = np.zeros(num_proj_steps)

    # We'll do a CIR for the call rate
    delta = np.zeros(num_proj_steps + 1)
    # let's just set delta0 = theta for simplicity
    delta[0] = theta

    leftover_cap_running = leftover_cap  # track how much is left

    for i in range(num_proj_steps):
        # CIR step
        sqrt_delta = np.sqrt(max(delta[i], 0.0))
        z = rng.normal()
        delta_next = (
            delta[i]
            + kappa*(theta - delta[i])*dt
            + sigma_delta*sqrt_delta*np.sqrt(dt)*z
        )
        if delta_next < 0:
            delta_next = 0
        delta[i+1] = delta_next

        # calls
        if leftover_cap_running > 0:
            call_amount = leftover_cap_running * delta[i] * dt
            if call_amount > leftover_cap_running:
                call_amount = leftover_cap_running
            proj_calls[i] = call_amount
            leftover_cap_running -= call_amount
        else:
            proj_calls[i] = 0.0

    # For distributions, we track M(t) from 0->scaled_m
    M = np.zeros(num_proj_steps + 1)
    for i in range(num_proj_steps):
        z = rng.normal()
        dM = alpha*(scaled_m - M[i])*dt + sigma_P*np.sqrt(dt)*z
        M_next = M[i] + dM
        if M_next < 0:
            M_next = 0
        if M_next > scaled_m:
            M_next = scaled_m
        M[i+1] = M_next
        proj_dists[i] = max(M[i+1] - M[i], 0.0)*leftover_cap

    # leftover fraction in scaled sense => leftover * leftover_cap => real leftover
    final_fraction_scaled = M[-1]
    nav_leftover = (scaled_m - final_fraction_scaled)*leftover_cap if final_fraction_scaled < scaled_m else 0.0

    # So the real total nav is nav_leftover 
    # because historically we might not have reached m*C, 
    # but the leftover portion is accounted for. 
    # Summation of historical calls is already done, same for distributions.

    # Combine everything into a final result
    all_dates  = hist_dates + proj_dates
    all_calls  = hist_calls + proj_calls.tolist()
    all_dists  = hist_dists + proj_dists.tolist()

    return assemble_result(all_dates, all_calls, all_dists, leftover_nav=nav_leftover)


def assemble_result(dates, calls, dists, leftover_nav):
    """
    Helper to produce the final dictionary in the consistent format:
    { "dates": [...], "calls": [...], "dists": [...], "nav": float }
    """
    # Convert date objects to isoformat if they aren't strings
    def date_to_iso(d):
        return d.isoformat() if hasattr(d, "isoformat") else str(d)

    out = {
        "dates": [date_to_iso(d) for d in dates],
        "calls": calls,
        "dists": dists,
        "nav": leftover_nav
    }
    return out
