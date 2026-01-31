export interface BucketSource {
    docName: string;
    value: number;
    chipId?: string;
    documentId?: string;
    originalChip?: any;
}

export interface Bucket {
    id: string;
    name: string;
    value: number;
    sources: BucketSource[];
    section: string;
}

export const CALCULATED_FIELD_IDS = [
    '31', '34', '37', '40', '42', '46', '49', '52', '54', '55', '57',
    '61', '65', '68', '70', '71', '73', '78', '82', '85', '87', '88', '90',
    '91', '92', '93', '97', '101', '103', '106', '111', '115', '121', '125',
    '126', '129', '134', '136', '137'
];

/**
 * Calculates all dependent fields based on the formulas from Formulario 210.
 * Returns a new array of Buckets with updated values.
 */
export const calculateBuckets = (buckets: Bucket[]): Bucket[] => {
    // Create a map for O(1) access to buckets by ID
    const bucketMap = new Map<string, Bucket>();
    buckets.forEach(b => bucketMap.set(b.id, { ...b })); // Clone buckets to avoid mutation side-effects

    // Helper to get value
    const val = (id: string): number => bucketMap.get(id)?.value || 0;

    // Helper to set value (and clear sources for calculated fields to indicate they are computed)
    const setVal = (id: string, value: number) => {
        const bucket = bucketMap.get(id);
        if (bucket) {
            // Ensure positive result where required by the form logic (usually imply strict subtraction)
            // But some might allow negative. The instructions say "Resultado positivo" for many.
            bucket.value = Math.max(0, value); // Enforcing positive results as per common tax form logic for "Renta Líquida"

            // Mark as calculated?
            // For now we just update the value. 
            // Depending on UX, we might want to clear sources or add a "Calculated" source.
            // Let's leave sources alone if they were manually added? 
            // Actually, if it's a calculated field, its value is purely derived. 
            // We should probably clear manual sources to avoid confusion, OR 
            // enable sources to be "auditable" components of the calculation.
            // For this implementation, we simply overwrite the value.
        }
    };

    /** PATRIMONIO */
    // 31: Total patrimonio líquido = 29 - 30
    setVal('31', val('29') - val('30'));

    /** CÉDULA GENERAL - RENTAS DE TRABAJO */
    // 34: Renta líquida de las Rentas de trabajo = 32 - 33
    setVal('34', val('32') - val('33'));

    // 37: Total rentas exentas = 35 + 36
    setVal('37', val('35') + val('36'));

    // 40: Total deducciones imputables = 38 + 39
    setVal('40', val('38') + val('39'));

    // 41: Rentas exentas y deducciones imputables (Limitadas)
    // NOTE: This involves complex logic (40% limit, etc.). 
    // For now we will implement it as a simple sum if the user hasn't provided it,
    // BUT the JSON says it's a distribution field. 
    // Ideally this is calculated by the 40% rule. 
    // Let's stick to the arithmetic relationships found in the JSON first to be safe, 
    // or set it to min(37+40, 34 * 0.40) roughly?
    // User asked for formulas *in the JSON*.
    // JSON instructions for Casilla 41 say: "El SI de diligenciamiento distribuirá..."
    // But it gives controls: cannot exceed 34.
    // Let's implement the simpler arithmetic checks first or leave as input?
    // The JSON verification said:
    // Casilla 41: No direct formula like "A + B". It says "Sources: 37, 40".
    // I will implement it as just sum for now, but strictly it's an output of a limit function.
    // Let's stick to the explicit simple formulas found in my report first.

    // 42: Renta líquida ordinaria = 34 - 41
    setVal('42', val('34') - val('41'));

    /** CÉDULA GENERAL - RENTAS DE TRABAJO NO LABORAL */
    // 46: Renta líquida = 43 - 44 - 45
    setVal('46', val('43') - val('44') - val('45'));

    // 49: Total rentas exentas = 47 + 48
    setVal('49', val('47') + val('48'));

    // 52: Total deducciones imputables = 50 + 51
    setVal('52', val('50') + val('51'));

    // 53: Rentas exentas limitadas. (Input/Distribution)

    // 54: Renta líquida ordinaria del ejercicio = 43 - 44 - 45 - 53
    setVal('54', val('43') - val('44') - val('45') - val('53'));

    // 55: Pérdida líquida ordinaria = 44 + 45 - 43
    setVal('55', val('44') + val('45') - val('43'));

    // 57: Renta líquida ordinaria = 54 - 56
    setVal('57', val('54') - val('56'));


    /** CÉDULA GENERAL - RENTAS DE CAPITAL */
    // 61: Renta líquida = 58 - 59 - 60
    setVal('61', val('58') - val('59') - val('60'));

    // 65: Total rentas exentas = 63 + 64
    setVal('65', val('63') + val('64'));

    // 68: Total deducciones = 66 + 67
    setVal('68', val('66') + val('67'));

    // 69: Rentas exentas limitadas (Input/Distribution)

    // 70: Renta líquida ordinaria = 58 + 62 - 59 - 60 - 69
    setVal('70', val('58') + val('62') - val('59') - val('60') - val('69'));

    // 71: Pérdida líquida = 59 + 60 - 58 - 62
    setVal('71', val('59') + val('60') - val('58') - val('62'));

    // 73: Renta líquida ordinaria = 70 - 72
    setVal('73', val('70') - val('72'));


    /** CÉDULA GENERAL - RENTAS NO LABORALES */
    // 78: Renta líquida = 74 - 75 - 76 - 77
    setVal('78', val('74') - val('75') - val('76') - val('77'));

    // 82: Total rentas exentas = 80 + 81
    setVal('82', val('80') + val('81'));

    // 85: Total deducciones = 83 + 84
    setVal('85', val('83') + val('84'));

    // 87: Renta líquida ordinaria = 74 + 79 - 75 - 76 - 77 - 86
    setVal('87', val('74') + val('79') - val('75') - val('76') - val('77') - val('86'));

    // 88: Pérdida líquida = 75 + 76 + 77 - 74 - 79
    setVal('88', val('75') + val('76') + val('77') - val('74') - val('79'));

    // 90: Renta líquida ordinaria = 87 - 89
    setVal('90', val('87') - val('89'));


    /** RESUMEN CÉDULA GENERAL */
    // 91: Renta líquida cédula general
    setVal('91', val('41') + val('42') + val('53') + val('57') + val('69') + val('73') + val('86') + val('90'));

    // 92: Rentas exentas y deducciones limitadas
    // Explicit formula from JSON: Casilla 28 + Casilla 41 + Casilla 53 + Casilla 69 + Casilla 86 + Casilla 139
    setVal('92', val('28') + val('41') + val('53') + val('69') + val('86') + val('139'));

    // 93: Renta líquida ordinaria cédula general = 91 - 92
    setVal('93', val('91') - val('92'));

    // 97: Renta líquida gravable cédula general = 93 + 96 - 94 - 95
    setVal('97', val('93') + val('96') - val('94') - val('95'));


    /** PENSIONES */
    // 101: Renta líquida = 99 - 100
    setVal('101', val('99') - val('100'));

    // 103: Renta líquida gravable = 101 - 102
    setVal('103', val('101') - val('102'));


    /** DIVIDENDOS */
    // 106: Renta líquida ordinaria 2016 y anteriores = 104 - 105
    setVal('106', val('104') - val('105'));

    // 111: Renta líquida gravable total = Mayor(97, 98) + 103 + 107 + 108 - 118
    // Note: 118 is tax, not usually subtracted from Base? 
    // JSON says: "Mayor(97,98) + 103 + 107 + 108 - 118"
    // Wait, 118 is "Por dividendos 2017+...".
    // Let's follow the JSON string strictly.
    const baseRenta = Math.max(val('97'), val('98'));
    setVal('111', baseRenta + val('103') + val('107') + val('108') - val('118'));


    /** GANANCIAS OCASIONALES */
    // 115: Ganancias ocasionales gravables = 112 - 113 - 114
    setVal('115', val('112') - val('113') - val('114'));


    /** LIQUIDACIÓN PRIVADA */
    // 121: Total impuesto = 116 + 117 + 118 + 119 + 120
    setVal('121', val('116') + val('117') + val('118') + val('119') + val('120'));

    // 125: Total descuentos = 122 + 123 + 124
    setVal('125', val('122') + val('123') + val('124'));

    // 126: Impuesto neto de renta = 121 - 125
    setVal('126', val('121') - val('125'));

    // 129: Total impuesto a cargo = 126 + 127 - 128
    setVal('129', val('126') + val('127') - val('128'));

    // 134: Saldo a pagar = 129 + 133 - 130 - 131 - 132
    setVal('134', val('129') + val('133') - val('130') - val('131') - val('132'));

    // 136: Total saldo a pagar = 129 + 133 + 135 - 130 - 131 - 132
    setVal('136', val('129') + val('133') + val('135') - val('130') - val('131') - val('132'));

    // 137: Total saldo a favor = 130 + 131 + 132 - 129 - 133 - 135
    setVal('137', val('130') + val('131') + val('132') - val('129') - val('133') - val('135'));

    return Array.from(bucketMap.values());
};
