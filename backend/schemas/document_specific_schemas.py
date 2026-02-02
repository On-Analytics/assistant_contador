"""
Document-specific Pydantic schemas for structured extraction.

This module defines specialized schemas for each Colombian tax document type,
providing precise field definitions that guide the LLM to extract exactly
the fields needed for Form 210 tax declaration.

Benefits over generic extraction:
- More precise field extraction
- Better validation and type safety
- Reduced hallucination
- Clear mapping to Form 210 fields
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from decimal import Decimal


# ============================================================================
# CERTIFICADO DE INGRESOS Y RETENCIONES (Annual Income Certificate)
# ============================================================================

class CertificadoIngresosExtraido(BaseModel):
    """
    Certificado de Ingresos y Retenciones (Formato 220).
    Maps to Form 210 income and deduction fields.
    """
    
    # Identification
    nit_empleador: Optional[str] = Field(None, description="NIT del empleador/pagador")
    nombre_empleador: Optional[str] = Field(None, description="Razón social del empleador")
    cedula_empleado: Optional[str] = Field(None, description="Cédula del empleado")
    año_gravable: Optional[int] = Field(None, description="Año fiscal del certificado")
    
    # Income fields
    salarios: Optional[float] = Field(None, description="Salarios y demás pagos laborales")
    cesantias: Optional[float] = Field(None, description="Cesantías e intereses pagados")
    otros_ingresos: Optional[float] = Field(None, description="Otros ingresos laborales")
    
    # Deduction fields
    aportes_salud: Optional[float] = Field(None, description="Aportes obligatorios a salud")
    aportes_pension: Optional[float] = Field(None, description="Aportes obligatorios a pensión")
    aportes_afc: Optional[float] = Field(None, description="Aportes voluntarios a AFC/Pensión")
    intereses_vivienda: Optional[float] = Field(None, description="Intereses pagados por crédito de vivienda")
    
    # Withholding
    retencion_fuente: Optional[float] = Field(None, description="Retención en la fuente practicada")


# ============================================================================
# EXTRACTO BANCARIO (Bank Statement)
# ============================================================================

class ExtractoBancarioExtraido(BaseModel):
    """
    Extracto Bancario - Bank statement for patrimony and capital income.
    """
    
    # Identification
    numero_cuenta: Optional[str] = Field(None, description="Número de cuenta bancaria")
    tipo_cuenta: Optional[str] = Field(None, description="Tipo de cuenta (Ahorros, Corriente)")
    periodo_inicio: Optional[str] = Field(None, description="Fecha de inicio del periodo")
    periodo_fin: Optional[str] = Field(None, description="Fecha de fin del periodo")
    
    # Balances and income
    saldo_final: Optional[float] = Field(None, description="Saldo final al cierre del periodo")
    total_intereses: Optional[float] = Field(None, description="Total de intereses o rendimientos ganados")
    
    # Charges and taxes
    total_gmf: Optional[float] = Field(None, description="Total GMF (Gravamen Movimientos Financieros 4x1000)")
    total_comisiones: Optional[float] = Field(None, description="Total de comisiones y cargos bancarios")
    retencion_fuente: Optional[float] = Field(None, description="Retención en la fuente sobre intereses")


# ============================================================================
# CERTIFICADO DE DIVIDENDOS (Dividend Certificate)
# ============================================================================

class CertificadoDividendosExtraido(BaseModel):
    """
    Certificado de Dividendos y Participaciones.
    """
    
    # Identification
    nit_pagador: Optional[str] = Field(None, description="NIT de la empresa pagadora")
    nombre_empresa: Optional[str] = Field(None, description="Razón social de la empresa")
    cedula_beneficiario: Optional[str] = Field(None, description="Cédula del beneficiario")
    año_gravable: Optional[int] = Field(None, description="Año fiscal")
    
    # Dividend amounts
    dividendos_gravados: Optional[float] = Field(None, description="Dividendos gravados")
    dividendos_no_gravados: Optional[float] = Field(None, description="Dividendos no gravados")
    total_dividendos: Optional[float] = Field(None, description="Total de dividendos recibidos")
    
    # Withholding
    retencion_fuente: Optional[float] = Field(None, description="Retención en la fuente practicada")


# ============================================================================
# RETENCIÓN EN LA FUENTE (Withholding Tax Certificate)
# ============================================================================

class RetencionFuenteExtraido(BaseModel):
    """
    Certificado de Retención en la Fuente por honorarios/servicios profesionales.
    """
    
    # Identification
    nit_retenedor: Optional[str] = Field(None, description="NIT del agente retenedor")
    nombre_retenedor: Optional[str] = Field(None, description="Razón social del retenedor")
    cedula_beneficiario: Optional[str] = Field(None, description="Cédula del beneficiario")
    año_gravable: Optional[int] = Field(None, description="Año fiscal")
    
    # Payment amounts
    valor_total_pagos: Optional[float] = Field(None, description="Valor total de pagos o abonos en cuenta")
    base_gravable: Optional[float] = Field(None, description="Base gravable para retención")
    
    # Withholding
    retencion_practicada: Optional[float] = Field(None, description="Retención en la fuente practicada")
    porcentaje_retencion: Optional[float] = Field(None, description="Porcentaje de retención aplicado")


# ============================================================================
# APORTES OBLIGATORIOS INDEPENDIENTE (Independent Worker Social Security)
# ============================================================================

class AportesObligatoriosIndependienteExtraido(BaseModel):
    """
    Certificado de Aportes Obligatorios para Trabajadores Independientes (PILA).
    """
    
    # Identification
    cedula: Optional[str] = Field(None, description="Cédula del cotizante")
    periodo_pago: Optional[str] = Field(None, description="Periodo de pago")
    año_gravable: Optional[int] = Field(None, description="Año fiscal")
    
    # Contributions (deductible)
    aporte_pension: Optional[float] = Field(None, description="Aportes obligatorios a pensión")
    aporte_salud: Optional[float] = Field(None, description="Aportes obligatorios a salud")
    fondo_solidaridad: Optional[float] = Field(None, description="Aportes al Fondo de Solidaridad Pensional")
    aporte_arl: Optional[float] = Field(None, description="Aportes a ARL (Riesgos Laborales)")
    
    # Reference (not deductible)
    ibc_pension: Optional[float] = Field(None, description="Ingreso Base de Cotización pensión")
    ibc_salud: Optional[float] = Field(None, description="Ingreso Base de Cotización salud")


# ============================================================================
# APORTES VOLUNTARIOS AFC (Voluntary Pension/AFC Contributions)
# ============================================================================

class AportesVoluntariosAFCExtraido(BaseModel):
    """
    Certificado de Aportes Voluntarios a Pensión o AFC.
    """
    
    # Identification
    cedula: Optional[str] = Field(None, description="Cédula del aportante")
    entidad: Optional[str] = Field(None, description="Nombre del fondo o entidad")
    año_gravable: Optional[int] = Field(None, description="Año fiscal")
    
    # Contributions
    aportes_afc: Optional[float] = Field(None, description="Aportes a AFC (Ahorro Fomento Construcción)")
    aportes_voluntarios_pension: Optional[float] = Field(None, description="Aportes voluntarios a pensión")
    saldo_acumulado: Optional[float] = Field(None, description="Saldo acumulado en la cuenta")


# ============================================================================
# CERTIFICADO MEDICINA PREPAGADA (Prepaid Medicine Certificate)
# ============================================================================

class CertificadoMedicinaPrepadagaExtraido(BaseModel):
    """
    Certificado de Pagos a Medicina Prepagada o Seguros de Salud.
    """
    
    # Identification
    nit_entidad: Optional[str] = Field(None, description="NIT de la entidad de salud")
    nombre_entidad: Optional[str] = Field(None, description="Nombre de la entidad")
    cedula_titular: Optional[str] = Field(None, description="Cédula del titular")
    año_gravable: Optional[int] = Field(None, description="Año fiscal")
    tipo_plan: Optional[str] = Field(None, description="Tipo de plan")
    
    # Annual total
    total_pagos_anuales: Optional[float] = Field(None, description="Total pagos anuales medicina prepagada")

# ============================================================================
# SALDOS Y CESANTÍAS (Severance Balance Certificate)
# ============================================================================

class SaldosCesantiasExtraido(BaseModel):
    """
    Certificado de Saldos y Cesantías.
    """
    
    # Identification
    cedula: Optional[str] = Field(None, description="Cédula del beneficiario")
    entidad: Optional[str] = Field(None, description="Nombre del fondo de cesantías")
    fecha_corte: Optional[str] = Field(None, description="Fecha de corte del certificado")
    año_gravable: Optional[int] = Field(None, description="Año fiscal")
    
    # Balances and income
    saldo_total: Optional[float] = Field(None, description="Saldo total de cesantías al cierre")
    intereses_causados: Optional[float] = Field(None, description="Intereses de cesantías causados")
    total_retiros: Optional[float] = Field(None, description="Total de retiros del periodo")
    saldo_inicial: Optional[float] = Field(None, description="Saldo inicial del periodo")


# ============================================================================
# CERTIFICADO PREDIAL (Property Tax Certificate)
# ============================================================================

class CertificadoPredialExtraido(BaseModel):
    """
    Certificado de Impuesto Predial.
    """
    
    # Identification
    numero_predial: Optional[str] = Field(None, description="Número predial del inmueble")
    direccion: Optional[str] = Field(None, description="Dirección del inmueble")
    cedula_propietario: Optional[str] = Field(None, description="Cédula del propietario")
    año_gravable: Optional[int] = Field(None, description="Año fiscal")
    
    # Property value
    avaluo_catastral: Optional[float] = Field(None, description="Avalúo catastral del inmueble")
    impuesto_predial: Optional[float] = Field(None, description="Impuesto predial pagado")


# ============================================================================
# CERTIFICADO VEHÍCULO (Vehicle Tax Certificate)
# ============================================================================

class CertificadoVehiculoExtraido(BaseModel):
    """
    Certificado de Impuesto de Vehículo.
    """
    
    # Identification
    placa: Optional[str] = Field(None, description="Placa del vehículo")
    cedula_propietario: Optional[str] = Field(None, description="Cédula del propietario")
    año_gravable: Optional[int] = Field(None, description="Año fiscal")
    marca_modelo: Optional[str] = Field(None, description="Marca y modelo del vehículo")
    
    # Vehicle value
    avaluo_comercial: Optional[float] = Field(None, description="Avalúo comercial del vehículo")
    impuesto_vehiculo: Optional[float] = Field(None, description="Impuesto de vehículo pagado")


# ============================================================================
# NÓMINA (Payroll Slip)
# ============================================================================

class NominaExtraida(BaseModel):
    """
    Comprobante de Nómina mensual.
    """
    
    # Identification
    mes: Optional[str] = Field(None, description="Mes de la nómina")
    año: Optional[int] = Field(None, description="Año de la nómina")
    cedula_empleado: Optional[str] = Field(None, description="Cédula del empleado")
    
    # Income
    salario_basico: Optional[float] = Field(None, description="Salario básico del mes")
    horas_extras: Optional[float] = Field(None, description="Pago por horas extras")
    bonificaciones: Optional[float] = Field(None, description="Bonificaciones")
    total_devengado: Optional[float] = Field(None, description="Total devengado")
    
    # Deductions
    aporte_salud: Optional[float] = Field(None, description="Aporte a salud")
    aporte_pension: Optional[float] = Field(None, description="Aporte a pensión")
    retencion_fuente: Optional[float] = Field(None, description="Retención en la fuente")
    total_deducciones: Optional[float] = Field(None, description="Total deducciones")
    neto_pagado: Optional[float] = Field(None, description="Neto pagado")


# ============================================================================
# FACTURA (Invoice for 1% Deduction)
# ============================================================================

class FacturaExtraida(BaseModel):
    """
    Factura Electrónica - For 1% deduction on purchases.
    """
    
    # Identification
    numero_factura: Optional[str] = Field(None, description="Número de la factura")
    fecha: Optional[str] = Field(None, description="Fecha de emisión")
    nit_vendedor: Optional[str] = Field(None, description="NIT del vendedor")
    nombre_vendedor: Optional[str] = Field(None, description="Razón social del vendedor")
    
    # Amounts
    subtotal: Optional[float] = Field(None, description="Subtotal antes de IVA")
    iva: Optional[float] = Field(None, description="IVA cobrado")
    total_factura: Optional[float] = Field(None, description="Total de la factura")
    descripcion: Optional[str] = Field(None, description="Descripción de bienes/servicios")


# ============================================================================
# OTRO (Unknown/Generic Document)
# ============================================================================

class DocumentoGenericoExtraido(BaseModel):
    """
    Generic document for unknown types.
    """
    
    tipo_documento_detectado: Optional[str] = Field(None, description="Tipo de documento detectado")
    campos_extraidos: Optional[dict] = Field(None, description="Campos extraídos {nombre: valor}")
    notas: Optional[str] = Field(None, description="Notas sobre el documento")


# ============================================================================
# MAPPING DICTIONARY
# ============================================================================

DOCUMENT_TYPE_TO_SCHEMA = {
    "certificado_ingresos": CertificadoIngresosExtraido,
    "extracto_bancario": ExtractoBancarioExtraido,
    "certificado_dividendos": CertificadoDividendosExtraido,
    "retencion_fuente": RetencionFuenteExtraido,
    "aportes_obligatorios_independiente": AportesObligatoriosIndependienteExtraido,
    "aportes_voluntarios_afc": AportesVoluntariosAFCExtraido,
    "certificado_medicina_prepagada": CertificadoMedicinaPrepadagaExtraido,
    "saldos_cesantias": SaldosCesantiasExtraido,
    "certificado_predial": CertificadoPredialExtraido,
    "certificado_vehiculo": CertificadoVehiculoExtraido,
    "nomina": NominaExtraida,
    "factura": FacturaExtraida,
    "otro": DocumentoGenericoExtraido,
}


def get_schema_for_document_type(document_type: str) -> type[BaseModel]:
    """
    Returns the appropriate Pydantic schema class for a given document type.
    
    Args:
        document_type: The document type identifier
        
    Returns:
        The corresponding Pydantic schema class
        
    Raises:
        ValueError: If document type is not recognized
    """
    schema = DOCUMENT_TYPE_TO_SCHEMA.get(document_type)
    if schema is None:
        raise ValueError(f"Unknown document type: {document_type}")
    return schema
