from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import APP_NAME, CORS_ORIGINS
from app.database import engine, Base
from app.api import collaborators, shifts, schedules, seed

Base.metadata.create_all(bind=engine)

app = FastAPI(title=APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(collaborators.router)
app.include_router(shifts.router)
app.include_router(schedules.router)
app.include_router(seed.router)


@app.get("/health")
def health():
    return {"status": "ok"}
