from pydantic import BaseModel
from typing import List, Optional

class ValueChip(BaseModel):
    id: str
    value: float
    label: str
    x: float
    y: float
    width: float
    height: float
    page: int
    doc_id: str

class SelectionBucket(BaseModel):
    id: str  # Line number in Form 210
    name: str
    total_value: float = 0.0
    chips: List[str] = []  # List of chip IDs mapped to this bucket
    notes: Optional[str] = None

class TaxState(BaseModel):
    doc_id: str
    buckets: List[SelectionBucket]
    unmapped_chips: List[ValueChip]
