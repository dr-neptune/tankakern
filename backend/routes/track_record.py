from fastapi import APIRouter, Query, Body
from typing import List
from datetime import datetime, date, timedelta
import numpy as np
import random
import string

from models.track_record import Fund, Deal, CashFlow

router = APIRouter(tags=["TrackRecord"])

# Attempt to import NeuralProphet
try:
    from neuralprophet import NeuralProphet
    NEURALPROPHET_AVAILABLE = True
except ImportError:
    NEURALPROPHET_AVAILABLE = False


@router.get("/generate")
def generate_track_record_data(
    gp_name: str,
    num_funds: int = Query(5, ge=1, le=15),
    num_deals: int = Query(15, ge=1, le=100)
):
    """
    Generate fake Funds, Deals, and CashFlows for a given GP.
    Adjusted logic for calls/distributions to simulate a J-curve effect:
      - First 2.5 years (30 months): mostly calls (80% calls)
      - Next 1.5 years (18 months): a 50/50 mix of calls and distributions
      - After 4 years (48 months): all distributions
    """
    rng = np.random.default_rng()

    funds_data = []
    deals_data = []
    cashflows_data = []

    current_year = datetime.now().year

    for f_idx in range(num_funds):
        vintage_year = current_year - (num_funds - f_idx)
        net_irr = float(np.clip(rng.normal(loc=0.2, scale=0.1), 0.0, 1.5))
        dpi_val = float(rng.lognormal(mean=0.0, sigma=1.0))
        net_dpi = min(dpi_val, 5.0)
        tvpi_val = float(rng.lognormal(mean=0.0, sigma=1.0))
        net_tvpi = min(tvpi_val, 5.0)
        stage = random.choice(["Buyout", "Venture"])
        geo = random.choice(["North America", "Global", "Europe"])
        fund_name = f"Fund {f_idx+1}"

        funds_data.append(
            Fund(
                fund_name=fund_name,
                gp_name=gp_name,
                vintage_year=vintage_year,
                net_irr=net_irr,
                net_dpi=net_dpi,
                net_tvpi=net_tvpi,
                stage=stage,
                geo=geo
            ).dict()
        )

        # Generate deals for this fund
        for _ in range(num_deals):
            company_name = "".join(rng.choice(list(string.ascii_uppercase), size=6))
            total_value = float(rng.lognormal(mean=4.60517, sigma=1.0))
            total_cost = float(rng.lognormal(mean=4.60517, sigma=1.0))
            realized_frac = float(rng.random())
            realized_value = total_value * realized_frac
            realized_cost = total_cost * realized_frac
            tv_tc = total_value / total_cost if total_cost != 0 else 0.0
            realized_bool = bool(rng.binomial(n=1, p=0.25))
            deals_data.append(
                Deal(
                    fund_name=fund_name,
                    gp_name=gp_name,
                    company_name=company_name,
                    stage=stage,
                    geo=geo,
                    total_value=total_value,
                    total_cost=total_cost,
                    realized_value=realized_value,
                    realized_cost=realized_cost,
                    tv_tc=tv_tc,
                    realized=realized_bool
                ).dict()
            )

        # Generate cash flows with J-curve effect
        vintage_start_date = date(vintage_year, 1, 1)
        today_date = datetime.now().date()
        monthly_dates = []
        current_dt = vintage_start_date
        while current_dt <= today_date:
            monthly_dates.append(current_dt)
            y = current_dt.year
            m = current_dt.month + 1
            if m > 12:
                m = 1
                y += 1
            current_dt = date(y, m, 1)

        if not monthly_dates:
            continue

        # Define cutoff months for each interval
        calls_cutoff = 30       # first 2.5 years
        mixture_cutoff = 48     # next 1.5 years => up to year 4
        # after mixture_cutoff => all distributions

        for dt in monthly_dates:
            delta_months = (dt.year - vintage_start_date.year) * 12 + (dt.month - vintage_start_date.month)
            if delta_months <= calls_cutoff:
                # ~80% calls, 20% distributions
                if rng.random() < 0.8:
                    amt = float(rng.lognormal(mean=1.0, sigma=1.0))
                    amt = -amt
                    flow_type = "Call"
                else:
                    amt = float(rng.lognormal(mean=1.0, sigma=1.0))
                    flow_type = "Distribution"
            elif delta_months <= mixture_cutoff:
                # 50/50 calls vs distributions
                if rng.random() < 0.5:
                    amt = float(rng.lognormal(mean=1.0, sigma=1.0))
                    amt = -amt
                    flow_type = "Call"
                else:
                    amt = float(rng.lognormal(mean=1.0, sigma=1.0))
                    flow_type = "Distribution"
            else:
                # beyond 4 years => all distributions
                amt = float(rng.lognormal(mean=1.0, sigma=1.0))
                flow_type = "Distribution"

            cashflows_data.append(
                CashFlow(
                    fund_name=fund_name,
                    gp_name=gp_name,
                    date=dt,
                    amount_millions=amt,
                    type=flow_type
                ).dict()
            )

    return {
        "funds": funds_data,
        "deals": deals_data,
        "cashflows": cashflows_data
    }


@router.post("/project")
def project_cashflows(
    fund_name: str = Body(...),
    gp_name: str = Body(...),
    existing_cf: List[dict] = Body(...),
    vintage_year: int = Body(...)
):
    """
    Project future cash flows for a fund with age < 15 years using a minimal
    NeuralProphet approach. Also enforce that calls won't appear after year 4.
    """
    fund_age = datetime.now().year - vintage_year
    remaining_years = 15 - fund_age
    if remaining_years <= 0:
        return {"message": "No projection needed, fund is 15+ years old", "forecast": []}

    if not NEURALPROPHET_AVAILABLE:
        return {"message": "NeuralProphet not installed. Please install it or pick another model.", "forecast": []}

    from collections import defaultdict
    import pandas as pd
    import numpy as np
    np.NaN = np.nan

    # Aggregate existing cash flows by month
    monthly_agg = defaultdict(float)
    for cf in existing_cf:
        dt = date.fromisoformat(cf["date"])
        ym = (dt.year, dt.month)
        monthly_agg[ym] += cf["amount_millions"]

    if not monthly_agg:
        return {"message": "No existing cash flows to project from.", "forecast": []}

    rows = []
    for (y, m), amt in monthly_agg.items():
        rows.append({"ds": date(y, m, 1), "y": amt})
    df = pd.DataFrame(rows).sort_values("ds").reset_index(drop=True)

    # Minimal NeuralProphet model configuration
    from neuralprophet import NeuralProphet
    m = NeuralProphet(
        epochs=10,
        learning_rate=0.01,
        weekly_seasonality=False,
        daily_seasonality=False,
    )

    # Fit the model
    m.fit(df, freq="MS", progress=None)
    future_periods = remaining_years * 12
    future_df = m.make_future_dataframe(df, periods=future_periods)
    forecast = m.predict(future_df)

    # Convert last_known_date to a pandas Timestamp for comparison
    last_known_date = pd.Timestamp(df["ds"].max())
    fc_rows = forecast[forecast["ds"] > last_known_date]

    # Post-processing: if the forecast month is beyond 4 years from vintage, force distribution
    # i.e. if (ds_year - vintage_year) * 12 + (ds_month - 1) > 48 => distribution
    calls_cutoff_months = 48

    predicted_flows = []
    for _, row in fc_rows.iterrows():
        amt = float(row["yhat1"])
        ds_date = row["ds"]
        # Convert ds_date to date for easier calculations
        ds_yr, ds_mo = ds_date.year, ds_date.month
        delta_months = (ds_yr - vintage_year) * 12 + (ds_mo - 1)

        if delta_months > calls_cutoff_months:
            # Force distribution if the model predicted negative
            # => we can set amt positive
            if amt < 0:
                amt = abs(amt)
            flow_type = "Distribution"
        else:
            # Use normal logic: negative => call, positive => distribution
            flow_type = "Call" if amt < 0 else "Distribution"

        predicted_flows.append({
            "date": ds_date.isoformat(),
            "amount_millions": amt,
            "type": flow_type
        })

    return {
        "message": "Minimal neuralprophet projection done with calls forced to end by year 4.",
        "forecast": predicted_flows
    }
