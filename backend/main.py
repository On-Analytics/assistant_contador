from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import json
import os
import shutil
import uuid
import asyncio
from pathlib import Path
import pdf_utils
import vision_processor

app = FastAPI(title="TaxWorkbench API")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount temp directory to serve images
app.mount("/temp", StaticFiles(directory="temp"), name="temp")

@app.get("/")
async def root():
    return {"message": "Welcome to TaxWorkbench API"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    doc_id = str(uuid.uuid4())
    temp_dir = Path("temp") / doc_id
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    pdf_path = temp_dir / file.filename
    with open(pdf_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Convert PDF to images (async, non-blocking)
    image_paths = await pdf_utils.pdf_to_images_async(str(pdf_path), str(temp_dir / "pages"))
    
    # Process all pages in parallel using asyncio.gather
    page_tasks = [
        vision_processor.extract_chips_from_page(path, i + 1, pdf_path=str(pdf_path))
        for i, path in enumerate(image_paths)
    ]
    
    # Wait for all pages to be processed concurrently
    page_results = await asyncio.gather(*page_tasks)
    
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
        "image_urls": [f"http://localhost:8000/temp/{doc_id}/pages/page_{i+1}.png" for i in range(len(image_paths))]
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
