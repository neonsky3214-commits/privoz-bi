from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os, secrets

router = APIRouter()
PASSWORD = os.environ.get("BI_PASSWORD", "privoz2025")
TOKENS   = set()

class LoginReq(BaseModel):
    password: str

def verify_token(request):
    token = request.headers.get("X-Token","")
    if token not in TOKENS:
        raise HTTPException(401, "Unauthorized")

@router.post("/login")
def login(req: LoginReq):
    if req.password != PASSWORD:
        raise HTTPException(401, "Неверный пароль")
    token = secrets.token_hex(32)
    TOKENS.add(token)
    return {"token": token}
