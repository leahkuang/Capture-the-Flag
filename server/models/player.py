from pydantic import BaseModel

class Player(BaseModel):
    id: str
    x: int
    y: int
    team: str
