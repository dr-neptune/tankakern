from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Request, Depends
import os
from sqlmodel import Session
from models.user import User
from db.session import get_session

router = APIRouter()

@router.post("/upload-profile-picture")
async def upload_profile_picture(user_id: int = Form(...), file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG and PNG are allowed.")
    uploads_dir = "uploads"
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)
    file_location = os.path.join(uploads_dir, file.filename)
    session = next(get_session())
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.profile_picture = file_location
    content = await file.read()
    with open(file_location, "wb") as f:
         f.write(content)
    session.add(user)
    session.commit()
    return {"filename": file.filename, "user_id": user_id}

@router.get("/{user_id}")
async def get_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user
    
