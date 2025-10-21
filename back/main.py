import asyncio
from typing import List

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from uvicorn import Server, Config
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from models import UserRegistration, UserLogin, RegisterLanguages
from database.models import User
from database.database import (
    register_user,
    get_user,
    select_lessons,
    select_languages,
    select_topics,
    update_languages,
    get_solution
)

from database.core import get_session, init_models

from utils.jwt_module import encode_data
from utils.hash_module import check_password
from utils.code_equality_module import normalize_code

from dependencies import get_current_user


app = FastAPI()


@app.post("/login", response_class=JSONResponse)
async def login(user: UserLogin, session: AsyncSession = Depends(get_session)):
    user_db = await get_user(session=session, username=user.username)

    if user_db is None or not check_password(user.password, user_db.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The username or password is incorrect"
        )

    return {"jwt": encode_data(user.username)}


@app.post("/registration", response_class=JSONResponse)
async def registration(data: UserRegistration, session: AsyncSession = Depends(get_session)):
    try:
        user = register_user(
            session=session,
            name=data.name,
            username=data.username,
            password=data.password
        )
        await session.commit()
        return {"jwt": encode_data(data.username)}
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This username is already taken"
        )


@app.post("/register-languages", response_class=JSONResponse)
async def register_languages(
    languages: RegisterLanguages,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    try:
        await update_languages(
            session=session,
            user=current_user,
            known_language=languages.known_language,
            target_language=languages.target_language
        )
        await session.commit()
        return {"success": True}
    except Exception:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register languages"
        )


@app.get("/get-lessons-target", response_class=JSONResponse)
async def get_lessons(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if not current_user.target_language:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target language not set. Please register languages first."
        )

    lessons = await select_lessons(session=session, language=current_user.target_language)
    return [
        {
            "topic": lesson.topic,
            "explanation": lesson.explanation,
            "example": lesson.example,
            "exercise": lesson.exercise
        }
        for lesson in lessons
    ]


@app.get("/get-lessons-known", response_class=JSONResponse)
async def get_lessons(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if not current_user.known_language:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Known language not set. Please register languages first."
        )

    lessons = await select_lessons(session=session, language=current_user.known_language)
    return [
        {
            "topic": lesson.topic,
            "explanation": lesson.explanation,
            "example": lesson.example,
            "exercise": lesson.exercise
        }
        for lesson in lessons
    ]


@app.get("/get-topics")
async def get_topics(session: AsyncSession = Depends(get_session)):
    topics = await select_topics(session=session)
    return [topic.title for topic in topics]


@app.get("/get-languages")
async def get_languages(session: AsyncSession = Depends(get_session)):
    languages = await select_languages(session=session)
    return [language.title for language in languages]


@app.get("/check-solution")
async def check_solution(code: str, topic: str, language: str, session: AsyncSession = Depends(get_session)):
    solution = await get_solution(session=session, topic=topic, language=language)
    return {"result": normalize_code(code).strip() == solution.strip()}


async def main():
    await init_models()
    config = Config(app)
    server = Server(config)
    await server.serve()


if __name__ == "__main__":
    asyncio.run(main())