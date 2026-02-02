import os
from openai import AsyncOpenAI
from dotenv import load_dotenv
import json
import asyncio
import pdf_utils
from pathlib import Path
# System uses Markdown guides directly

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
TAX_GUIDES_DIR = Path(__file__).parent.parent / "tax_guides"

DOCUMENT_TYPES = [
    "extracto_bancario",
    "nomina",
    "factura",
    "certificado_ingresos",
    "certificado_dividendos",
    "certificado_predial",
    "certificado_vehiculo",
    "retencion_fuente",
    "aportes_obligatorios_independiente",
    "aportes_voluntarios_afc",
    "certificado_medicina_prepagada",
    "saldos_cesantias",
    "otro"
]



def build_chip_prompt() -> str:
    """
    Build the extraction prompt for chip extraction.
    """
    base_prompt = f"""
Analyze the provided Colombian tax document image.

Your tasks:
1. **Classify the document type** - Determine which type of document this is from: {', '.join(DOCUMENT_TYPES)}
2. **Extract all numeric currency values** - Identify every numeric value (including zeros) with their labels
3. **Classify relevance** - Determine if each field is relevant for Colombian tax declaration (Form 210)

IMPORTANT - Colombian Number Formatting:
- Period (.) is used as THOUSANDS separator: 54.822 = fifty-four thousand, eight hundred twenty-two
- Comma (,) is used as DECIMAL separator: 54.822,21 = 54,822.21 in US format
- When converting to integer, remove periods and ignore decimals
- Examples:
  * "54.822,21" → 54822 (fifty-four thousand, eight hundred twenty-two)
  * "7.500.102,22" → 7500102 (seven million, five hundred thousand, one hundred two)
  * "26,15" → 26 (twenty-six)

CRITICAL - Use VISUAL CONTEXT for relevance classification:
- Look at WHERE each field appears on the document image
- Fields in summary/header sections are often relevant
- Fields in detail tables (individual transactions) are often NOT relevant
- Consider the visual layout, section headers, and position on page
"""
    
    
    base_prompt += """

For each numeric value found, provide:
- `value`: The numeric amount as an integer (remove periods, ignore decimals after comma)
- `label`: The text label that explains this number (e.g., "Intereses", "Saldo Final", "Comisiones")
- `is_relevant`: true if relevant for tax declaration, false if not
- `relevance_reason`: Brief explanation why it is or isn't relevant (1-2 sentences)
- `relevance_confidence`: "alta", "media", or "baja"

Return a JSON object with:
- `document_type`: One of the document types listed above
- `confidence`: "alta", "media", or "baja" for document classification confidence
- `chips`: Array of chip objects with all fields above

Example: {{
  "document_type": "extracto_bancario",
  "confidence": "alta",
  "chips": [
    {{
      "value": 54822,
      "label": "SALDO ACTUAL",
      "is_relevant": true,
      "relevance_reason": "Saldo final es parte del patrimonio bruto",
      "relevance_confidence": "alta"
    }},
    {{
      "value": 44,
      "label": "ABONO INTERESES AHORROS",
      "is_relevant": false,
      "relevance_reason": "Transacción individual del detalle, no es un total",
      "relevance_confidence": "alta"
    }}
  ]
}}
"""
    return base_prompt


async def convert_to_markdown(image_path: str, page_num: int) -> dict:
    """
    Convert document image to structured markdown.
    
    Args:
        image_path: Path to the page image
        page_num: Page number
    
    Returns:
        dict with keys:
            - markdown: Structured markdown representation
            - document_type: Classified document type (only for page 1)
            - confidence: Classification confidence (only for page 1)
    """
    base64_image = pdf_utils.encode_image(image_path)
    
    prompt = f"""
Convert this Colombian tax document image to structured markdown.

**Your Tasks:**
1. **Identify document type** (only if this is page 1): {', '.join(DOCUMENT_TYPES)}
2. **Convert to structured markdown** preserving the document's organization

**Markdown Structure Requirements:**

Use headers to denote sections:
- `#` for document title
- `##` for major sections (e.g., "Resumen del Período", "Detalle de Transacciones")
- `###` for subsections

Use appropriate markdown elements:
- **Bold** for labels/field names
- Tables for transaction lists (with headers: Fecha, Descripción, Valor, etc.)
- Bullet lists for summary items
- Preserve ALL numeric values EXACTLY as shown (with periods and commas)

**Critical:** Preserve the visual structure so a text model can distinguish:
- Summary/totals sections (use ## headers like "## Resumen" or "## Totales")
- Transaction detail tables (use markdown tables with dates in first column)

**Example Output Structure:**
```markdown
# BANCO XYZ - Extracto Bancario

## Información de la Cuenta
- **Titular**: Juan Pérez
- **Cuenta**: 123-456-789

## Resumen del Período
- **Saldo Inicial**: $326,814
- **Total Abonos**: $7,500,102
- **Total Cargos**: $7,772,194
- **Saldo Final**: $54,822

## Detalle de Transacciones
| Fecha | Descripción | Débito | Crédito | Saldo |
|-------|-------------|--------|---------|-------|
| 01/07 | Abono Intereses | | 44 | 326,858 |
| 02/07 | Pago Tarjeta | 100 | | 326,758 |
```

Return JSON:
{{
  "document_type": "extracto_bancario" (only for page 1, null for other pages),
  "confidence": "alta/media/baja" (only for page 1, null for other pages),
  "markdown": "# Document title\\n\\n## Section..."
}}
"""
    
    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are a document converter specialized in Colombian tax documents. Return valid JSON with 'document_type' (str or null), 'confidence' (str or null), and 'markdown' (str) keys."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            response_format={ "type": "json_object" },
            temperature=0
        )
        
        message = response.choices[0].message
        content = message.content
        if not content:
            return {"markdown": "", "document_type": None, "confidence": None}
        
        data = json.loads(content)
        markdown = data.get("markdown", "")
        document_type = data.get("document_type") if page_num == 1 else None
        confidence = data.get("confidence") if page_num == 1 else None
        
        # Progress logging removed
        
        return {
            "markdown": markdown,
            "document_type": document_type,
            "confidence": confidence
        }
        
    except Exception as e:
        print(f"Markdown Conversion Error: {e}")
        return {"markdown": "", "document_type": None, "confidence": None}


async def extract_chips_from_page(image_path: str, page_num: int, pdf_path: str = None, document_type: str = None):
    """
    Extract chips, classify document type, and determine relevance from a page image.
    
    Args:
        image_path: Path to the page image
        page_num: Page number
        pdf_path: Optional path to source PDF
        document_type: Optional known document type (for loading specific guide)
    
    Returns:
        dict with keys:
            - chips: List of extracted chips with relevance metadata
            - document_type: Classified document type (only for page 1)
            - confidence: Classification confidence (only for page 1)
    """
    base64_image = pdf_utils.encode_image(image_path)
    
    # Build prompt for chip extraction
    prompt = build_chip_prompt()
    
    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional tax document parser with expertise in Colombian Form 210. You must return a valid JSON object with 'document_type', 'confidence', and 'chips' keys. Each chip must have: value (int), label (str), is_relevant (bool), relevance_reason (str), relevance_confidence (str)."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            response_format={ "type": "json_object" },
            temperature=0
        )
        
        message = response.choices[0].message
        content = message.content
        finish_reason = response.choices[0].finish_reason
        
        if not content:
            return {"chips": [], "document_type": None, "confidence": None}
            
        data = json.loads(content)
        chips = data.get("chips", [])
        document_type = data.get("document_type")
        confidence = data.get("confidence")
        
        # Enrich chips with page metadata
        for chip in chips:
            chip["page"] = page_num
        
        # Only return document type for first page
        result = {"chips": chips}
        if page_num == 1:
            result["document_type"] = document_type
            result["confidence"] = confidence
            # Progress logging removed
            
        return result
    except Exception as e:
        print(f"Vision Processing Error: {e}")
        return {"chips": [], "document_type": None, "confidence": None}
