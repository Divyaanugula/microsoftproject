from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routes import incident

load_dotenv()

app = FastAPI(title="OpsEcho API", description="Incident Post-Mortem & On-Call Agent Backend")

# Add CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(incident.router, prefix="/api/incidents", tags=["incidents"])

@app.get("/")
async def root():
    return {"message": "Welcome to OpsEcho API"}

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "OpsEcho API"}
