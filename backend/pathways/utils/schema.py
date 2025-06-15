from pydantic import BaseModel
from typing import List

class Week(BaseModel):
    learning_goal: str

class Unit(BaseModel):
    name: str
    description: str
    weeks: List[Week]

class CurriculumResponse(BaseModel):
    units: List[Unit]
