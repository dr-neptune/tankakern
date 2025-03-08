from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from sqlmodel import Session
from backend.models.user import User
from backend.db.session import get_session

router = APIRouter()

@router.post("/user-management/upload-profile-picture")
async def upload_profile_picture(user_id: int = Form(...), file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG and PNG are allowed.")
    file_location = f"uploads/{file.filename}"
    session = next(get_session())
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.profile_picture = file_location
    session.add(user)
    session.commit()
    return {"filename": file.filename, "user_id": user_id}
