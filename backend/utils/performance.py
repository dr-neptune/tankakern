import numpy as np
import datetime
from dateutil.relativedelta import relativedelta

def generate_synthetic_pe_cashflows(
    T_c=5.0,         # Commitment period in years
    T_l=10.0,        # Total fund life in years
    dt=0.25,         # Time-step in years (quarterly)
    C=100.0,         # Committed capital
    kappa=2.0,       # Speed of mean reversion for call rate
    theta=0.5,       # Long-run mean of call rate (dimensionless fraction)
    sigma_delta=0.3, # Volatility for call-rate process
    delta0=None,     # Initial call rate (if None, defaults to theta)
    alpha=0.03,      # Speed to converge to multiple (distributions)
    m=1.6,           # Long-run multiple (total distributions / C)
    sigma_P=0.2,     # Volatility in distribution increments
    random_state=None,
    dist_lag=2.0,    # Distributions do not begin until this many years have elapsed
    start_date=datetime.date(2020, 1, 1),  # Starting date for the timeline
):
    """
    Generate synthetic Private Equity cashflows using a Buchner-style approach,
    modified for more realistic lumps, a time-lag for distributions, and actual
    dates (quarterly) instead of floating time steps.

    Calls (Drawdowns):
    ------------------
    - We use a square-root diffusion (CIR-like) for the *call rate*, delta(t).
    - Each quarter, calls[i] = leftover_capital * delta[i] * dt (clamped so leftover >= 0).
    - Calls cease after T_c years or once leftover=0.

    Distributions:
    --------------
    - We track a fraction M(t) that converges to m, but do not increment M until t >= dist_lag.
    - Dist amount each quarter = (M[t+1] - M[t]) * C.
    - Remainder not distributed by T_l is NAV.

    Dates:
    ------
    - We produce an array of date strings spaced dt=0.25 years apart (3 months). This way,
      the early quarters show mostly calls, the mid quarters have both calls & dists,
      and the late quarters have mostly dists.

    Returns
    -------
    {
      "times": [...],
      "dates": [...],
      "calls": [...],
      "dists": [...],
      "nav": float
    }
    - times : float array of time in years
    - dates : string array (ISO8601) of actual quarterly dates
    - calls : capital called each quarter
    - dists : capital distributed each quarter
    - nav   : residual net asset value at final date
    """
    rng = np.random.default_rng(random_state)

    # 1) Discretize the timeline
    num_steps = int(np.ceil(T_l / dt))
    times = np.arange(num_steps + 1) * dt  # 0, 0.25, 0.5, ... up to T_l

    # Generate actual date strings, stepping 3 months at each index
    dates = []
    for i in range(num_steps + 1):
        # 3 months per step * i
        quarter_date = start_date + relativedelta(months=int(3 * i))
        dates.append(quarter_date.isoformat())

    # 2) Initialize arrays for calls & distributions
    calls = np.zeros_like(times)
    dists = np.zeros_like(times)

    # 3) CIR-like process for the call rate
    if delta0 is None:
        delta0 = theta
    delta = np.zeros_like(times)
    delta[0] = delta0

    # leftover capital
    leftover = C

    for i in range(len(times) - 1):
        t = times[i]
        dt_local = times[i+1] - times[i]

        # Update call rate if within commitment period & we have leftover capital
        if (t < T_c) and (leftover > 0):
            sqrt_delta = np.sqrt(max(delta[i], 0.0))
            z = rng.normal()
            delta[i+1] = (
                delta[i]
                + kappa * (theta - delta[i]) * dt_local
                + sigma_delta * sqrt_delta * np.sqrt(dt_local) * z
            )
            if delta[i+1] < 0.0:
                delta[i+1] = 0.0

            # Actual calls
            call_amount = leftover * delta[i] * dt_local
            if call_amount > leftover:
                call_amount = leftover
            calls[i] = call_amount
            leftover -= call_amount
        else:
            # No more calls
            delta[i+1] = 0.0

    # 4) Distributions: fraction M(t) converges to m, but only after dist_lag
    M = np.zeros_like(times)
    for i in range(len(times) - 1):
        t = times[i]
        dt_local = times[i+1] - times[i]

        if t >= dist_lag:
            z = rng.normal()
            increment = alpha * (m - M[i]) * dt_local + sigma_P * np.sqrt(dt_local) * z
            M[i+1] = M[i] + increment
            if M[i+1] < 0.0:
                M[i+1] = 0.0
            if M[i+1] > m:
                M[i+1] = m
            # Distributions
            dists[i] = max(M[i+1] - M[i], 0.0) * C
        else:
            M[i+1] = M[i]

    # 5) Residual Value at final time
    final_fraction = M[-1]
    if final_fraction < m:
        nav = (m - final_fraction) * C
    else:
        nav = 0.0

    return {
        "times": times.tolist(),
        "dates": dates,
        "calls": calls.tolist(),
        "dists": dists.tolist(),
        "nav": nav
    }
