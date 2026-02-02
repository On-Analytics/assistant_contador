import os
from pathlib import Path
import fitz  # PyMuPDF
from PIL import Image
import base64
import io
import asyncio

def pdf_to_images(pdf_path: str, output_folder: str):
    """
    Converts each page of a PDF to an image and returns the paths.
    Uses PyMuPDF (fitz).
    """
    Path(output_folder).mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_path)
    image_paths = []
    
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        pix = page.get_pixmap()
        image_path = os.path.join(output_folder, f"page_{page_num+1}.png")
        pix.save(image_path)
        image_paths.append(image_path)
        
    doc.close()
    return image_paths

async def pdf_to_images_async(pdf_path: str, output_folder: str):
    """
    Async wrapper for pdf_to_images to enable non-blocking PDF conversion.
    """
    return await asyncio.to_thread(pdf_to_images, pdf_path, output_folder)

def encode_image(image_path: str):
    """
    Encodes an image to a base64 string for LLM processing.
    """
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def refine_chip_coordinates(pdf_path: str, page_num: int, chips: list):
    """
    Refines the coordinates of chips by searching for their values in the PDF text layer using PyMuPDF.
    Normalizes coordinates to 0-100 percentages.
    """
    try:
        doc = fitz.open(pdf_path)
        # page_num is 1-based, PyMuPDF is 0-based
        if page_num > len(doc):
            return chips
        
        page = doc[page_num - 1]
        width, height = page.rect.width, page.rect.height
        
        # Get all words from the page with their bounding boxes
        # words structure: (x0, y0, x1, y1, "word", block_no, line_no, word_no)
        words = page.get_text("words")
        
        for chip in chips:
            target_val = str(chip.get('value', ''))
            if not target_val:
                continue
                
            # Find all potential matches on the page
            matches = []
            
            # Helper to clean string for comparison (digits only)
            def clean_str(s): 
                return ''.join(filter(str.isdigit, s))
            
            target_digits = clean_str(target_val)
            if not target_digits:
                continue

            for w in words:
                w_text = w[4]
                w_digits = clean_str(w_text)
                
                # Check for exact match or if the word contains the value (e.g. $4,300)
                if target_digits == w_digits and len(target_digits) > 0:
                    matches.append(w)
                # Handle segmented numbers (e.g., "4." "300") - simplified for now:
                # If word is a partial match, we might need logic to combine neighbor words, 
                # but often PDFs group numbers well or "words" captures them okay.
                # Use strict single-word match for now to be safe.

            if matches:
                 # If multiple matches, find the one closest to the extensive LLM guess
                best_match = None
                min_dist = float('inf')
                
                # LLM center coordinates (0-100 scale)
                llm_cx = chip['x'] + (chip['width'] / 2)
                llm_cy = chip['y'] + (chip['height'] / 2)
                
                for m in matches:
                    # PDF coordinates (points)
                    x0, y0, x1, y1 = m[0], m[1], m[2], m[3]
                    
                    # Convert to percentages
                    pct_x = (x0 / width) * 100
                    pct_y = (y0 / height) * 100
                    pct_w = ((x1 - x0) / width) * 100
                    pct_h = ((y1 - y0) / height) * 100
                    
                    pct_cx = pct_x + (pct_w / 2)
                    pct_cy = pct_y + (pct_h / 2)
                    
                    # Euclidean distance squared
                    dist = (pct_cx - llm_cx)**2 + (pct_cy - llm_cy)**2
                    
                    if dist < min_dist:
                        min_dist = dist
                        best_match = (pct_x, pct_y, pct_w, pct_h)
                
                # Update chip with precise coordinates if a good match was found
                # Threshold: if the closest match is radically far away (>20% screen distance), keep LLM guess?
                # For now, trust the text search if fairly close or unique.
                if best_match:
                    chip['x'] = round(best_match[0], 2)
                    chip['y'] = round(best_match[1], 2)
                    chip['width'] = round(best_match[2], 2)
                    chip['height'] = round(best_match[3], 2)
                    
        doc.close()
        return chips
    except Exception:
        return chips
