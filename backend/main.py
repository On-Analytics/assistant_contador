from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import json
import os
import shutil
import uuid
import asyncio
import base64
from pathlib import Path
from dotenv import load_dotenv
import pdf_utils
import vision_processor

# Load environment variables
load_dotenv()

# Create temp directory if it doesn't exist
temp_dir = Path(__file__).parent / "temp"
temp_dir.mkdir(exist_ok=True)

app = FastAPI(title="TaxWorkbench API")

# Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount temp directory to serve images
app.mount("/temp", StaticFiles(directory=str(temp_dir)), name="temp")

@app.on_event("startup")
async def startup_event():
    # Clean up old temp files on startup to ensure privacy from previous runs
    if temp_dir.exists():
        for item in temp_dir.iterdir():
            if item.is_dir():
                try:
                    shutil.rmtree(item)
                    print(f"Cleaned up old temp directory: {item}")
                except Exception as e:
                    print(f"Error cleaning up {item}: {e}")

@app.get("/")
async def root():
    return {"message": "Welcome to TaxWorkbench API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "TaxWorkbench API"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    doc_id = str(uuid.uuid4())
    temp_dir_path = temp_dir / doc_id
    temp_dir_path.mkdir(parents=True, exist_ok=True)
    
    pdf_path = temp_dir_path / file.filename
    with open(pdf_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Convert PDF to images (async, non-blocking)
    pages_dir = temp_dir_path / "pages"
    image_paths = await pdf_utils.pdf_to_images_async(str(pdf_path), str(pages_dir))
    
    # Process all pages in parallel using asyncio.gather
    page_tasks = [
        vision_processor.extract_chips_from_page(path, i + 1, pdf_path=str(pdf_path))
        for i, path in enumerate(image_paths)
    ]
    
    # Wait for all pages to be processed concurrently
    page_results = await asyncio.gather(*page_tasks)
    
    # Encode images to Base64 and delete them
    b64_images = []
    for path in image_paths:
        with open(path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            b64_images.append(f"data:image/png;base64,{encoded_string}")
            
    # CRITICAL: Clean up disk immediately after processing/encoding
    try:
        shutil.rmtree(temp_dir_path)
    except Exception as e:
        print(f"Cleanup error for {doc_id}: {e}")
    
    # Flatten results and add metadata
    all_chips = []
    for chips in page_results:
        for chip in chips:
            chip["id"] = str(uuid.uuid4())
            chip["doc_id"] = doc_id
        all_chips.extend(chips)
        
    return {
        "doc_id": doc_id,
        "filename": file.filename,
        "status": "processed",
        "chips": all_chips,
        "image_urls": b64_images # Now contains Base64 Data URLs instead of server paths
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
