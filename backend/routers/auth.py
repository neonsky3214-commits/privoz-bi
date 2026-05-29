from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import os, hashlib

router = APIRouter()
PASSWORD = os.environ.get("BI_PASSWORD", "privoz2025")

def _valid_token():
    # Deterministic token derived from password — survives restarts
    return hashlib.sha256(f"privoz-bi-{PASSWORD}".encode()).hexdigest()

class LoginReq(BaseModel):
    password: str

def verify_token(request: Request):
    token = request.headers.get("X-Token", "")
    if token != _valid_token():
        raise HTTPException(401, "Unauthorized")

@router.post("/login")
def login(req: LoginReq):
    if req.password != PASSWORD:
        raise HTTPException(401, "Неверный пароль")
    return {"token": _valid_token()}
