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
                except Exception:
                    pass

@app.get("/")
async def root():
    return {"message": "Welcome to TaxWorkbench API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "TaxWorkbench API"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Original upload endpoint - extracts numeric chips only."""
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
    for page_result in page_results:
        chips = page_result.get("chips", [])  # Extract chips from dict
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


@app.post("/upload-with-relevance")
async def upload_document_with_relevance(file: UploadFile = File(...)):
    """
    Upload endpoint with field relevance classification.
    
    Two-stage flow:
    1. Vision model converts images to structured markdown
    2. Text model extracts and classifies fields from markdown
    """
    import text_extractor
    
    doc_id = str(uuid.uuid4())
    temp_dir_path = temp_dir / doc_id
    temp_dir_path.mkdir(parents=True, exist_ok=True)
    
    pdf_path = temp_dir_path / file.filename
    with open(pdf_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Convert PDF to images
    pages_dir = temp_dir_path / "pages"
    image_paths = await pdf_utils.pdf_to_images_async(str(pdf_path), str(pages_dir))
    
    try:
        # STAGE 1: Vision model converts to markdown
        markdown_tasks = [
            vision_processor.convert_to_markdown(path, i + 1)
            for i, path in enumerate(image_paths)
        ]
        markdown_results = await asyncio.gather(*markdown_tasks)
        
        if not markdown_results:
            return {"error": "No pages were processed"}

        # Get document type from first page
        document_type = markdown_results[0].get("document_type")
        confidence = markdown_results[0].get("confidence")
        
        # Combine all markdown pages into one document
        full_markdown = ""
        for i, md_result in enumerate(markdown_results):
            markdown_content = md_result.get("markdown", "")
            full_markdown += f"\n\n--- PAGE {i+1} ---\n\n" + markdown_content
        
        # STAGE 2: Text model extracts from ENTIRE document (not per page)
        all_chips = await text_extractor.extract_from_markdown(
            full_markdown,
            document_type,
            page_num=1,  # Not used anymore, but kept for compatibility
            model="gpt-4o-mini"
        )
        
        # Encode images to Base64
        b64_images = []
        for path in image_paths:
            with open(path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                b64_images.append(f"data:image/png;base64,{encoded_string}")
        
        # Clean up disk
        try:
            shutil.rmtree(temp_dir_path)
        except Exception:
            pass
        
        # Add metadata to chips
        for chip in all_chips:
            chip["id"] = str(uuid.uuid4())
            chip["doc_id"] = doc_id
        
        return {
            "doc_id": doc_id,
            "filename": file.filename,
            "status": "processed",
            "document_type": document_type,
            "classification_confidence": confidence,
            "chips": all_chips,
            "image_urls": b64_images,
            "total_fields": len(all_chips),
            "markdown": full_markdown,
            "markdown_preview": full_markdown[:500]
        }
    except Exception as e:
        print(f"Global Endpoint Error: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e), "status": "failed"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

