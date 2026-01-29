import os
from openai import AsyncOpenAI
from dotenv import load_dotenv
import json
import asyncio
import pdf_utils

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

CHIP_PROMPT = """
Analyze the provided document image for numeric data extraction.
Your task is to identify every numeric currency value (digits) and their EXACT physical locations on the page.

For each numeric value found, provide:
1. `value`: The numeric amount as an integer. (Ignore decimals if they are .00)
2. `label`: The text label on the far left of the row that explains this number.
3. `x`, `y`, `width`, `height`: The spatial coordinates as percentages (0-100) of the total image size.
   - **CRITICAL**: The bounding box (x, y, width, height) MUST enclose the actual NUMERIC DIGITS in the document, NOT the label text.
   - Use centesimal percentages (e.g., 55.25).

Return a JSON object with a 'chips' key containing an array of these objects.
Example: {"chips": [{"value": 187, "label": "Rendimientos Financieros", "x": 65.2, "y": 42.1, "width": 8.5, "height": 2.0}]}
"""

async def extract_chips_from_page(image_path: str, page_num: int, pdf_path: str = None):
    base64_image = pdf_utils.encode_image(image_path)
    print(f"--- Processing Page {page_num} | Path: {image_path} ---")
    
    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional tax document parser. You must return a valid JSON object with a 'chips' key containing an array of found currency values. Every object in 'chips' must have: value (int), label (str), x (float), y (float), width (float), height (float)."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": CHIP_PROMPT},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            response_format={ "type": "json_object" }
        )
        
        message = response.choices[0].message
        content = message.content
        finish_reason = response.choices[0].finish_reason
        
        print(f"Finish Reason: {finish_reason}")
        print(f"LLM Response: {content}")
        
        if not content:
            # If content is None, maybe it's a refusal or safety issue
            if hasattr(message, 'refusal') and message.refusal:
                print(f"Refusal: {message.refusal}")
            return []
            
        data = json.loads(content)
        chips = data.get("chips", [])
        
        # Refine coordinates if PDF path is available (run in thread pool to avoid blocking)
        if pdf_path and os.path.exists(pdf_path):
            print(f"Refining coordinates for {len(chips)} chips using PDF text layer...")
            chips = await asyncio.to_thread(pdf_utils.refine_chip_coordinates, pdf_path, page_num, chips)
        
        # Enrich with page metadata
        for chip in chips:
            chip["page"] = page_num
            
        return chips
    except Exception as e:
        print(f"Error in vision processing: {str(e)}")
        import traceback
        traceback.print_exc()
        return []
