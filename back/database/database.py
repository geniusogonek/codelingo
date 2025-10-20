from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from .models import User, Lesson
from utils.hash_module import get_hashed_password


def register_user(session: AsyncSession, name: str, username: str, password: str):
    hashed_password = get_hashed_password(password=password)
    user = User(
        name=name,
        username=username,
        hashed_password=hashed_password,
        known_language="",
        target_language=""
    )
    session.add(user)
    return user


async def update_languages(session: AsyncSession, user: User, known_language: str, target_language: str):
    selected = await session.execute(select(User).where(User.username==user.username))
    user = selected.scalar_one_or_none()
    if user is None:
        return {"error": "User is not found"}

    user.known_language = known_language
    user.target_language = target_language

    return {"success": "everything is ok"}


async def get_user(session: AsyncSession, username: str) -> User | None:
    user = await session.execute(select(User).where(User.username==username))
    return user.scalar_one_or_none()


async def select_lessons(session: AsyncSession) -> list[Lesson]:
    lessons = await session.execute(select(Lesson))
    return lessons.scalars().all()