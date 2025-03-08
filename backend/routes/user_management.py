from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Request, Depends
from sqlmodel import Session
from models.user import User
from db.session import get_session

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
    
@router.put("/user-management")
async def update_user(request: Request, session: Session = Depends(get_session)):
    data = await request.json()
    user_id = data.get("id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user id.")
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.displayname = data.get("username", user.displayname)
    user.profile_picture = data.get("profilePicture", user.profile_picture)
    session.add(user)
    session.commit()
    return {"msg": "User updated."}
