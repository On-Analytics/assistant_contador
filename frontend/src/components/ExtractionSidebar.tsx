import React from 'react';
import { motion } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { BadgeDollarSign, GripVertical, Search } from 'lucide-react';
import type { Chip } from './PDFCanvas';

interface ExtractionSidebarProps {
    chips: Chip[];
    onDragStart: (chip: Chip) => void;
    onDragEnd: (chip: Chip, info: PanInfo) => void;
    onChipHover?: (chip: Chip | null) => void;
    isCollapsed?: boolean;
}

const ExtractionSidebar: React.FC<ExtractionSidebarProps> = ({ chips, onDragStart, onDragEnd, onChipHover }) => {
    // Filter out zero-value chips
    const nonZeroChips = chips.filter(chip => chip.value !== 0);

    return (
        <div className="extraction-sidebar" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            padding: '16px',
            gap: '12px'
        }}>
            <div className="sidebar-header" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '4px'
            }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <Search size={16} color="var(--primary-blue-light)" />
                    Valores Identificados
                </h3>
                <span className="badge" style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    background: 'rgba(0, 136, 255, 0.1)',
                    color: 'var(--primary-blue-light)',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 136, 255, 0.2)'
                }}>
                    {nonZeroChips.length} encontrados
                </span>
            </div>

            <div className="chips-list" style={{
                overflowY: 'auto',
                paddingRight: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                flex: 1
            }}>
                {nonZeroChips.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '30px 10px',
                        color: 'var(--text-muted)',
                        fontSize: '12px',
                        border: '1px dashed var(--glass-border)',
                        borderRadius: 'var(--radius-sm)'
                    }}>
                        No se encontraron valores.
                        Sube un documento para comenzar.
                    </div>
                ) : (
                    nonZeroChips.map(chip => (
                        <motion.div
                            key={chip.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.02, x: 2 }}
                            drag
                            dragSnapToOrigin
                            dragListener={true}
                            onDragStart={() => onDragStart(chip)}
                            onDragEnd={(_, info) => onDragEnd(chip, info)}
                            onMouseEnter={() => onChipHover?.(chip)}
                            onMouseLeave={() => onChipHover?.(null)}
                            title={`${chip.label}\nValor: $${chip.value.toLocaleString()}\nPágina: ${chip.page}`}
                            style={{
                                background: 'rgba(20, 25, 40, 0.6)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '10px 12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                cursor: 'grab',
                                userSelect: 'none',
                                position: 'relative',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="drag-handle" style={{ color: 'var(--text-muted)', cursor: 'grab' }}>
                                    <GripVertical size={14} />
                                </div>

                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{
                                        fontSize: '11px',
                                        color: 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        fontWeight: 600,
                                        marginBottom: '2px'
                                    }}>
                                        {chip.label || 'Valor Detectado'}
                                    </div>
                                    <div style={{
                                        fontSize: '14px',
                                        color: 'var(--accent-green)',
                                        fontWeight: '700',
                                        fontFamily: 'monospace',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <BadgeDollarSign size={12} strokeWidth={3} />
                                        {chip.value.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ExtractionSidebar;
