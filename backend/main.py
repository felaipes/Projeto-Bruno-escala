from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models import ScheduleRequest, ScheduleResult
from app.engine import SchedulingEngine

app = FastAPI(title="Motor de Escalas API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/schedule/type-1", response_model=ScheduleResult)
def generate_type_1(request: ScheduleRequest):
    try:
        engine = SchedulingEngine(request)
        result = engine.generate_type_1_schedule()
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
