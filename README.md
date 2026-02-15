# ASSISTANT_CONTADOR

A tax form processing assistant for Colombian tax forms (Formulario 210).

## Overview

This application provides automated processing and analysis of Colombian tax documents, specifically designed for Formulario 210 (2025). It uses schema-driven extraction with LLM-powered analysis to extract structured data from tax documents and display them in a modern web interface.

## Features

- **Schema-Driven Extraction**: Document-specific Pydantic schemas for precise data extraction
- **Tax Guide Prompts**: Context-aware LLM prompts for each document type
- **PDF Processing**: Extract and analyze tax form data from PDF documents
- **Vision Processing**: Advanced OCR and document analysis using GPT-4 Vision
- **Modern UI**: React-based frontend with TypeScript and drag-and-drop functionality
- **Chip Display**: Visual representation of extracted monetary values

## Architecture

The system uses a two-stage extraction process:
1. **Vision Processing**: Convert PDF pages to markdown using GPT-4 Vision
2. **Schema Extraction**: Use document-specific schemas and tax guides to extract structured data

## Supported Document Types

- **Certificado de Ingresos y Retenciones** (Income Certificate)
- **Extracto Bancario** (Bank Statement)
- **Certificado de Dividendos** (Dividend Certificate)
- **Retención en la Fuente** (Withholding Tax Certificate)
- **Aportes Obligatorios Independiente** (Independent Worker Social Security)
- **Aportes Voluntarios AFC** (Voluntary Pension/AFC Contributions)
- **Certificado Medicina Prepagada** (Prepaid Medicine Certificate)
- **Saldos y Cesantías** (Severance Balance Certificate)
- **Certificado Predial** (Property Tax Certificate)
- **Certificado Vehículo** (Vehicle Tax Certificate)
- **Nómina** (Payroll Statement)
- **Factura** (Invoice)
- **Otro** (Generic Document)

## Project Structure

```
ASSISTANT_CONTADOR/
├── backend/                 # Python backend API
│   ├── main.py             # FastAPI main application
│   ├── pdf_utils.py        # PDF processing utilities
│   ├── vision_processor.py # Computer vision processing
│   ├── text_extractor.py   # Schema-based text extraction
│   ├── schemas/            # Document-specific Pydantic schemas
│   │   └── document_specific_schemas.py
│   ├── requirements.txt    # Python dependencies
│   └── temp/               # Temporary file storage (gitignored)
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── PDFCanvas.tsx
│   │   │   └── ExtractionSidebar.tsx
│   │   ├── App.tsx        # Main application component
│   │   ├── main.tsx       # Entry point
│   │   └── index.css      # Global styles
│   ├── public/            # Static assets
│   ├── package.json       # Node.js dependencies
│   └── vite.config.ts     # Vite configuration
├── tax_guides/            # Document-specific extraction guides
│   ├── certificado_ingresos_guide.md
│   ├── extracto_bancario_guide.md
│   ├── certificado_dividendos_guide.md
│   ├── retencion_fuente_guide.md
│   ├── aportes_obligatorios_independiente_guide.md
│   ├── aportes_voluntarios_afc_guide.md
│   ├── certificado_medicina_prepagada_guide.md
│   ├── saldos_cesantias_guide.md
│   ├── certificado_predial_guide.md
│   ├── certificado_vehiculo_guide.md
│   ├── nomina_guide.md
│   ├── factura_guide.md
│   └── otro_guide.md
├── .gitignore             # Git ignore rules
├── README.md              # This file
└── Formulario_210_2025.pdf # Sample tax form
```

## Technology Stack

### Backend
- **Python 3.14+**
- **FastAPI** - Web framework
- **Pydantic** - Data validation and schemas
- **OpenAI GPT-4 Vision** - Document analysis
- **OpenAI GPT-4o-mini** - Text extraction
- **PDF processing libraries**

### Frontend
- **React** with TypeScript
- **Vite** - Build tool
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Modern CSS** - Styling
- **ESLint** - Code linting

## Getting Started

### Prerequisites
- Python 3.14+
- Node.js 18+
- npm or yarn
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/On-Analytics/assistant_contador
   cd ASSISTANT_CONTADOR
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment Variables**
   
   Create a `.env` file in the backend directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

   Create a `.env` file in the frontend directory:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   python main.py
   ```

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```

The frontend will be available at `http://localhost:5173` and the backend API at `http://localhost:8000`.

## Usage

1. **Upload Documents**: Upload PDF tax forms through the web interface
2. **Automatic Processing**: The system automatically:
   - Converts PDF pages to markdown using vision processing
   - Identifies document type
   - Extracts structured data using document-specific schemas
   - Displays extracted values as interactive chips
3. **Interact with Chips**: Drag and drop chips to organize them
4. **Review Results**: View all extracted monetary values in the sidebar

## Extraction Process

### 1. Document Classification
The system first classifies the document type using GPT-4 Vision.

### 2. Schema Selection
Based on the document type, the appropriate Pydantic schema is selected for structured extraction.

### 3. Context-Aware Extraction
The system loads the corresponding tax guide and uses it as context for the LLM to extract specific fields.

### 4. Chip Generation
Extracted numeric values are converted to "chips" that can be displayed and manipulated in the frontend.

## Tax Guides

Each document type has a corresponding guide in the `tax_guides/` directory that provides:
- Role definition for the LLM
- Extraction guidelines specific to that document type
- Critical rules and red flags to watch for
- Field mappings to Form 210

## API Endpoints

### POST /upload-with-relevance
Upload and process a PDF document.

**Request**: multipart/form-data with file
**Response**: JSON with extracted chips and metadata

```json
{
  "doc_id": "uuid",
  "filename": "document.pdf",
  "status": "processed",
  "document_type": "certificado_ingresos",
  "chips": [
    {
      "id": "uuid",
      "label": "Salarios",
      "value": 50000000,
      "page": 1,
      "doc_id": "uuid",
      "field_name": "salarios"
    }
  ],
  "total_fields": 1
}
```

## Development

### Adding New Document Types

1. **Create Schema**: Add a new Pydantic schema in `backend/schemas/document_specific_schemas.py`
2. **Create Guide**: Add a new markdown guide in `tax_guides/`
3. **Update Mapping**: Add the new type to the `DOCUMENT_TYPE_TO_SCHEMA` dictionary
4. **Update Vision**: Add the new type to the `DOCUMENT_TYPES` list in `vision_processor.py`

### Modifying Extraction Logic

- **Schema Changes**: Update the Pydantic schemas in `backend/schemas/`
- **Guide Changes**: Update the markdown guides in `tax_guides/`
- **Frontend Changes**: Update components in `frontend/src/components/`

## Deployment

### Backend (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python main.py`
5. Add environment variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

### Frontend (Netlify)

1. Create a new site on Netlify
2. Connect your GitHub repository
3. Set build command: `cd frontend && npm run build`
4. Set publish directory: `frontend/dist`
5. Add environment variable:
   ```
   VITE_API_URL=https://your-backend-name.onrender.com
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Repository

This project is hosted on GitHub: https://github.com/On-Analytics/assistant_contador
