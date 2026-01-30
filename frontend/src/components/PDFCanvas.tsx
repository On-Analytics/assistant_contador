import React, { useState } from 'react';
import type { PanInfo } from 'framer-motion';

export interface Chip {
    id: string;
    value: number;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
    doc_id: string;
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
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Zoom Controls */}
            <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                zIndex: 10,
                display: 'flex',
                gap: '8px',
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '8px',
                borderRadius: '8px',
                backdropFilter: 'blur(8px)'
            }}>
                <button
                    onClick={handleZoomOut}
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                >
                    −
                </button>
                <span style={{
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 8px',
                    minWidth: '50px',
                    justifyContent: 'center'
                }}>
                    {Math.round(zoom * 100)}%
                </span>
                <button
                    onClick={handleZoomIn}
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                >
                    +
                </button>
                <button
                    onClick={handleZoomReset}
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                >
                    Reset
                </button>
            </div>

            <div className="pdf-container" style={{
                position: 'relative',
                width: '100%',
                minHeight: imageUrl ? 'auto' : '800px',
                backgroundColor: '#fff',
                display: 'block',
                borderRadius: '8px',
                overflow: 'auto',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}>
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt="Document Page"
                    style={{
                        width: `${zoom * 100}%`,
                        height: 'auto',
                        display: 'block',
                        transformOrigin: 'top left',
                        transition: 'width 0.2s ease'
                    }}
                />
            ) : (
                <div className="page-background" style={{
                    width: '100%',
                    height: '800px',
                    border: '2px dashed #ddd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)'
                }}>
                    <p style={{ color: '#666', padding: '20px', textAlign: 'center', fontSize: '14px' }}>
                        📄 Esperando documento...
                    </p>
                </div>
            )}
            </div>
        </div>
    );
};

export default PDFCanvas;
