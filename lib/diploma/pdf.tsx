import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from '@react-pdf/renderer';
import { generateQRDataUrl } from '@/lib/qr';

/**
 * Genera el PDF del diploma SES como Buffer listo para subir a R2.
 *
 * @react-pdf/renderer corre solo en el runtime Node — está marcado como
 * external en next.config.ts (serverExternalPackages) para que no se
 * bundlee en client. NO importar este archivo desde un client component.
 */

type DiplomaProps = {
  studentName: string;
  courseTitle: string;
  durationHours: number;
  finalGrade: number | null;
  issuedAt: Date;
  code: string;
  verifyUrl: string;
  instructorName: string;
  venueName: string | null;
};

const colors = {
  primary: '#2c5f4a',     // verde marca SES
  primaryDark: '#1f4836',
  primaryDeep: '#143828',
  accent: '#9a8a52',      // crema oscuro
  accentLight: '#d8c897', // crema claro (acentos en title)
  text: '#1a2622',
  textMuted: '#4a5450',
  border: '#d6d2c5',
  paperBg: '#fafaf7',
};

// Cargamos el sello una sola vez al importar el módulo. La salida del
// PDF debe verse igual en cada render — los Buffer se cachean a nivel
// de proceso, por eso es seguro leer el archivo aquí en el top-level.
const SEAL_BUFFER = readFileSync(
  path.join(process.cwd(), 'public', 'brand', 'logo-seal.png'),
);

const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: colors.paperBg,
    fontFamily: 'Helvetica',
    color: colors.text,
    position: 'relative',
  },

  // --- Marca de agua ---
  // Sello grande, semi-transparente, desplazado hacia la esquina
  // superior derecha para que entre solo media figura. Da peso
  // visual sin pelearse con el texto del centro.
  //
  // Mantener width/height ≤ 595pt (altura A4 horizontal) — si nos
  // pasamos, react-pdf manda la imagen a su propia página.
  watermark: {
    position: 'absolute',
    width: 560,
    height: 560,
    top: -120,
    right: -160,
    opacity: 0.09,
  },

  // --- Marco interior ---
  outerFrame: {
    margin: 24,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: 4,
    flexGrow: 1,
  },
  innerFrame: {
    borderWidth: 1,
    borderColor: colors.accent,
    padding: 24,
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  // --- Header ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSeal: {
    width: 36,
    height: 36,
    marginRight: 10,
  },
  brandTextCol: {
    flexDirection: 'column',
  },
  brandEyebrow: {
    fontSize: 8,
    letterSpacing: 3,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  brandName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.primaryDeep,
    marginTop: 1,
  },
  headerCode: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  headerCodeLabel: {
    fontSize: 7,
    letterSpacing: 1.6,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerCodeValue: {
    fontSize: 11,
    fontFamily: 'Courier-Bold',
    color: colors.primaryDeep,
    letterSpacing: 1.5,
  },

  // --- Cuerpo principal ---
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  pillEyebrow: {
    fontSize: 8,
    letterSpacing: 3,
    color: colors.primary,
    textTransform: 'uppercase',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 999,
    marginBottom: 14,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: colors.primaryDeep,
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  titleAccent: {
    fontSize: 32,
    fontFamily: 'Helvetica-BoldOblique',
    color: colors.primary,
    letterSpacing: -0.4,
  },
  intro: {
    fontSize: 11,
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 14,
    marginBottom: 4,
  },
  studentName: {
    fontSize: 30,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: colors.text,
    marginVertical: 4,
    letterSpacing: -0.5,
  },
  studentUnderline: {
    width: 220,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  bodyText: {
    fontSize: 11,
    textAlign: 'center',
    color: colors.text,
    lineHeight: 1.5,
    maxWidth: 460,
  },
  courseTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-BoldOblique',
    textAlign: 'center',
    color: colors.primary,
    marginVertical: 8,
    letterSpacing: -0.2,
  },

  // --- Meta row ---
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    width: '100%',
  },
  metaCell: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  metaCellDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  metaLabel: {
    fontSize: 7,
    letterSpacing: 1.4,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
  },

  // --- Footer ---
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 10,
  },
  signatureCol: {
    alignItems: 'center',
    paddingTop: 10,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: colors.text,
    width: 180,
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
    textAlign: 'center',
  },
  signatureLabel: {
    fontSize: 8,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  qrCol: {
    alignItems: 'center',
  },
  qrImage: {
    width: 72,
    height: 72,
  },
  qrLabel: {
    fontSize: 7,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 3,
    letterSpacing: 0.5,
  },
});

function formatDateLong(d: Date): string {
  return d.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function DiplomaDocument({
  studentName,
  courseTitle,
  durationHours,
  finalGrade,
  issuedAt,
  code,
  verifyUrl,
  qrDataUrl,
  instructorName,
  venueName,
}: DiplomaProps & { qrDataUrl: string }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Marca de agua: sello grande rotado en la esquina superior derecha */}
        <Image src={SEAL_BUFFER} style={styles.watermark} />

        <View style={styles.outerFrame}>
          <View style={styles.innerFrame}>
            {/* Header — marca a la izquierda, código a la derecha */}
            <View style={styles.header}>
              <View style={styles.headerBrand}>
                <Image src={SEAL_BUFFER} style={styles.headerSeal} />
                <View style={styles.brandTextCol}>
                  <Text style={styles.brandEyebrow}>SecuritasEtSalus</Text>
                  <Text style={styles.brandName}>Escuela de Cerrajería</Text>
                </View>
              </View>
              <View style={styles.headerCode}>
                <Text style={styles.headerCodeLabel}>Código de verificación</Text>
                <Text style={styles.headerCodeValue}>{code}</Text>
              </View>
            </View>

            {/* Cuerpo — título, alumno, curso */}
            <View style={styles.body}>
              <Text style={styles.pillEyebrow}>Diploma de formación</Text>

              <Text style={styles.title}>
                Acredita
                <Text style={styles.titleAccent}> al titular</Text>
              </Text>
              <Text style={styles.title}>
                de la
                <Text style={styles.titleAccent}> formación impartida.</Text>
              </Text>

              <Text style={styles.intro}>Se otorga el presente diploma a</Text>
              <Text style={styles.studentName}>{studentName}</Text>
              <View style={styles.studentUnderline} />

              <Text style={styles.bodyText}>
                por haber completado satisfactoriamente el curso
              </Text>

              <Text style={styles.courseTitle}>«{courseTitle}»</Text>

              {/* Meta row */}
              <View style={styles.metaRow}>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>Duración</Text>
                  <Text style={styles.metaValue}>{durationHours} h lectivas</Text>
                </View>
                {finalGrade !== null ? (
                  <>
                    <View style={styles.metaCellDivider} />
                    <View style={styles.metaCell}>
                      <Text style={styles.metaLabel}>Nota final</Text>
                      <Text style={styles.metaValue}>{finalGrade.toFixed(1)} / 7.0</Text>
                    </View>
                  </>
                ) : null}
                <View style={styles.metaCellDivider} />
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>Fecha</Text>
                  <Text style={styles.metaValue}>{formatDateLong(issuedAt)}</Text>
                </View>
                {venueName ? (
                  <>
                    <View style={styles.metaCellDivider} />
                    <View style={styles.metaCell}>
                      <Text style={styles.metaLabel}>Sede</Text>
                      <Text style={styles.metaValue}>{venueName}</Text>
                    </View>
                  </>
                ) : null}
              </View>
            </View>

            {/* Footer — firma instructor + QR */}
            <View style={styles.footer}>
              <View style={styles.signatureCol}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureName}>{instructorName}</Text>
                <Text style={styles.signatureLabel}>Instructor del curso</Text>
              </View>

              <View style={styles.qrCol}>
                <Image src={qrDataUrl} style={styles.qrImage} />
                <Text style={styles.qrLabel}>Verifica en {new URL(verifyUrl).host}</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Renderiza el diploma a Buffer PDF. Llamar solo desde server.
 */
export async function renderDiplomaPdf(props: DiplomaProps): Promise<Buffer> {
  const qrDataUrl = await generateQRDataUrl(props.verifyUrl);
  const blob = await pdf(<DiplomaDocument {...props} qrDataUrl={qrDataUrl} />).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
