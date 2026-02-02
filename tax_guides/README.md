# Tax Guides for Field Relevance Classification

This directory contains document-type-specific guides that help the LLM determine which extracted fields are relevant for Colombian tax declaration (Formulario 210).

## Rules
**1. DO NOT PERFORM CALCULATIONS**: Only extract values that are explicitly written in the document summary parts. Do not sum, subtract, or calculate totals yourself.
**2. NO HALLUCINATIONS**: If a field is not explicitly shown with a value, do not report it as 0. Only report what is actually written.
**3. USE MARKDOWN CONTEXT**: Use the markdown context to identify values.
**4. Default to NOT relevant.**  It's better to provide a clean list of certifiable totals than a cluttered list of transaction details.
**5. The Colombian tax authority** (DIAN) needs consolidated figures for Patrimonio, Rentas, and Deducciones.

## Available Guides

### Core Documents
- **`bank_statement_guide.json`** - Extractos bancarios (bank statements)
- **`payroll_guide.json`** - Comprobantes de nómina (payroll slips)
- **`invoice_guide.json`** - Facturas electrónicas (electronic invoices)
- **`income_certificate_guide.json`** - Certificados de ingresos y retenciones (annual income certificates)

### Fallback
- **`other_guide.json`** - Generic guide for unrecognized document types

## How It Works

### Two-Call LLM Approach

**Call 1: Extraction + Document Type Classification**
```python
# LLM extracts fields and identifies document type
result = {
    "document_type": "bank_statement",
    "fields": [
        {"name": "Intereses ganados", "value": "125,000"},
        {"name": "Número de cuenta", "value": "123-456789"}
    ]
}
```

**Call 2: Relevance Classification Using Guide**
```python
# Load the appropriate guide based on document_type
guide = load_json(f"tax_guides/{document_type}_guide.json")

# LLM classifies each field using the guide
classified = {
    "fields": [
        {
            "name": "Intereses ganados",
            "value": "125,000",
            "is_relevant": true,
            "form_210_mapping": "Casilla 58 - Rentas de capital",
            "reason": "Bank interest must be declared as capital gains",
            "confidence": "high"
        },
        {
            "name": "Número de cuenta",
            "value": "123-456789",
            "is_relevant": false,
            "reason": "Account numbers are administrative identifiers",
            "confidence": "high"
        }
    ]
}
```

## Guide Structure

Each guide JSON file contains:

- **`relevant_fields_to_look_for`** - Categories of fields that matter for tax, with:
  - Keywords to match
  - Form 210 mapping (which Casilla)
  - Reason for relevance
  - Importance level
  - Special notes

- **`typically_not_relevant`** - Common fields that don't affect tax calculation

- **`special_notes`** - Colombian tax law specifics for that document type

- **`common_variations`** - Different ways the same field might be named

## Adding New Document Types

To add a new document type:

1. Create `{document_type}_guide.json` in this directory
2. Follow the structure of existing guides
3. Include Colombian tax-specific rules
4. Test with real documents

## Document Type Mapping

| File Name | Document Type Code | Spanish Name |
|-----------|-------------------|--------------|
| bank_statement_guide.json | `bank_statement` | Extracto Bancario |
| payroll_guide.json | `payroll` | Comprobante de Nómina |
| invoice_guide.json | `invoice` | Factura Electrónica |
| income_certificate_guide.json | `income_certificate` | Certificado de Ingresos y Retenciones |
| dividends_certificate_guide.json | `dividends_certificate` | Certificado de Dividendos y Participaciones |
| property_tax_certificate_guide.json | `property_tax_certificate` | Certificado de Impuesto Predial |
| vehicle_tax_certificate_guide.json | `vehicle_tax_certificate` | Certificado de Impuesto de Vehículo |
| independent_contractor_certificate_guide.json | `independent_contractor_certificate` | Certificado de Retención Honorarios/Servicios |
| other_guide.json | `other` | Otro Documento |

## References

All guides are based on:
- **Formulario 210** - Declaración de Renta y Complementario (2023 y siguientes)
- **Colombian Tax Code (Estatuto Tributario)**
- **DIAN regulations** for electronic invoices and deductions

## Notes

- Guides are optimized for LLM context window efficiency
- Each guide is self-contained for its document type
- The `other_guide.json` provides fallback logic when document type is uncertain
- All monetary limits referenced in UVT (Unidad de Valor Tributario)
