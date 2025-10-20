from fastapi import Depends, HTTPException, Header

from sqlalchemy.ext.asyncio import AsyncSession

from database.database import get_user
from database.core import get_session

from utils.jwt_module import decode_data


async def get_current_user(
    authorization: str = Header(..., alias="Authorization"),
    session: AsyncSession = Depends(get_session)
):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization[7:]

    try:
        payload = decode_data(token)
        username = payload.get("username")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = await get_user(session, username=username)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user