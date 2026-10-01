from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    total_requests: int
    active_requests: int
    total_donors: int
    available_donors: int
    total_donations: int


class BloodGroupStats(BaseModel):
    blood_group: str
    count: int


class RequestAnalytics(BaseModel):
    date: str
    count: int


class FulfillmentAnalytics(BaseModel):
    date: str
    fulfilled: int
    unfulfilled: int
