"""
AttendX Backend - FastAPI Server
================================
This server handles login requests and scrapes attendance data from the student portal.

SECURITY NOTE: Credentials are NEVER stored. They are only used temporarily
to authenticate with the student portal and are immediately discarded.
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import uvicorn

from scraper import AttendanceScraper

# Initialize FastAPI app
app = FastAPI(
    title="AttendX API",
    description="Secure student attendance scraping API",
    version="1.0.0"
)

# Configure CORS for frontend access.
# Set CORS_ORIGINS as a comma-separated list in production.
def _normalize_origin(origin: str) -> str:
    if origin == "*":
        return origin
    return origin.strip().rstrip("/")


default_origins = [
    _normalize_origin("http://localhost:5173"),  # Vite dev server
    _normalize_origin("http://localhost:3000"),  # Alternative dev server
    _normalize_origin("http://127.0.0.1:5173"),
    _normalize_origin("http://127.0.0.1:3000"),
]

env_origins = [
    _normalize_origin(origin)
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]

allow_all_origins = "*" in env_origins
allowed_origins = ["*"] if allow_all_origins else list(dict.fromkeys(default_origins + env_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=not allow_all_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class LoginRequest(BaseModel):
    """Login request model"""
    username: str
    password: str


class InitLoginRequest(BaseModel):
    """Init login request - Step 1 of CAPTCHA flow"""
    username: str
    password: str


class CompleteLoginRequest(BaseModel):
    """Complete login request - Step 2 of CAPTCHA flow"""
    session_id: str
    captcha_code: str


class SubjectAttendance(BaseModel):
    """Individual subject attendance"""
    name: str
    attendance: int
    totalClasses: Optional[int] = None
    attendedClasses: Optional[int] = None
    ltps: Optional[str] = None
    tcbr: Optional[int] = None


class TimetableClass(BaseModel):
    """Individual timetable class"""
    code: str
    name: str
    type: str
    room: str
    section: Optional[str] = None


class LoginResponse(BaseModel):
    """Successful login response"""
    success: bool
    student_name: str
    subjects: List[SubjectAttendance]
    timetable: Optional[dict] = None


class InitLoginResponse(BaseModel):
    """Init login response with CAPTCHA"""
    success: bool
    session_id: Optional[str] = None
    captcha_image: Optional[str] = None  # Base64 encoded image
    message: Optional[str] = None


class ErrorResponse(BaseModel):
    """Error response"""
    success: bool = False
    message: str


# API Endpoints
@app.get("/")
async def root():
    """Root endpoint - API info"""
    return {
        "name": "AttendX API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


# ============= TWO-STEP CAPTCHA LOGIN FLOW =============

@app.post("/init-login")
async def init_login(request: InitLoginRequest):
    """
    Step 1: Initialize login and get CAPTCHA image
    
    Returns a session_id and base64-encoded CAPTCHA image.
    The session_id must be used in /complete-login with the CAPTCHA code.
    """
    if not request.username or not request.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required"
        )
    
    try:
        scraper = AttendanceScraper(headless=True)
        result = scraper.init_login(
            username=request.username,
            password=request.password
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Failed to initialize login")
            )
        
        return {
            "success": True,
            "session_id": result["session_id"],
            "captcha_image": result["captcha_image"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error during init login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}"
        )


@app.post("/complete-login", response_model=LoginResponse)
async def complete_login(request: CompleteLoginRequest):
    """
    Step 2: Complete login with CAPTCHA code and fetch attendance
    
    Requires the session_id from /init-login and the CAPTCHA code entered by user.
    """
    if not request.session_id or not request.captcha_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session ID and CAPTCHA code are required"
        )
    
    try:
        scraper = AttendanceScraper(headless=True)
        result = scraper.complete_login(
            session_id=request.session_id,
            captcha_code=request.captcha_code
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=result.get("message", "Login failed")
            )
        
        return LoginResponse(
            success=True,
            student_name=result["student_name"],
            subjects=[
                SubjectAttendance(**subject) 
                for subject in result["subjects"]
            ],
            timetable=result.get("timetable", {})
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error during complete login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}"
        )

# ============= END TWO-STEP CAPTCHA LOGIN FLOW =============


@app.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Login and fetch attendance data
    
    This endpoint:
    1. Validates the credentials format
    2. Uses Selenium to login to the student portal
    3. Scrapes attendance data
    4. Returns the data (credentials are NOT stored)
    
    Args:
        request: LoginRequest with username and password
        
    Returns:
        LoginResponse with student name and attendance data
        
    Raises:
        HTTPException: For invalid credentials or scraping errors
    """
    # Validate input
    if not request.username or not request.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required"
        )
    
    try:
        # Initialize scraper with headless=False for debugging (you can see Chrome window)
        scraper = AttendanceScraper(headless=False)
        result = scraper.fetch_attendance(
            username=request.username,
            password=request.password
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=result.get("message", "Login failed")
            )
        
        return LoginResponse(
            success=True,
            student_name=result["student_name"],
            subjects=[
                SubjectAttendance(**subject) 
                for subject in result["subjects"]
            ]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error during login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching attendance: {str(e)}"
        )


# Demo endpoint for testing without real scraping
@app.post("/demo")
async def demo_login(request: LoginRequest):
    """
    Demo endpoint that returns mock data without actual scraping.
    Use this for frontend development and testing.
    """
    import random
    
    # Generate random attendance between 50-95
    def random_attendance():
        return random.randint(50, 95)
    
    mock_subjects = [
        {"name": "Mathematics", "attendance": random_attendance(), "totalClasses": 40, "attendedClasses": 34},
        {"name": "Physics", "attendance": random_attendance(), "totalClasses": 35, "attendedClasses": 25},
        {"name": "Chemistry", "attendance": random_attendance(), "totalClasses": 38, "attendedClasses": 35},
        {"name": "Computer Science", "attendance": random_attendance(), "totalClasses": 42, "attendedClasses": 38},
        {"name": "English", "attendance": random_attendance(), "totalClasses": 30, "attendedClasses": 24},
        {"name": "Electronics", "attendance": random_attendance(), "totalClasses": 36, "attendedClasses": 28},
    ]
    
    return {
        "success": True,
        "student_name": request.username or "Demo Student",
        "subjects": mock_subjects
    }


if __name__ == "__main__":
    print("Starting AttendX API Server...")
    print("API Documentation: http://localhost:8000/docs")
    print("Demo endpoint: POST http://localhost:8000/demo")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
