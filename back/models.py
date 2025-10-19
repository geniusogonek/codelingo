from pydantic import BaseModel


class UserLogin(BaseModel):
    username: str
    password: str


class UserRegistration(BaseModel):
    name: str
    username: str
    password: str
