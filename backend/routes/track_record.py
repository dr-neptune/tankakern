from fastapi import APIRouter, Query
from typing import List
from datetime import datetime, date, timedelta
import numpy as np
import random
import string

from models.track_record import Fund, Deal, CashFlow

router = APIRouter(tags=["TrackRecord"])

@router.get("/generate")
def generate_track_record_data(
    gp_name: str,
    num_funds: int = Query(5, ge=1, le=15),
    num_deals: int = Query(15, ge=1, le=100)
):
    """
    Generate fake Funds, Deals, and CashFlows for a given GP.
    """

    # For random distributions
    rng = np.random.default_rng()

    # We'll keep everything in memory and just return JSON for now.
    funds_data = []
    deals_data = []
    cashflows_data = []

    current_year = datetime.now().year

    # Generate each fund
    for f_idx in range(num_funds):
        # Vintage year: if f_idx=0 -> 'num_funds' years ago
        # e.g. Fund1 is (num_funds) years ago, Fund2 is (num_funds-1) years ago, ...
        vintage_year = current_year - (num_funds - f_idx)

        # Net IRR: around 0.2 with some skew. We'll do a clipped normal.
        net_irr = float(np.clip(rng.normal(loc=0.2, scale=0.1), 0.0, 1.5))

        # Net DPI: lognormal around 1.0
        dpi_val = float(rng.lognormal(mean=0.0, sigma=1.0))
        # We'll clip it in a range 0..5 for safety
        net_dpi = min(dpi_val, 5.0)

        # Net TVPI: lognormal around 1.0, similarly clipped
        tvpi_val = float(rng.lognormal(mean=0.0, sigma=1.0))
        net_tvpi = min(tvpi_val, 5.0)

        # Stage: random from {Buyout, Venture}
        stage = random.choice(["Buyout", "Venture"])

        # Geo: random from {North America, Global, Europe}
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
            # random word for company name
            company_name = "".join(rng.choice(list(string.ascii_uppercase), size=6))

            # total_value from lognormal ~ 100
            total_value = float(rng.lognormal(mean=4.60517, sigma=1.0))  # mean=log(100)=4.60517
            total_cost = float(rng.lognormal(mean=4.60517, sigma=1.0))

            # realized value is a random fraction
            realized_frac = float(rng.random())
            realized_value = total_value * realized_frac
            realized_cost = total_cost * realized_frac

            tv_tc = total_value / total_cost if total_cost != 0 else 0.0

            # realized 25% chance
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

        # Generate cash flows
        # figure out how many years from vintage to now
        years_from_vintage = datetime.now().year - vintage_year
        if years_from_vintage < 0:
            years_from_vintage = 0

        # We'll generate monthly intervals from the vintage year start to now
        vintage_start_date = date(vintage_year, 1, 1)
        today_date = datetime.now().date()

        # build the list of monthly dates
        monthly_dates = []
        current_dt = vintage_start_date
        while current_dt <= today_date:
            monthly_dates.append(current_dt)
            # move to next month
            year = current_dt.year
            month = current_dt.month + 1
            if month > 12:
                month = 1
                year += 1
            current_dt = date(year, month, 1)

        # We only need to do a minimal approach:
        # - For about min(30% of all months, 24 months) => calls
        # - the rest => distributions
        if len(monthly_dates) == 0:
            # If no monthly date is found, skip
            continue

        cutoff = min(int(len(monthly_dates) * 0.30), 24)  # 30% or 2 years worth of months
        call_dates = monthly_dates[:cutoff]
        distribution_dates = monthly_dates[cutoff:]

        # calls are negative
        for cd in call_dates:
            # lognormal scale in millions
            amt = float(rng.lognormal(mean=1.0, sigma=1.0))  # around e^1 ~ 2.7
            # negative for calls
            amt = -amt
            cashflows_data.append(
                CashFlow(
                    fund_name=fund_name,
                    gp_name=gp_name,
                    date=cd,
                    amount_millions=amt,
                    type="Call"
                ).dict()
            )

        # distributions are positive
        for dd in distribution_dates:
            amt = float(rng.lognormal(mean=1.0, sigma=1.0))
            # positive for distributions
            cashflows_data.append(
                CashFlow(
                    fund_name=fund_name,
                    gp_name=gp_name,
                    date=dd,
                    amount_millions=amt,
                    type="Distribution"
                ).dict()
            )

    return {
        "funds": funds_data,
        "deals": deals_data,
        "cashflows": cashflows_data
    }
