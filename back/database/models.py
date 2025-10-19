from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import Integer
from .core import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)
    name = Column(String)
    username = Column(String, unique=True)
    hashed_password = Column(String)