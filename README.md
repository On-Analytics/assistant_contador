# ASSISTANT_CONTADOR

A tax form processing assistant for Colombian tax forms (Formulario 210).

## Overview

This application provides automated processing and analysis of Colombian tax forms, specifically designed for Formulario 210 (2025). It combines a Python backend with a React frontend to provide a comprehensive solution for tax document management.

## Features

- **PDF Processing**: Extract and analyze tax form data from PDF documents
- **Vision Processing**: Advanced OCR and document analysis capabilities
- **Excel Integration**: Workbench for spreadsheet data manipulation
- **Form Validation**: Automated validation of tax form data
- **Modern UI**: React-based frontend with TypeScript

## Rules
**1. DO NOT PERFORM CALCULATIONS**: Only extract values that are explicitly written in the document summary parts. Do not sum, subtract, or calculate totals yourself.
**2. NO HALLUCINATIONS**: If a field is not explicitly shown with a value, do not report it as 0. Only report what is actually written.
**3. USE MARKDOWN CONTEXT**: Use the markdown context to identify values.
**4. Default to NOT relevant.**  It's better to provide a clean list of certifiable totals than a cluttered list of transaction details.
**5. The Colombian tax authority** (DIAN) needs consolidated figures for Patrimonio, Rentas, and Deducciones.

## Project Structure

```
ASSISTANT_CONTADOR/
├── backend/                 # Python backend API
│   ├── main.py             # FastAPI main application
│   ├── models.py           # Data models
│   ├── pdf_utils.py        # PDF processing utilities
│   ├── vision_processor.py # Computer vision processing
│   ├── requirements.txt    # Python dependencies
│   └── temp/               # Temporary file storage (gitignored)
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ExcelWorkbench.tsx
│   │   │   ├── ExtractionSidebar.tsx
│   │   │   └── PDFCanvas.tsx
│   │   ├── App.tsx        # Main application component
│   │   ├── main.tsx       # Entry point
│   │   └── index.css      # Global styles
│   ├── public/            # Static assets
│   ├── package.json       # Node.js dependencies
│   └── vite.config.ts     # Vite configuration
├── Samples/               # Sample documents and screenshots (gitignored)
├── docs/                  # Documentation
├── .gitignore             # Git ignore rules
├── README.md              # This file
└── Formulario_210_2025.pdf # Sample tax form
```

## Technology Stack

### Backend
- **Python 3.14**
- **FastAPI** - Web framework
- **PDF processing libraries**
- **Computer vision processing**

### Frontend
- **React** with TypeScript
- **Vite** - Build tool
- **Modern CSS** - Styling
- **ESLint** - Code linting

## Repository

This project is hosted on GitHub: https://github.com/On-Analytics/assistant_contador

## Git Ignore

The following files and directories are excluded from version control:
- `Samples/` - Sample documents and screenshots
- `notes.txt`, `form_text.txt` - Local notes files
- `backend/temp/` - Temporary file storage
- `node_modules/`, `__pycache__/` - Dependency and build directories
- `.env*` - Environment variables

## Getting Started

### Prerequisites
- Python 3.14+
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
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

The frontend will typically be available at `http://localhost:5173` and the backend API at `http://localhost:8000`.

## Usage

1. Upload PDF tax forms through the web interface
2. Use the Excel Workbench for data manipulation
3. Review processed results and validations
4. Export processed data as needed

## Environment Variables

Create a `.env` file in the root directory:

```env
# Add your environment variables here
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Deployment

### Backend (Render)

1. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Set build command: `pip install -r requirements.txt`
   - Set start command: `python main.py`
   - Add environment variables:
     ```
     API_BASE_URL=https://your-app-name.onrender.com
     ALLOWED_ORIGINS=https://your-app-name.netlify.app
     OPENAI_API_KEY=your_openai_api_key
     ```

2. **Health Check**
   - Render will automatically use the `/health` endpoint for health checks

### Frontend (Netlify)

1. **Create a new site on Netlify**
   - Connect your GitHub repository
   - Set build command: `cd frontend && npm run build`
   - Set publish directory: `frontend/dist`
   - Add environment variable:
     ```
     VITE_API_URL=https://your-app-name.onrender.com
     ```

2. **Configuration**
   - The `netlify.toml` file handles SPA routing automatically

### Environment Variables

Copy the example files and configure them:

**Backend:**
```bash
cp backend/.env.example backend/.env
```

**Frontend:**
```bash
cp frontend/.env.example frontend/.env
```

## Support

For questions or support, please refer to the project documentation or contact the development team.
