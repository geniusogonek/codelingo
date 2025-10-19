import asyncio

from fastapi import FastAPI, Depends
from fastapi.responses import JSONResponse
from uvicorn import Server, Config
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from models import UserRegistration, UserLogin

from database.database import register_user, get_user
from database.core import get_session, init_models

from utils.jwt_module import encode_data, decode_data
from utils.hash_module import check_password


app = FastAPI()


@app.post("/login", response_class=JSONResponse)
async def login(user: UserLogin, session: AsyncSession = Depends(get_session)):
    user_db = await get_user(session=session, username=user.username)

    if user_db is None or not check_password(user.password, user_db.hashed_password):
        return {"error": "The username or password is incorrect"}

    return {"jwt": encode_data(user.username)}


@app.post("/registration", response_class=JSONResponse)
async def registration(user: UserRegistration, session: AsyncSession = Depends(get_session)):
    username = user.username
    user = register_user(session=session, name=user.name, username=username, password=user.password)
    try:
        await session.commit()
        return {"jwt": encode_data(username)}
    except IntegrityError:
        await session.rollback()
        return {"error": "This username is alredy taken"}


async def main():
    await init_models()
    server = Server(Config(app))
    await server.serve()


if __name__ == "__main__":
    asyncio.run(main())
