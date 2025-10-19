from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from .models import User
from utils.hash_module import get_hashed_password


def register_user(session: AsyncSession, name: str, username: str, password: str):
    hashed_password = get_hashed_password(password=password)
    user = User(name=name, username=username, hashed_password=hashed_password)
    session.add(user)
    return user


async def get_user(session: AsyncSession, username: str) -> User | None:
    user = await session.execute(select(User).where(User.username==username))
    return user.scalar_one_or_none()
