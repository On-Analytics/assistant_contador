import React, { useState, useEffect, useRef } from 'react';
import { CALCULATED_FIELD_IDS } from '../utils/formulas';

export interface BucketSource {
    docName: string;
    value: number;
}

export interface Bucket {
    id: string;
    name: string;
    value: number;
    sources: BucketSource[];
    section: string;
}

interface TaxpayerInfo {
    name: string;
    idType: string;
    idNumber: string;
    city: string;
    taxYear: string;
}

interface ExcelWorkbenchProps {
    activeTab: string;
    buckets: Bucket[];
    isDragging: boolean;
    taxpayerInfo?: TaxpayerInfo;
    onManualValueAdd?: (bucketId: string, value: number) => void;
    onSourceDelete?: (bucketId: string, sourceIndex: number) => void;
    suggestedBuckets?: string[];
    successAnimation?: string | null;
    getBucketColor?: (section: string) => string;
}


const ExcelWorkbench: React.FC<ExcelWorkbenchProps> = ({ activeTab, buckets, isDragging, taxpayerInfo, onManualValueAdd, onSourceDelete, suggestedBuckets = [], successAnimation, getBucketColor }) => {
    const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
    const [hoveredBucket, setHoveredBucket] = useState<string | null>(null);
    const [editingBucket, setEditingBucket] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isDragging) {
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
                scrollIntervalRef.current = null;
            }
            return;
        }

        const handleMouseMove = (e: MouseEvent) => {
            const container = scrollContainerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const scrollThreshold = 80;
            const scrollSpeed = 10;

            const distanceFromTop = e.clientY - rect.top;
            const distanceFromBottom = rect.bottom - e.clientY;

            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
                scrollIntervalRef.current = null;
            }

            if (distanceFromTop < scrollThreshold && distanceFromTop > 0) {
                scrollIntervalRef.current = window.setInterval(() => {
                    container.scrollTop -= scrollSpeed;
                }, 16);
            } else if (distanceFromBottom < scrollThreshold && distanceFromBottom > 0) {
                scrollIntervalRef.current = window.setInterval(() => {
                    container.scrollTop += scrollSpeed;
                }, 16);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
                scrollIntervalRef.current = null;
            }
        };
    }, [isDragging]);

    return (
        <div ref={scrollContainerRef} className={`excel-workbench ${isDragging ? 'drop-ready' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{
                    color: 'var(--primary-blue-light)',
                    margin: 0,
                    fontSize: '15px',
                    letterSpacing: '1px',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                }}>
                    Formulario 210: {activeTab}
                </h4>
                <span style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    background: 'rgba(0, 136, 255, 0.1)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(0, 136, 255, 0.2)',
                    fontWeight: 600,
                    letterSpacing: '0.5px'
                }}>
                    AÑO {taxpayerInfo?.taxYear || '2024'}
                </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{
                        borderBottom: '2px solid rgba(0, 136, 255, 0.3)',
                        color: 'var(--text-secondary)',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        background: 'rgba(0, 136, 255, 0.05)'
                    }}>
                        <th style={{ textAlign: 'left', padding: '14px 10px', fontWeight: 700, letterSpacing: '0.5px', width: '80px' }}>Renglón</th>
                        <th style={{ textAlign: 'left', padding: '14px 10px', fontWeight: 700, letterSpacing: '0.5px' }}>Concepto</th>
                        <th style={{ textAlign: 'right', padding: '14px 10px', fontWeight: 700, letterSpacing: '0.5px', width: '150px' }}>Valor</th>
                        <th style={{ textAlign: 'center', padding: '14px 10px', fontWeight: 700, letterSpacing: '0.5px', width: '100px' }}>Auditoría</th>
                    </tr>
                </thead>
                <tbody>
                    {buckets.map((bucket, _index) => {
                        // Check if this is line 32 in Laboral section (should be highlighted)
                        const isMainIncome = activeTab === 'Laboral' && bucket.id === '32';
                        const isSuggested = suggestedBuckets.includes(bucket.id);
                        const hasSuccessAnimation = successAnimation === bucket.id;
                        const isCalculated = CALCULATED_FIELD_IDS.includes(bucket.id);

                        return (
                            <React.Fragment key={bucket.id}>
                                <tr
                                    className="bucket-row"
                                    data-bucket-id={bucket.id}
                                    onClick={() => setSelectedBucket(selectedBucket === bucket.id ? null : bucket.id)}
                                    onMouseEnter={() => isDragging && !isCalculated && setHoveredBucket(bucket.id)}
                                    onMouseLeave={() => isDragging && setHoveredBucket(null)}
                                    style={{
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                        cursor: 'pointer',
                                        transition: 'all var(--transition-base)',
                                        opacity: isDragging && isCalculated ? 0.5 : 1,
                                        background: hasSuccessAnimation
                                            ? 'rgba(0, 255, 136, 0.3)'
                                            : hoveredBucket === bucket.id && isDragging && !isCalculated
                                                ? 'rgba(0, 255, 136, 0.15)'
                                                : isSuggested && !isDragging
                                                    ? 'rgba(255, 200, 0, 0.1)'
                                                    : selectedBucket === bucket.id
                                                        ? 'rgba(0, 136, 255, 0.08)'
                                                        : isMainIncome
                                                            ? 'rgba(0, 136, 255, 0.03)'
                                                            : isCalculated
                                                                ? 'rgba(0, 0, 0, 0.2)'
                                                                : getBucketColor?.(activeTab) || 'transparent',
                                        borderLeft: hoveredBucket === bucket.id && isDragging
                                            ? '3px solid var(--accent-green)'
                                            : isMainIncome ? '3px solid var(--primary-blue-light)' : '3px solid transparent',
                                        boxShadow: hoveredBucket === bucket.id && isDragging
                                            ? '0 0 20px rgba(0, 255, 136, 0.3), inset 0 0 20px rgba(0, 255, 136, 0.1)'
                                            : 'none'
                                    }}
                                >
                                    <td style={{
                                        padding: '14px 10px',
                                        color: isCalculated ? 'var(--text-secondary)' : 'var(--primary-blue-light)',
                                        fontWeight: 'bold',
                                        fontSize: isMainIncome ? '14px' : '13px'
                                    }}>
                                        {bucket.id}
                                        {isCalculated && <span style={{ fontSize: '9px', marginLeft: '4px', opacity: 0.7 }}>🔒</span>}
                                    </td>
                                    <td style={{
                                        padding: '14px 10px',
                                        fontSize: '13px',
                                        color: isCalculated ? 'var(--text-secondary)' : 'var(--text-primary)',
                                        fontWeight: isMainIncome ? 600 : 'normal',
                                        fontStyle: isCalculated ? 'italic' : 'normal'
                                    }}>{bucket.name}</td>
                                    <td
                                        style={{
                                            padding: '14px 10px',
                                            textAlign: 'right',
                                            fontWeight: 'bold',
                                            fontSize: isMainIncome ? '15px' : '14px',
                                            fontFamily: 'monospace',
                                            color: isCalculated ? 'var(--text-muted)' : 'inherit'
                                        }}
                                        onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            if (isCalculated) return;
                                            setEditingBucket(bucket.id);
                                            setEditValue('');
                                        }}
                                        title={isCalculated ? 'Campo calculado automáticamente' : 'Doble clic para editar'}
                                    >
                                        {editingBucket === bucket.id ? (
                                            <input
                                                type="number"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={() => {
                                                    const numValue = parseFloat(editValue);
                                                    if (!isNaN(numValue) && numValue > 0 && onManualValueAdd) {
                                                        onManualValueAdd(bucket.id, numValue);
                                                    }
                                                    setEditingBucket(null);
                                                    setEditValue('');
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const numValue = parseFloat(editValue);
                                                        if (!isNaN(numValue) && numValue > 0 && onManualValueAdd) {
                                                            onManualValueAdd(bucket.id, numValue);
                                                        }
                                                        setEditingBucket(null);
                                                        setEditValue('');
                                                    } else if (e.key === 'Escape') {
                                                        setEditingBucket(null);
                                                        setEditValue('');
                                                    }
                                                }}
                                                autoFocus
                                                style={{
                                                    width: '100%',
                                                    background: 'rgba(0, 136, 255, 0.1)',
                                                    border: '1px solid var(--primary-blue-light)',
                                                    borderRadius: '4px',
                                                    padding: '4px 8px',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '14px',
                                                    fontFamily: 'monospace',
                                                    textAlign: 'right',
                                                    outline: 'none'
                                                }}
                                            />
                                        ) : (
                                            <span style={{
                                                color: bucket.value > 0 ? '#fff' : 'rgba(255, 255, 255, 0.2)',
                                                cursor: 'text'
                                            }}>
                                                ${bucket.value.toLocaleString()}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                                        {bucket.sources.length > 0 && (
                                            <div style={{
                                                backgroundColor: 'rgba(0, 255, 136, 0.15)',
                                                color: 'var(--accent-green)',
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                fontSize: '10px',
                                                display: 'inline-block',
                                                border: '1px solid rgba(0, 255, 136, 0.3)',
                                                fontWeight: 600,
                                                transition: 'all var(--transition-base)'
                                            }}>
                                                {bucket.sources.length} doc{bucket.sources.length > 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                                {selectedBucket === bucket.id && bucket.sources.length > 0 && (
                                    <tr style={{
                                        animation: 'fadeIn 0.3s ease-out',
                                        background: 'rgba(0, 0, 0, 0.3)'
                                    }}>
                                        <td colSpan={4} style={{ padding: '0 10px 16px 10px' }}>
                                            <div className="registry-box" style={{
                                                background: 'linear-gradient(135deg, rgba(0, 136, 255, 0.1) 0%, rgba(0, 180, 255, 0.05) 100%)',
                                                borderRadius: 'var(--radius-sm)',
                                                padding: '14px',
                                                fontSize: '12px',
                                                border: '1px solid rgba(0, 136, 255, 0.2)',
                                                backdropFilter: 'blur(8px)'
                                            }}>
                                                <div style={{
                                                    color: 'var(--primary-blue-light)',
                                                    marginBottom: '10px',
                                                    fontSize: '10px',
                                                    textTransform: 'uppercase',
                                                    fontWeight: 700,
                                                    letterSpacing: '1px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}>
                                                    <span>🛡️</span> Audit Shield: Trazabilidad de Fuentes
                                                </div>
                                                {bucket.sources.map((src, i) => (
                                                    <div key={i} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '8px 0',
                                                        borderBottom: i < bucket.sources.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                                                        transition: 'all var(--transition-base)',
                                                        gap: '8px'
                                                    }}>
                                                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px', flex: 1 }}>{src.docName}</span>
                                                        <span style={{
                                                            fontWeight: 'bold',
                                                            color: 'var(--accent-green)',
                                                            fontFamily: 'monospace'
                                                        }}>${src.value.toLocaleString()}</span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (onSourceDelete) {
                                                                    onSourceDelete(bucket.id, i);
                                                                }
                                                            }}
                                                            style={{
                                                                background: 'rgba(255, 0, 0, 0.1)',
                                                                border: '1px solid rgba(255, 0, 0, 0.3)',
                                                                borderRadius: '4px',
                                                                padding: '4px 8px',
                                                                cursor: 'pointer',
                                                                color: '#ff6b6b',
                                                                fontSize: '10px',
                                                                fontWeight: 600,
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = 'rgba(255, 0, 0, 0.2)';
                                                                e.currentTarget.style.borderColor = 'rgba(255, 0, 0, 0.5)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = 'rgba(255, 0, 0, 0.1)';
                                                                e.currentTarget.style.borderColor = 'rgba(255, 0, 0, 0.3)';
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>

            <style>{`
        .bucket-row:hover:not([data-dragging="true"]) {
          background-color: rgba(0, 136, 255, 0.1) !important;
          transform: translateX(2px);
        }
      `}</style>
        </div>
    );
};

export default ExcelWorkbench;
