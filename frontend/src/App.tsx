
import React, { useState, useEffect } from 'react'
import PDFCanvas from './components/PDFCanvas'
import ExtractionSidebar from './components/ExtractionSidebar'
import type { PanInfo } from 'framer-motion'
import './App.css'
import './premium-utils.css'
import type { Chip } from './components/PDFCanvas'
import ExcelWorkbench from './components/ExcelWorkbench'
import { CheckCircle } from 'lucide-react'
import axios from 'axios'
import { calculateBuckets, CALCULATED_FIELD_IDS } from './utils/formulas'

interface BucketSource {
  docName: string;
  value: number;
  chipId?: string;
  documentId?: string;
  originalChip?: Chip;
}

interface Bucket {
  id: string;
  name: string;
  value: number;
  sources: BucketSource[];
  section: string;
}

interface UploadedDocument {
  id: string;
  name: string;
  chips: Chip[];
  imageUrls: string[];
  originalFile?: File;
}

interface TaxpayerInfo {
  name: string;
  idType: string;
  idNumber: string;
  city: string;
  taxYear: string;
}

const INITIAL_BUCKETS: Bucket[] = [
  // Patrimonio
  { id: '29', name: 'Total patrimonio bruto', value: 0, sources: [], section: 'Patrimonio' },
  { id: '30', name: 'Deudas', value: 0, sources: [], section: 'Patrimonio' },
  { id: '31', name: 'Total patrimonio líquido', value: 0, sources: [], section: 'Patrimonio' },

  // Cédula General - Rentas de Trabajo (32-42)
  { id: '32', name: 'Ingresos brutos por rentas de trabajo', value: 0, sources: [], section: 'Cédula General' },
  { id: '33', name: 'Ingresos no constitutivos de renta', value: 0, sources: [], section: 'Cédula General' },
  { id: '34', name: 'Renta líquida ordinaria rentas de trabajo', value: 0, sources: [], section: 'Cédula General' },
  { id: '35', name: 'Aportes obligatorios a salud', value: 0, sources: [], section: 'Cédula General' },
  { id: '36', name: 'Aportes obligatorios a pensión obligatoria', value: 0, sources: [], section: 'Cédula General' },
  { id: '37', name: 'Aportes a fondos de pensiones voluntarias y AFC', value: 0, sources: [], section: 'Cédula General' },
  { id: '38', name: 'Valor de las cesantías e intereses de cesantías', value: 0, sources: [], section: 'Cédula General' },
  { id: '39', name: 'Gastos de representación', value: 0, sources: [], section: 'Cédula General' },
  { id: '40', name: 'Otras rentas exentas', value: 0, sources: [], section: 'Cédula General' },
  { id: '41', name: 'Total rentas exentas de trabajo', value: 0, sources: [], section: 'Cédula General' },
  { id: '42', name: 'Renta líquida rentas de trabajo', value: 0, sources: [], section: 'Cédula General' },

  // Cédula General - Rentas de Trabajo No Laboral (43-57)
  { id: '43', name: 'Ingresos brutos por rentas de trabajo no laboral', value: 0, sources: [], section: 'Cédula General' },
  { id: '44', name: 'Ingresos no constitutivos de renta', value: 0, sources: [], section: 'Cédula General' },
  { id: '45', name: 'Renta líquida ordinaria rentas de trabajo no laboral', value: 0, sources: [], section: 'Cédula General' },
  { id: '46', name: 'Aportes obligatorios a salud', value: 0, sources: [], section: 'Cédula General' },
  { id: '47', name: 'Aportes obligatorios a pensión obligatoria', value: 0, sources: [], section: 'Cédula General' },
  { id: '48', name: 'Aportes a fondos de pensiones voluntarias y AFC', value: 0, sources: [], section: 'Cédula General' },
  { id: '49', name: 'Gastos de representación', value: 0, sources: [], section: 'Cédula General' },
  { id: '50', name: 'Otras rentas exentas', value: 0, sources: [], section: 'Cédula General' },
  { id: '51', name: 'Total rentas exentas de trabajo no laboral', value: 0, sources: [], section: 'Cédula General' },
  { id: '52', name: 'Renta líquida rentas de trabajo no laboral', value: 0, sources: [], section: 'Cédula General' },

  { id: '53', name: 'Rentas exentas y/o deducciones imputables (Limitadas)', value: 0, sources: [], section: 'Cédula General' },
  { id: '54', name: 'Renta líquida ordinaria del ejercicio', value: 0, sources: [], section: 'Cédula General' },
  { id: '55', name: 'Pérdida líquida ordinaria del ejercicio', value: 0, sources: [], section: 'Cédula General' },
  { id: '56', name: 'Compensaciones por pérdidas', value: 0, sources: [], section: 'Cédula General' },
  { id: '57', name: 'Renta líquida ordinaria', value: 0, sources: [], section: 'Cédula General' },

  // Cédula General - Rentas de Capital (58-73)
  { id: '58', name: 'Ingresos brutos por rentas de capital', value: 0, sources: [], section: 'Cédula General' },
  { id: '59', name: 'Ingresos no constitutivos de renta', value: 0, sources: [], section: 'Cédula General' },
  { id: '60', name: 'Costos y gastos procedentes', value: 0, sources: [], section: 'Cédula General' },
  { id: '61', name: 'Renta líquida ordinaria rentas de capital', value: 0, sources: [], section: 'Cédula General' },
  { id: '62', name: 'Rentas líquidas pasivas – ECE', value: 0, sources: [], section: 'Cédula General' },
  { id: '63', name: 'Rentas exentas – Aportes voluntarios AFC', value: 0, sources: [], section: 'Cédula General' },
  { id: '64', name: 'Rentas exentas – Otras rentas exentas', value: 0, sources: [], section: 'Cédula General' },
  { id: '65', name: 'Total rentas exentas de las Rentas de capital', value: 0, sources: [], section: 'Cédula General' },
  { id: '66', name: 'Deducciones imputables – Intereses de vivienda', value: 0, sources: [], section: 'Cédula General' },
  { id: '67', name: 'Deducciones imputables – Otras deducciones', value: 0, sources: [], section: 'Cédula General' },
  { id: '68', name: 'Total deducciones imputables a las Rentas de capital', value: 0, sources: [], section: 'Cédula General' },
  { id: '69', name: 'Rentas exentas y/o deducciones imputables (Limitadas)', value: 0, sources: [], section: 'Cédula General' },
  { id: '70', name: 'Renta líquida ordinaria del ejercicio', value: 0, sources: [], section: 'Cédula General' },
  { id: '71', name: 'Pérdida líquida del ejercicio', value: 0, sources: [], section: 'Cédula General' },
  { id: '72', name: 'Compensaciones por pérdidas', value: 0, sources: [], section: 'Cédula General' },
  { id: '73', name: 'Renta líquida ordinaria de las Rentas de capital', value: 0, sources: [], section: 'Cédula General' },

  // Cédula General - Rentas No Laborales (74-90)
  { id: '74', name: 'Ingresos brutos por rentas no laborales', value: 0, sources: [], section: 'Cédula General' },
  { id: '75', name: 'Devoluciones, rebajas y descuentos', value: 0, sources: [], section: 'Cédula General' },
  { id: '76', name: 'Ingresos no constitutivos de renta', value: 0, sources: [], section: 'Cédula General' },
  { id: '77', name: 'Costos y deducciones procedentes', value: 0, sources: [], section: 'Cédula General' },
  { id: '78', name: 'Renta líquida', value: 0, sources: [], section: 'Cédula General' },
  { id: '79', name: 'Rentas líquidas pasivas – ECE', value: 0, sources: [], section: 'Cédula General' },
  { id: '80', name: 'Rentas exentas - Aportes voluntarios AFC', value: 0, sources: [], section: 'Cédula General' },
  { id: '81', name: 'Rentas exentas - Otras rentas exentas', value: 0, sources: [], section: 'Cédula General' },
  { id: '82', name: 'Total rentas exentas', value: 0, sources: [], section: 'Cédula General' },
  { id: '83', name: 'Deducciones imputables - Intereses de vivienda', value: 0, sources: [], section: 'Cédula General' },
  { id: '84', name: 'Deducciones imputables - Otras deducciones', value: 0, sources: [], section: 'Cédula General' },
  { id: '85', name: 'Total deducciones imputables', value: 0, sources: [], section: 'Cédula General' },
  { id: '86', name: 'Rentas exentas y/o deducciones imputables (Limitadas)', value: 0, sources: [], section: 'Cédula General' },
  { id: '87', name: 'Renta líquida ordinaria del ejercicio', value: 0, sources: [], section: 'Cédula General' },
  { id: '88', name: 'Pérdida líquida del ejercicio', value: 0, sources: [], section: 'Cédula General' },
  { id: '89', name: 'Compensaciones por pérdidas', value: 0, sources: [], section: 'Cédula General' },
  { id: '90', name: 'Renta líquida ordinaria', value: 0, sources: [], section: 'Cédula General' },

  // Resumen Cédula General (91-98)
  { id: '91', name: 'Renta líquida cédula general', value: 0, sources: [], section: 'Cédula General' },
  { id: '92', name: 'Rentas exentas y deducciones imputables limitadas', value: 0, sources: [], section: 'Cédula General' },
  { id: '93', name: 'Renta líquida ordinaria cédula general', value: 0, sources: [], section: 'Cédula General' },
  { id: '94', name: 'Compensaciones por pérdidas año gravable 2018 y anteriores', value: 0, sources: [], section: 'Cédula General' },
  { id: '95', name: 'Compensaciones por exceso de renta presuntiva', value: 0, sources: [], section: 'Cédula General' },
  { id: '96', name: 'Rentas gravables', value: 0, sources: [], section: 'Cédula General' },
  { id: '97', name: 'Renta líquida gravable cédula general', value: 0, sources: [], section: 'Cédula General' },
  { id: '98', name: 'Renta presuntiva', value: 0, sources: [], section: 'Cédula General' },

  // Cédula de Pensiones (99-103)
  { id: '99', name: 'Ingresos brutos por rentas de pensiones', value: 0, sources: [], section: 'Cédula de Pensiones' },
  { id: '100', name: 'Ingresos no constitutivos de renta', value: 0, sources: [], section: 'Cédula de Pensiones' },
  { id: '101', name: 'Renta líquida ordinaria rentas de pensiones', value: 0, sources: [], section: 'Cédula de Pensiones' },
  { id: '102', name: 'Rentas exentas de pensiones', value: 0, sources: [], section: 'Cédula de Pensiones' },
  { id: '103', name: 'Renta líquida rentas de pensiones', value: 0, sources: [], section: 'Cédula de Pensiones' },

  // Cédula de Dividendos y Participaciones (104-111)
  { id: '104', name: 'Dividendos y participaciones año 2016 y anteriores', value: 0, sources: [], section: 'Cédula de Dividendos y Participaciones' },
  { id: '105', name: 'Ingresos no constitutivos de renta (dividendos 2016 y anteriores)', value: 0, sources: [], section: 'Cédula de Dividendos y Participaciones' },
  { id: '106', name: 'Dividendos y participaciones año 2017 y siguientes - no gravados', value: 0, sources: [], section: 'Cédula de Dividendos y Participaciones' },
  { id: '107', name: 'Dividendos y participaciones año 2017 y siguientes - gravados', value: 0, sources: [], section: 'Cédula de Dividendos y Participaciones' },
  { id: '108', name: 'Dividendos del exterior', value: 0, sources: [], section: 'Cédula de Dividendos y Participaciones' },
  { id: '109', name: 'Rentas líquidas pasivas - ECE', value: 0, sources: [], section: 'Cédula de Dividendos y Participaciones' },
  { id: '110', name: 'Total dividendos y participaciones', value: 0, sources: [], section: 'Cédula de Dividendos y Participaciones' },
  { id: '111', name: 'Renta líquida dividendos y participaciones', value: 0, sources: [], section: 'Cédula de Dividendos y Participaciones' },

  // Ganancias Ocasionales (112-115)
  { id: '112', name: 'Ingresos brutos por ganancias ocasionales', value: 0, sources: [], section: 'Ganancias Ocasionales' },
  { id: '113', name: 'Costos y gastos procedentes', value: 0, sources: [], section: 'Ganancias Ocasionales' },
  { id: '114', name: 'Ganancias ocasionales no gravadas y exentas', value: 0, sources: [], section: 'Ganancias Ocasionales' },
  { id: '115', name: 'Ganancias ocasionales gravables', value: 0, sources: [], section: 'Ganancias Ocasionales' },

  // Liquidación Privada (116-121)
  { id: '116', name: 'Impuesto sobre la renta líquida gravable', value: 0, sources: [], section: 'Liquidación Privada' },
  { id: '117', name: 'Impuesto de ganancias ocasionales', value: 0, sources: [], section: 'Liquidación Privada' },
  { id: '118', name: 'Total impuesto a cargo', value: 0, sources: [], section: 'Liquidación Privada' },
  { id: '119', name: 'Anticipo renta año anterior', value: 0, sources: [], section: 'Liquidación Privada' },
  { id: '120', name: 'Anticipo renta año siguiente', value: 0, sources: [], section: 'Liquidación Privada' },
  { id: '121', name: 'Total saldo a pagar', value: 0, sources: [], section: 'Liquidación Privada' },

  // Descuentos Tributarios (122-125)
  { id: '122', name: 'Impuestos pagados en el exterior', value: 0, sources: [], section: 'Descuentos Tributarios' },
  { id: '123', name: 'Donaciones', value: 0, sources: [], section: 'Descuentos Tributarios' },
  { id: '124', name: 'Dividendos, participaciones y otros', value: 0, sources: [], section: 'Descuentos Tributarios' },
  { id: '125', name: 'Total descuentos tributarios', value: 0, sources: [], section: 'Descuentos Tributarios' },

  // Liquidación Final (126-137)
  { id: '126', name: 'Total impuesto a cargo', value: 0, sources: [], section: 'Liquidación Final' },
  { id: '127', name: 'Anticipo renta año anterior', value: 0, sources: [], section: 'Liquidación Final' },
  { id: '128', name: 'Retenciones año gravable', value: 0, sources: [], section: 'Liquidación Final' },
  { id: '129', name: 'Total impuesto a cargo', value: 0, sources: [], section: 'Liquidación Final' },
  { id: '130', name: 'Anticipo renta año anterior', value: 0, sources: [], section: 'Liquidación Final' },
  { id: '131', name: 'Anticipo renta año siguiente', value: 0, sources: [], section: 'Liquidación Final' },
  { id: '132', name: 'Retenciones año gravable', value: 0, sources: [], section: 'Liquidación Final' },
  { id: '133', name: 'Anticipo renta año siguiente', value: 0, sources: [], section: 'Liquidación Final' },
  { id: '134', name: 'Total saldo a pagar', value: 0, sources: [], section: 'Liquidación Final' },
  { id: '135', name: 'Total saldo a favor', value: 0, sources: [], section: 'Liquidación Final' },
  { id: '136', name: 'Saldo a pagar', value: 0, sources: [], section: 'Liquidación Final' },
  { id: '137', name: 'Saldo a favor', value: 0, sources: [], section: 'Liquidación Final' },
]

function App() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null)
  const [buckets, setBuckets] = useState<Bucket[]>(INITIAL_BUCKETS)
  const [activeTab, setActiveTab] = useState('Patrimonio')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [taxpayerInfo, setTaxpayerInfo] = useState<TaxpayerInfo>({
    name: '',
    idType: 'CC',
    idNumber: '',
    city: 'Bogotá D.C.',
    taxYear: '2024'
  })
  const [draggedChip, setDraggedChip] = useState<Chip | null>(null)
  const [hoveredChip, setHoveredChip] = useState<Chip | null>(null)
  const [successAnimation, setSuccessAnimation] = useState<string | null>(null)
  const [undoHistory, setUndoHistory] = useState<Array<{ buckets: Bucket[], documents: UploadedDocument[] }>>([])

  const activeDocument = documents.find(doc => doc.id === activeDocumentId)
  const chips = activeDocument?.chips || []
  const imageUrls = activeDocument?.imageUrls || []

  // Helper function to get bucket color based on section
  const getBucketColor = (section: string) => {
    switch (section) {
      case 'Laboral': return 'rgba(0, 136, 255, 0.15)' // Blue for income
      case 'Pensiones': return 'rgba(255, 136, 0, 0.15)' // Orange for deductions
      case 'Liquidación': return 'rgba(0, 255, 136, 0.15)' // Green for final calculation
      default: return 'rgba(255, 255, 255, 0.05)'
    }
  }

  // Smart suggestion: highlight buckets that might match the hovered chip
  const getSuggestedBuckets = (chip: Chip | null): string[] => {
    if (!chip) return []
    // Simple heuristic: suggest income buckets for high values, deduction buckets for medium values
    if (chip.value > 10000000) return ['32'] // Main income
    if (chip.value > 1000000) return ['32', '45'] // Income or pension
    return []
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }

      // Cancel drag: Escape
      if (e.key === 'Escape' && isDragging) {
        e.preventDefault()
        setIsDragging(false)
        setDraggedChip(null)
      }

      // Navigate tabs: Arrow Left/Right
      if (e.key === 'ArrowRight' && !isDragging) {
        const tabs = ['Patrimonio', 'Cédula General', 'Cédula de Pensiones', 'Cédula de Dividendos y Participaciones', 'Ganancias Ocasionales', 'Liquidación Privada', 'Descuentos Tributarios', 'Liquidación Final']
        const currentIndex = tabs.indexOf(activeTab)
        if (currentIndex < tabs.length - 1) {
          setActiveTab(tabs[currentIndex + 1])
        }
      }
      if (e.key === 'ArrowLeft' && !isDragging) {
        const tabs = ['Patrimonio', 'Cédula General', 'Cédula de Pensiones', 'Cédula de Dividendos y Participaciones', 'Ganancias Ocasionales', 'Liquidación Privada', 'Descuentos Tributarios', 'Liquidación Final']
        const currentIndex = tabs.indexOf(activeTab)
        if (currentIndex > 0) {
          setActiveTab(tabs[currentIndex - 1])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDragging, activeTab, undoHistory])

  const handleUndo = () => {
    if (undoHistory.length === 0) return

    const lastState = undoHistory[undoHistory.length - 1]
    setBuckets(lastState.buckets)
    setDocuments(lastState.documents)
    setUndoHistory(prev => prev.slice(0, -1))
  }

  const saveToHistory = () => {
    setUndoHistory(prev => [...prev, { buckets, documents }])
  }

  const handleDragStart = (chip: Chip) => {
    setIsDragging(true)
    setDraggedChip(chip)
  }

  const handleDragEnd = (_chip: Chip, info: PanInfo) => {
    setIsDragging(false)

    if (!draggedChip) {
      setDraggedChip(null)
      return
    }

    // Get the drop position
    const dropX = info.point.x
    const dropY = info.point.y

    // Find all bucket rows currently visible
    const bucketRows = document.querySelectorAll('[data-bucket-id]')
    let targetBucketId: string | null = null

    // Check which bucket row contains the drop point
    bucketRows.forEach((row) => {
      const rect = row.getBoundingClientRect()
      if (
        dropX >= rect.left &&
        dropX <= rect.right &&
        dropY >= rect.top &&
        dropY <= rect.bottom
      ) {
        targetBucketId = row.getAttribute('data-bucket-id')
      }
    })

    // Check for calculated fields
    if (targetBucketId && CALCULATED_FIELD_IDS.includes(targetBucketId)) {
      alert('Este campo es calculado automáticamente y no acepta valores manuales.');
      setDraggedChip(null);
      setIsDragging(false);
      return;
    }

    // If dropped on a valid bucket, update it
    if (targetBucketId) {
      saveToHistory()
      // Trigger success animation
      setSuccessAnimation(targetBucketId)
      setTimeout(() => setSuccessAnimation(null), 600)

      setBuckets((prev: Bucket[]) => {
        const updatedBuckets = prev.map(b => {
          if (b.id === targetBucketId) {
            return {
              ...b,
              value: b.value + draggedChip.value,
              sources: [...b.sources, {
                docName: activeDocument?.name || 'Unknown',
                value: draggedChip.value,
                chipId: draggedChip.id,
                documentId: activeDocumentId || undefined,
                originalChip: draggedChip
              }]
            }
          }
          return b
        })
        return calculateBuckets(updatedBuckets)
      })
      setDocuments(prev => prev.map(doc =>
        doc.id === activeDocumentId
          ? { ...doc, chips: doc.chips.filter(c => c.id !== draggedChip.id) }
          : doc
      ))
    }

    setDraggedChip(null)
  }

  const handleManualValueAdd = (bucketId: string, value: number) => {
    if (CALCULATED_FIELD_IDS.includes(bucketId)) {
      alert('Este campo es calculado automáticamente y no acepta valores manuales.');
      return;
    }

    saveToHistory()
    setBuckets((prev: Bucket[]) => {
      const updatedBuckets = prev.map(b => {
        if (b.id === bucketId) {
          return {
            ...b,
            value: b.value + value,
            sources: [...b.sources, { docName: 'Entrada Manual', value: value }]
          }
        }
        return b
      })
      return calculateBuckets(updatedBuckets)
    })
  }

  const handleSourceDelete = (bucketId: string, sourceIndex: number) => {
    saveToHistory()
    setBuckets((prev: Bucket[]) => {
      const bucket = prev.find(b => b.id === bucketId)
      if (!bucket) return prev

      const sourceToDelete = bucket.sources[sourceIndex]

      // If the source has originalChip and documentId, restore it to the document
      if (sourceToDelete.originalChip && sourceToDelete.documentId) {
        setDocuments(prevDocs => prevDocs.map(doc => {
          if (doc.id === sourceToDelete.documentId) {
            // Check if chip already exists to prevent duplication
            const chipExists = doc.chips.some(c => c.id === sourceToDelete.originalChip!.id);
            if (!chipExists) {
              return {
                ...doc,
                chips: [...doc.chips, sourceToDelete.originalChip!]
              }
            }
          }
          return doc
        }))
      }

      return calculateBuckets(prev.map(b => {
        if (b.id === bucketId) {
          const newSources = b.sources.filter((_, index) => index !== sourceIndex)
          const newValue = newSources.reduce((sum, src) => sum + src.value, 0)
          return {
            ...b,
            value: newValue,
            sources: newSources
          }
        }
        return b
      }))
    })
  }

  const exportAll = () => {
    const dateStr = new Date().toISOString().split('T')[0]

    // Export Formulario CSV
    const csvRows = []
    csvRows.push(['Sección', 'Renglón', 'Concepto', 'Valor', 'Fuentes'])

    buckets.forEach(bucket => {
      const sources = bucket.sources.map(s => `${s.docName}: $${s.value}`).join('; ')
      csvRows.push([
        bucket.section,
        bucket.id,
        bucket.name,
        bucket.value.toString(),
        sources || 'Sin fuentes'
      ])
    })

    const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob1 = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link1 = document.createElement('a')
    link1.href = URL.createObjectURL(blob1)
    link1.download = `formulario_210_${dateStr}.csv`
    link1.click()

    // Export Audit Trail CSV
    setTimeout(() => {
      const auditRows = []
      auditRows.push(['Sección', 'Renglón', 'Concepto', 'Documento Fuente', 'Valor'])

      buckets.forEach(bucket => {
        if (bucket.sources.length > 0) {
          bucket.sources.forEach(source => {
            auditRows.push([
              bucket.section,
              bucket.id,
              bucket.name,
              source.docName,
              source.value.toString()
            ])
          })
        }
      })

      const auditContent = auditRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
      const blob2 = new Blob([auditContent], { type: 'text/csv;charset=utf-8;' })
      const link2 = document.createElement('a')
      link2.href = URL.createObjectURL(blob2)
      link2.download = `audit_trail_${dateStr}.csv`
      link2.click()
    }, 100)
  }

  const saveSession = () => {
    const session = {
      buckets,
      documents: documents.map(doc => ({
        ...doc,
        imageUrls: [] // Don't save image URLs to reduce file size
      })),
      activeDocumentId,
      activeTab,
      taxpayerInfo,
      timestamp: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `session_${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  const loadSession = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const session = JSON.parse(e.target?.result as string)
        setBuckets(calculateBuckets(session.buckets || INITIAL_BUCKETS))
        setDocuments(session.documents || [])
        setActiveDocumentId(session.activeDocumentId || null)
        setActiveTab(session.activeTab || 'Laboral')
        if (session.taxpayerInfo) {
          setTaxpayerInfo(session.taxpayerInfo)
        }
        alert('Sesión cargada exitosamente')
      } catch (error) {
        console.error('Error loading session:', error)
        alert('Error al cargar la sesión')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const handleDeleteDocument = (docId: string) => {
    if (!confirm('¿Eliminar este documento? Los valores ya mapeados permanecerán en el formulario.')) return

    setDocuments(prev => prev.filter(doc => doc.id !== docId))
    if (activeDocumentId === docId) {
      const remaining = documents.filter(doc => doc.id !== docId)
      setActiveDocumentId(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  const handleRenameDocument = (docId: string) => {
    const doc = documents.find(d => d.id === docId)
    if (!doc) return

    const newName = prompt('Nuevo nombre del documento:', doc.name)
    if (!newName || newName === doc.name) return

    setDocuments(prev => prev.map(d =>
      d.id === docId ? { ...d, name: newName } : d
    ))
  }


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)
    const fileNames = Array.from(files).map(f => f.name)
    setUploadingFiles(fileNames)

    try {
      const totalFiles = files.length
      let completedFiles = 0

      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/upload`, formData, {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const fileProgress = (progressEvent.loaded / progressEvent.total) * 100
              const overallProgress = ((completedFiles + (fileProgress / 100)) / totalFiles) * 100
              setUploadProgress(Math.round(overallProgress))
            }
          }
        })

        completedFiles++
        setUploadProgress(Math.round((completedFiles / totalFiles) * 100))

        return {
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          chips: response.data.chips,
          imageUrls: response.data.image_urls,
          originalFile: file
        }
      })

      const newDocuments = await Promise.all(uploadPromises)
      setDocuments(prev => [...prev, ...newDocuments])
      if (newDocuments.length > 0) {
        setActiveDocumentId(newDocuments[0].id)
      }
    } catch (error) {
      console.error("Upload failed", error)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      setUploadingFiles([])
    }
    event.target.value = ''
  }

  return (
    <div className="layout-grid">
      {/* Left Sidebar - Valores Identificados */}
      <aside className="glass vault-pane fade-in" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Upload Section */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)' }}>
          <label className="upload-button" style={{
            display: 'block',
            padding: '16px',
            border: '2px dashed var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '13px'
          }}>
            <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} accept=".pdf,.png,.jpg,.jpeg" multiple />
            {isUploading ? '⚡ Procesando...' : '📄 Subir Documento'}
          </label>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div style={{ marginTop: '12px' }}>
              <div style={{
                width: '100%',
                height: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--primary-blue-light), var(--accent-green))',
                  transition: 'width 0.3s ease',
                  borderRadius: '4px'
                }} />
              </div>
              <div style={{
                marginTop: '6px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{uploadingFiles.length > 1 ? `${uploadingFiles.length} archivos` : uploadingFiles[0]}</span>
                <span style={{ fontWeight: 600, color: 'var(--primary-blue-light)' }}>{uploadProgress}%</span>
              </div>
            </div>
          )}

          {/* Document List */}
          {documents.length > 0 && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {documents.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => setActiveDocumentId(doc.id)}
                  className="doc-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: doc.id === activeDocumentId
                      ? 'rgba(14, 165, 233, 0.2)'
                      : 'rgba(16, 185, 129, 0.12)',
                    border: doc.id === activeDocumentId
                      ? '1px solid rgba(14, 165, 233, 0.5)'
                      : '1px solid rgba(16, 185, 129, 0.4)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-base)',
                    boxShadow: doc.id === activeDocumentId
                      ? 'var(--shadow-sm), 0 0 16px rgba(14, 165, 233, 0.2)'
                      : 'var(--shadow-xs)'
                  }}
                >
                  <CheckCircle size={14} color={doc.id === activeDocumentId ? 'var(--primary-blue-light)' : 'var(--accent-green)'} />
                  <span style={{
                    fontSize: '11px',
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}>
                    {doc.name}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    padding: '3px 8px',
                    background: doc.id === activeDocumentId
                      ? 'rgba(14, 165, 233, 0.3)'
                      : 'rgba(16, 185, 129, 0.25)',
                    color: doc.id === activeDocumentId ? 'var(--primary-blue-light)' : 'var(--accent-green-light)',
                    borderRadius: '10px',
                    fontWeight: 700,
                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)'
                  }}>
                    {doc.chips.length}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRenameDocument(doc.id)
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '4px',
                        padding: '4px 6px',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        fontSize: '10px',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                        e.currentTarget.style.borderColor = 'var(--glass-border)'
                      }}
                      title="Renombrar documento"
                    >
                      ✎
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteDocument(doc.id)
                      }}
                      style={{
                        background: 'rgba(255, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 0, 0, 0.3)',
                        borderRadius: '4px',
                        padding: '4px 6px',
                        cursor: 'pointer',
                        color: '#ff6b6b',
                        fontSize: '10px',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 0, 0, 0.2)'
                        e.currentTarget.style.borderColor = 'rgba(255, 0, 0, 0.5)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 0, 0, 0.1)'
                        e.currentTarget.style.borderColor = 'rgba(255, 0, 0, 0.3)'
                      }}
                      title="Eliminar documento"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Extraction Sidebar */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ExtractionSidebar
            chips={chips}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onChipHover={setHoveredChip}
          />
        </div>
      </aside>

      {/* Center - Document Canvas */}
      <main className="glass canvas-pane fade-in">
        <header style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'space-between',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Visor de Documentos</h3>
          <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Página 1 de 1</span>
        </header>
        <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
          <PDFCanvas
            chips={chips}
            currentPage={1}
            imageUrl={imageUrls[0]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        </div>
      </main>

      {/* Right Sidebar - Formulario */}
      <section className="glass workbench-pane fade-in">
        {/* Tabs */}
        <div className="tabs">
          <button className={activeTab === 'Patrimonio' ? 'active' : ''} onClick={() => setActiveTab('Patrimonio')}>Patrimonio</button>
          <button className={activeTab === 'Cédula General' ? 'active' : ''} onClick={() => setActiveTab('Cédula General')}>Cédula General</button>
          <button className={activeTab === 'Cédula de Pensiones' ? 'active' : ''} onClick={() => setActiveTab('Cédula de Pensiones')}>Pensiones</button>
          <button className={activeTab === 'Cédula de Dividendos y Participaciones' ? 'active' : ''} onClick={() => setActiveTab('Cédula de Dividendos y Participaciones')}>Dividendos</button>
          <button className={activeTab === 'Ganancias Ocasionales' ? 'active' : ''} onClick={() => setActiveTab('Ganancias Ocasionales')}>Ganancias</button>
          <button className={activeTab === 'Liquidación Privada' ? 'active' : ''} onClick={() => setActiveTab('Liquidación Privada')}>Liq. Privada</button>
          <button className={activeTab === 'Descuentos Tributarios' ? 'active' : ''} onClick={() => setActiveTab('Descuentos Tributarios')}>Descuentos</button>
          <button className={activeTab === 'Liquidación Final' ? 'active' : ''} onClick={() => setActiveTab('Liquidación Final')}>Liq. Final</button>
        </div>

        {/* Spreadsheet */}
        <div className="spreadsheet">
          <ExcelWorkbench
            activeTab={activeTab}
            buckets={buckets.filter(b => b.section === activeTab)}
            isDragging={isDragging}
            taxpayerInfo={taxpayerInfo}
            onManualValueAdd={handleManualValueAdd}
            onSourceDelete={handleSourceDelete}
            suggestedBuckets={getSuggestedBuckets(hoveredChip)}
            successAnimation={successAnimation}
            getBucketColor={getBucketColor}
          />
        </div>

        {/* Footer */}
        <footer style={{
          padding: '20px',
          borderTop: '1px solid var(--glass-border)',
          background: 'rgba(0, 136, 255, 0.05)'
        }}>
          {/* Export Buttons */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            <button
              onClick={exportAll}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'rgba(0, 136, 255, 0.1)',
                border: '1px solid var(--primary-blue-light)',
                borderRadius: '4px',
                color: 'var(--primary-blue-light)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 136, 255, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 136, 255, 0.1)'}
            >
              📊 Exportar
            </button>
            <button
              onClick={saveSession}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              💾 Guardar
            </button>
            <label
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
                transition: 'all 0.2s',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              <input type="file" onChange={loadSession} style={{ display: 'none' }} accept=".json" />
              📂 Cargar
            </label>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px'
          }}>
            <span style={{ marginRight: '12px' }}>⌨️ Atajos:</span>
            <span style={{ marginRight: '12px' }}><strong>Ctrl+Z</strong> Deshacer</span>
            <span style={{ marginRight: '12px' }}><strong>Esc</strong> Cancelar</span>
            <span><strong>←/→</strong> Navegar</span>
          </div>
        </footer>
      </section>
    </div>
  )
}

export default App
