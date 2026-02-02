import os
from openai import AsyncOpenAI
from dotenv import load_dotenv
from pathlib import Path
from schemas.document_specific_schemas import (
    DOCUMENT_TYPE_TO_SCHEMA,
    get_schema_for_document_type
)

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
TAX_GUIDES_DIR = Path(__file__).parent.parent / "tax_guides"


def load_document_guide(document_type: str) -> str:
    """
    Load the tax guide for a specific document type.
    Returns the guide content or empty string if not found.
    """
    try:
        md_filename = f"{document_type}_guide.md"
        md_path = TAX_GUIDES_DIR / md_filename
        
        if md_path.exists():
            with open(md_path, 'r', encoding='utf-8') as f:
                return f.read()
    except Exception as e:
        print(f"Warning: Could not load guide for {document_type}: {e}")
    
    return ""


def schema_to_chips(schema_data: dict, schema_class) -> list[dict]:
    """
    Convert schema-extracted data to chip format for frontend display.
    
    Args:
        schema_data: Dictionary of extracted fields from Pydantic schema
        schema_class: The Pydantic schema class used
    
    Returns:
        List of chip dictionaries
    """
    chips = []
    
    # Get field definitions from schema
    for field_name, field_info in schema_class.model_fields.items():
        value = schema_data.get(field_name)
        
        # Skip None values and identification fields
        if value is None:
            continue
        
        # Skip non-monetary identification fields
        skip_fields = ['nit', 'cedula', 'nombre', 'numero', 'placa', 'direccion', 
                      'entidad', 'tipo', 'mes', 'año', 'fecha', 'periodo', 'descripcion']
        if any(skip in field_name.lower() for skip in skip_fields):
            continue
        
        # Convert field name to display label
        label = field_name.replace('_', ' ').title()
        
        # Only create chips for numeric values
        if isinstance(value, (int, float)):
            chip = {
                "label": label,
                "value": float(value),
                "field_name": field_name
            }
            chips.append(chip)
    
    return chips


async def extract_from_markdown(
    markdown: str,
    document_type: str,
    page_num: int = 1,
    model: str = "gpt-4o-mini"
) -> list[dict]:
    """
    Extract structured data using document-specific schemas.
    
    Args:
        markdown: Markdown representation of the document
        document_type: Type of document for schema selection
        page_num: Page number (for metadata)
        model: LLM model to use
    
    Returns:
        List of chip dictionaries
    """
    # Load the document-specific guide
    guide = load_document_guide(document_type)
    
    # Get the appropriate schema
    try:
        schema_class = get_schema_for_document_type(document_type)
    except ValueError:
        print(f"Warning: Unknown document type '{document_type}', using generic extraction")
        schema_class = get_schema_for_document_type("otro")
    
    # Build system prompt with role and guide
    system_prompt = f"""
You are an expert in Colombian tax law and Form 210 tax declarations.

You are analyzing a {document_type.replace('_', ' ').title()} document.

{guide if guide else 'Extract all relevant fields from this tax document.'}

IMPORTANT RULES:
- ONLY extract values that are EXPLICITLY present in the document
- DO NOT perform calculations or sum values yourself
- DO NOT hallucinate or invent values
- If a field is not present, leave it as null
- Convert Colombian number format (1.234,56) to proper numbers
- Focus on totals and summary values, not individual transaction details

Return the extracted data in the specified JSON schema format.
"""
    
    user_prompt = f"""
Document Content (Markdown):

{markdown}

---

Extract the relevant fields from this document according to the schema.
"""
    
    try:
        # Use structured outputs with Pydantic schema
        response = await client.beta.chat.completions.parse(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format=schema_class,
            temperature=0
        )
        
        # Get parsed response
        parsed = response.choices[0].message.parsed
        
        if not parsed:
            return []
        
        # Convert to dictionary
        schema_data = parsed.model_dump()
        
        # Convert schema data to chips
        chips = schema_to_chips(schema_data, schema_class)
        
        # Add page metadata
        for chip in chips:
            chip["page"] = page_num
        
        return chips
        
    except Exception as e:
        print(f"Schema Extraction Error: {e}")
        import traceback
        traceback.print_exc()
        return []
