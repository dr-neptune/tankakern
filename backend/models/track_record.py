from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import date

class Fund(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    fund_name: str
    gp_name: str
    vintage_year: int
    net_irr: float
    net_dpi: float
    net_tvpi: float
    stage: str
    geo: str

class Deal(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    fund_name: str
    gp_name: str
    company_name: str
    stage: str
    geo: str
    total_value: float
    total_cost: float
    realized_value: float
    realized_cost: float
    tv_tc: float
    realized: bool

class CashFlow(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    fund_name: str
    gp_name: str
    date: date
    amount_millions: float
    type: str  # "Call" or "Distribution"
