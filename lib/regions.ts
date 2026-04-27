/**
 * Países soportados (ISO 3166-1 alpha-2) y subdivisiones administrativas
 * de primer nivel (ISO 3166-2). Esta es la fuente de verdad de geografía
 * en el proyecto — `lib/validations/auth.ts` reexporta SUPPORTED_REGIONS
 * y REGION_LABELS para mantener la API antigua sin romper imports.
 *
 * Subdivisiones por país:
 *
 * Cada país las llama de forma distinta:
 *  - Chile: regiones (16)
 *  - Argentina: provincias (24, incluyendo CABA)
 *  - Perú: departamentos (25, incluyendo Callao)
 *  - Colombia: departamentos (33, incluyendo Bogotá D.C.)
 *  - México: estados (32, incluyendo CDMX)
 *  - Ecuador: provincias (24)
 *  - Uruguay: departamentos (19)
 *
 * El `code` es el ISO 3166-2 oficial (ej: "CL-RM"). Lo guardamos en BD
 * para que el dato sea estable: si en algún momento cambia el nombre
 * oficial, solo actualizamos el label aquí. Búsquedas y filtros siempre
 * usan el code.
 */

// Códigos ISO-3166-1 alpha-2 de países LATAM disponibles en el modelo de datos.
// SES arranca solo Chile en Fase 0 — los demás están preparados para escalar
// sin migrar el esquema. El formulario público filtra por SUPPORTED_REGIONS
// pero el dato persistido siempre usa el code ISO 3166-2.
export const SUPPORTED_REGIONS = ['CL', 'AR', 'PE', 'CO', 'MX', 'EC', 'UY'] as const;
export type SupportedRegion = (typeof SUPPORTED_REGIONS)[number];

export const REGION_LABELS: Record<SupportedRegion, string> = {
  CL: 'Chile',
  AR: 'Argentina',
  PE: 'Perú',
  CO: 'Colombia',
  MX: 'México',
  EC: 'Ecuador',
  UY: 'Uruguay',
};

export type Subdivision = {
  code: string; // ISO 3166-2 (ej: "CL-RM")
  name: string; // Nombre oficial mostrado al usuario
};

const SUBDIVISIONS_DATA: Record<SupportedRegion, ReadonlyArray<Subdivision>> = {
  CL: [
    { code: 'CL-AI', name: 'Aysén' },
    { code: 'CL-AN', name: 'Antofagasta' },
    { code: 'CL-AP', name: 'Arica y Parinacota' },
    { code: 'CL-AR', name: 'La Araucanía' },
    { code: 'CL-AT', name: 'Atacama' },
    { code: 'CL-BI', name: 'Biobío' },
    { code: 'CL-CO', name: 'Coquimbo' },
    { code: 'CL-LI', name: 'Libertador General Bernardo O’Higgins' },
    { code: 'CL-LL', name: 'Los Lagos' },
    { code: 'CL-LR', name: 'Los Ríos' },
    { code: 'CL-MA', name: 'Magallanes y la Antártica Chilena' },
    { code: 'CL-ML', name: 'Maule' },
    { code: 'CL-NB', name: 'Ñuble' },
    { code: 'CL-RM', name: 'Región Metropolitana de Santiago' },
    { code: 'CL-TA', name: 'Tarapacá' },
    { code: 'CL-VS', name: 'Valparaíso' },
  ],
  AR: [
    { code: 'AR-C', name: 'Ciudad Autónoma de Buenos Aires' },
    { code: 'AR-B', name: 'Buenos Aires' },
    { code: 'AR-K', name: 'Catamarca' },
    { code: 'AR-H', name: 'Chaco' },
    { code: 'AR-U', name: 'Chubut' },
    { code: 'AR-X', name: 'Córdoba' },
    { code: 'AR-W', name: 'Corrientes' },
    { code: 'AR-E', name: 'Entre Ríos' },
    { code: 'AR-P', name: 'Formosa' },
    { code: 'AR-Y', name: 'Jujuy' },
    { code: 'AR-L', name: 'La Pampa' },
    { code: 'AR-F', name: 'La Rioja' },
    { code: 'AR-M', name: 'Mendoza' },
    { code: 'AR-N', name: 'Misiones' },
    { code: 'AR-Q', name: 'Neuquén' },
    { code: 'AR-R', name: 'Río Negro' },
    { code: 'AR-A', name: 'Salta' },
    { code: 'AR-J', name: 'San Juan' },
    { code: 'AR-D', name: 'San Luis' },
    { code: 'AR-Z', name: 'Santa Cruz' },
    { code: 'AR-S', name: 'Santa Fe' },
    { code: 'AR-G', name: 'Santiago del Estero' },
    { code: 'AR-V', name: 'Tierra del Fuego' },
    { code: 'AR-T', name: 'Tucumán' },
  ],
  PE: [
    { code: 'PE-AMA', name: 'Amazonas' },
    { code: 'PE-ANC', name: 'Áncash' },
    { code: 'PE-APU', name: 'Apurímac' },
    { code: 'PE-ARE', name: 'Arequipa' },
    { code: 'PE-AYA', name: 'Ayacucho' },
    { code: 'PE-CAJ', name: 'Cajamarca' },
    { code: 'PE-CAL', name: 'Callao' },
    { code: 'PE-CUS', name: 'Cusco' },
    { code: 'PE-HUV', name: 'Huancavelica' },
    { code: 'PE-HUC', name: 'Huánuco' },
    { code: 'PE-ICA', name: 'Ica' },
    { code: 'PE-JUN', name: 'Junín' },
    { code: 'PE-LAL', name: 'La Libertad' },
    { code: 'PE-LAM', name: 'Lambayeque' },
    { code: 'PE-LIM', name: 'Lima' },
    { code: 'PE-LMA', name: 'Municipalidad Metropolitana de Lima' },
    { code: 'PE-LOR', name: 'Loreto' },
    { code: 'PE-MDD', name: 'Madre de Dios' },
    { code: 'PE-MOQ', name: 'Moquegua' },
    { code: 'PE-PAS', name: 'Pasco' },
    { code: 'PE-PIU', name: 'Piura' },
    { code: 'PE-PUN', name: 'Puno' },
    { code: 'PE-SAM', name: 'San Martín' },
    { code: 'PE-TAC', name: 'Tacna' },
    { code: 'PE-TUM', name: 'Tumbes' },
    { code: 'PE-UCA', name: 'Ucayali' },
  ],
  CO: [
    { code: 'CO-AMA', name: 'Amazonas' },
    { code: 'CO-ANT', name: 'Antioquia' },
    { code: 'CO-ARA', name: 'Arauca' },
    { code: 'CO-ATL', name: 'Atlántico' },
    { code: 'CO-BOL', name: 'Bolívar' },
    { code: 'CO-BOY', name: 'Boyacá' },
    { code: 'CO-CAL', name: 'Caldas' },
    { code: 'CO-CAQ', name: 'Caquetá' },
    { code: 'CO-CAS', name: 'Casanare' },
    { code: 'CO-CAU', name: 'Cauca' },
    { code: 'CO-CES', name: 'Cesar' },
    { code: 'CO-CHO', name: 'Chocó' },
    { code: 'CO-COR', name: 'Córdoba' },
    { code: 'CO-CUN', name: 'Cundinamarca' },
    { code: 'CO-DC', name: 'Bogotá D.C.' },
    { code: 'CO-GUA', name: 'Guainía' },
    { code: 'CO-GUV', name: 'Guaviare' },
    { code: 'CO-HUI', name: 'Huila' },
    { code: 'CO-LAG', name: 'La Guajira' },
    { code: 'CO-MAG', name: 'Magdalena' },
    { code: 'CO-MET', name: 'Meta' },
    { code: 'CO-NAR', name: 'Nariño' },
    { code: 'CO-NSA', name: 'Norte de Santander' },
    { code: 'CO-PUT', name: 'Putumayo' },
    { code: 'CO-QUI', name: 'Quindío' },
    { code: 'CO-RIS', name: 'Risaralda' },
    { code: 'CO-SAP', name: 'San Andrés y Providencia' },
    { code: 'CO-SAN', name: 'Santander' },
    { code: 'CO-SUC', name: 'Sucre' },
    { code: 'CO-TOL', name: 'Tolima' },
    { code: 'CO-VAC', name: 'Valle del Cauca' },
    { code: 'CO-VAU', name: 'Vaupés' },
    { code: 'CO-VID', name: 'Vichada' },
  ],
  MX: [
    { code: 'MX-AGU', name: 'Aguascalientes' },
    { code: 'MX-BCN', name: 'Baja California' },
    { code: 'MX-BCS', name: 'Baja California Sur' },
    { code: 'MX-CAM', name: 'Campeche' },
    { code: 'MX-CHP', name: 'Chiapas' },
    { code: 'MX-CHH', name: 'Chihuahua' },
    { code: 'MX-CMX', name: 'Ciudad de México' },
    { code: 'MX-COA', name: 'Coahuila' },
    { code: 'MX-COL', name: 'Colima' },
    { code: 'MX-DUR', name: 'Durango' },
    { code: 'MX-GUA', name: 'Guanajuato' },
    { code: 'MX-GRO', name: 'Guerrero' },
    { code: 'MX-HID', name: 'Hidalgo' },
    { code: 'MX-JAL', name: 'Jalisco' },
    { code: 'MX-MEX', name: 'México' },
    { code: 'MX-MIC', name: 'Michoacán' },
    { code: 'MX-MOR', name: 'Morelos' },
    { code: 'MX-NAY', name: 'Nayarit' },
    { code: 'MX-NLE', name: 'Nuevo León' },
    { code: 'MX-OAX', name: 'Oaxaca' },
    { code: 'MX-PUE', name: 'Puebla' },
    { code: 'MX-QUE', name: 'Querétaro' },
    { code: 'MX-ROO', name: 'Quintana Roo' },
    { code: 'MX-SLP', name: 'San Luis Potosí' },
    { code: 'MX-SIN', name: 'Sinaloa' },
    { code: 'MX-SON', name: 'Sonora' },
    { code: 'MX-TAB', name: 'Tabasco' },
    { code: 'MX-TAM', name: 'Tamaulipas' },
    { code: 'MX-TLA', name: 'Tlaxcala' },
    { code: 'MX-VER', name: 'Veracruz' },
    { code: 'MX-YUC', name: 'Yucatán' },
    { code: 'MX-ZAC', name: 'Zacatecas' },
  ],
  EC: [
    { code: 'EC-A', name: 'Azuay' },
    { code: 'EC-B', name: 'Bolívar' },
    { code: 'EC-F', name: 'Cañar' },
    { code: 'EC-C', name: 'Carchi' },
    { code: 'EC-H', name: 'Chimborazo' },
    { code: 'EC-X', name: 'Cotopaxi' },
    { code: 'EC-O', name: 'El Oro' },
    { code: 'EC-E', name: 'Esmeraldas' },
    { code: 'EC-W', name: 'Galápagos' },
    { code: 'EC-G', name: 'Guayas' },
    { code: 'EC-I', name: 'Imbabura' },
    { code: 'EC-L', name: 'Loja' },
    { code: 'EC-R', name: 'Los Ríos' },
    { code: 'EC-M', name: 'Manabí' },
    { code: 'EC-S', name: 'Morona Santiago' },
    { code: 'EC-N', name: 'Napo' },
    { code: 'EC-D', name: 'Orellana' },
    { code: 'EC-Y', name: 'Pastaza' },
    { code: 'EC-P', name: 'Pichincha' },
    { code: 'EC-SE', name: 'Santa Elena' },
    { code: 'EC-SD', name: 'Santo Domingo de los Tsáchilas' },
    { code: 'EC-U', name: 'Sucumbíos' },
    { code: 'EC-T', name: 'Tungurahua' },
    { code: 'EC-Z', name: 'Zamora Chinchipe' },
  ],
  UY: [
    { code: 'UY-AR', name: 'Artigas' },
    { code: 'UY-CA', name: 'Canelones' },
    { code: 'UY-CL', name: 'Cerro Largo' },
    { code: 'UY-CO', name: 'Colonia' },
    { code: 'UY-DU', name: 'Durazno' },
    { code: 'UY-FS', name: 'Flores' },
    { code: 'UY-FD', name: 'Florida' },
    { code: 'UY-LA', name: 'Lavalleja' },
    { code: 'UY-MA', name: 'Maldonado' },
    { code: 'UY-MO', name: 'Montevideo' },
    { code: 'UY-PA', name: 'Paysandú' },
    { code: 'UY-RN', name: 'Río Negro' },
    { code: 'UY-RV', name: 'Rivera' },
    { code: 'UY-RO', name: 'Rocha' },
    { code: 'UY-SA', name: 'Salto' },
    { code: 'UY-SJ', name: 'San José' },
    { code: 'UY-SO', name: 'Soriano' },
    { code: 'UY-TA', name: 'Tacuarembó' },
    { code: 'UY-TT', name: 'Treinta y Tres' },
  ],
};

// Cómo se llaman las subdivisiones en cada país (para el label del campo).
export const SUBDIVISION_LABEL: Record<SupportedRegion, string> = {
  CL: 'Región',
  AR: 'Provincia',
  PE: 'Departamento',
  CO: 'Departamento',
  MX: 'Estado',
  EC: 'Provincia',
  UY: 'Departamento',
};

export function getSubdivisions(country: SupportedRegion): ReadonlyArray<Subdivision> {
  return SUBDIVISIONS_DATA[country] ?? [];
}

/** Lookup rápido del nombre por código (ej: "CL-RM" → "Región Metropolitana"). */
export function getSubdivisionName(code: string | null | undefined): string | null {
  if (!code) return null;
  for (const country of Object.keys(SUBDIVISIONS_DATA) as SupportedRegion[]) {
    const found = SUBDIVISIONS_DATA[country].find((s) => s.code === code);
    if (found) return found.name;
  }
  return null;
}

/** Verifica que un code pertenezca al country indicado (validación al guardar). */
export function isValidSubdivisionForCountry(
  code: string | null | undefined,
  country: SupportedRegion,
): boolean {
  if (!code) return true; // null/undefined es válido (campo opcional)
  return SUBDIVISIONS_DATA[country].some((s) => s.code === code);
}
