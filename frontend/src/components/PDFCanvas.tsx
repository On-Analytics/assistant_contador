import React, { useState } from 'react';
import type { PanInfo } from 'framer-motion';
import styles from './PDFCanvas.module.css';

export interface Chip {
    id: string;
    value: number;
    label: string;
    page: number;
    doc_id?: string;
    field_name?: string;  // Schema field name from backend
}

interface PDFCanvasProps {
    chips: Chip[];
    currentPage: number;
    imageUrl?: string;
    onDragStart: (chip: Chip) => void;
    onDragEnd: (chip: Chip, info: PanInfo) => void;
}

const PDFCanvas: React.FC<PDFCanvasProps> = ({ chips: _chips, currentPage: _currentPage, imageUrl, onDragStart: _onDragStart, onDragEnd: _onDragEnd }) => {
    const [zoom, setZoom] = useState(1);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
    const handleZoomReset = () => setZoom(1);

    return (
        <div className={styles.container}>
            {/* Zoom Controls */}
            <div className={styles.zoomControls}>
                <button onClick={handleZoomOut} className={styles.zoomButton}>
                    −
                </button>
                <span className={styles.zoomLevel}>
                    {Math.round(zoom * 100)}%
                </span>
                <button onClick={handleZoomIn} className={styles.zoomButton}>
                    +
                </button>
                <button onClick={handleZoomReset} className={styles.zoomButton} style={{ fontSize: '12px' }}>
                    Reset
                </button>
            </div>

            <div className={styles.pdfContainer}>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt="Document Page"
                        className={styles.pdfImage}
                        style={{ width: `${zoom * 100}%` }}
                    />
                ) : (
                    <div className={styles.placeholder}>
                        <p>
                            📄 Esperando documento...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PDFCanvas;
