from sqlmodel import create_engine, Session, SQLModel
from models.user import User

DATABASE_URL = "sqlite:///./database.db"

engine = create_engine(DATABASE_URL, echo=True)

def get_session():
    with Session(engine) as session:
        yield session

def init_db():
    SQLModel.metadata.create_all(engine)

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully!")
