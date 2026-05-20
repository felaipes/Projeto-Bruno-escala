import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./escala.db")
APP_NAME = os.getenv("APP_NAME", "Motor de Escalas API")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
