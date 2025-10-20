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
    known_language = Column(String)
    target_language = Column(String)


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)
    programming_language = Column(String)
    topic = Column(String)
    explanation = Column(String)
    example = Column(String)
    exercise = Column(String)


class Language(Base):
    __tablename__ = "languages"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)
    title = Column(String)


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)
    title = Column(String)