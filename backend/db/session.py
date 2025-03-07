from sqlmodel import create_engine, Session, SQLModel

DATABASE_URL = "sqlite:///./database.db"  # Modify this URL for your production database

engine = create_engine(DATABASE_URL, echo=True)

def get_session():
    with Session(engine) as session:
        yield session

def init_db():
    SQLModel.metadata.create_all(engine)
