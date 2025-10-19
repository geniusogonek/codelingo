from jwt import encode, decode
from settings import settings

JWT_SECRET_KEY: str = settings.JWT_SECRET_KEY


def encode_data(username: str) -> str:
    encoded_data = encode(payload={"username": username}, key=JWT_SECRET_KEY, algorithm="HS256")
    return encoded_data


def decode_data(jwt: str) -> dict:
    decoded_data: dict = decode(jwt=jwt, key=JWT_SECRET_KEY, algorithms=["HS256"])
    return decoded_data