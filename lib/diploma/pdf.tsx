/* eslint-disable jsx-a11y/alt-text */
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
  accent: '#9a8a52',      // crema oscuro
  text: '#1a2622',
  textMuted: '#4a5450',
  border: '#d6d2c5',
  paperBg: '#fafaf7',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: colors.paperBg,
    fontFamily: 'Helvetica',
    color: colors.text,
  },
  // Marco doble que abraza todo el contenido.
  outerFrame: {
    borderWidth: 2,
    borderColor: colors.primary,
    padding: 6,
    flexGrow: 1,
  },
  innerFrame: {
    borderWidth: 1,
    borderColor: colors.accent,
    padding: 30,
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  brand: {
    textAlign: 'center',
    marginBottom: 12,
  },
  brandEyebrow: {
    fontSize: 10,
    letterSpacing: 4,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  brandName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginTop: 4,
    fontFamily: 'Helvetica-Bold',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
    marginVertical: 12,
    width: 80,
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: colors.primaryDark,
    marginVertical: 8,
  },
  intro: {
    fontSize: 12,
    textAlign: 'center',
    color: colors.textMuted,
    marginBottom: 16,
  },
  studentName: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: colors.text,
    marginVertical: 12,
  },
  body: {
    fontSize: 12,
    textAlign: 'center',
    color: colors.text,
    lineHeight: 1.6,
    marginVertical: 8,
  },
  courseTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: colors.primary,
    marginVertical: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  metaCell: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  metaLabel: {
    fontSize: 8,
    letterSpacing: 1.5,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  signatureCol: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 30,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: colors.text,
    width: 180,
    marginBottom: 6,
  },
  signatureLabel: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  signatureName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
    textAlign: 'center',
  },
  qrCol: {
    alignItems: 'center',
  },
  qrImage: {
    width: 80,
    height: 80,
  },
  qrCode: {
    fontSize: 8,
    fontFamily: 'Courier',
    color: colors.textMuted,
    marginTop: 4,
  },
  qrLabel: {
    fontSize: 7,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
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
        <View style={styles.outerFrame}>
          <View style={styles.innerFrame}>
            <View>
              <View style={styles.brand}>
                <Text style={styles.brandEyebrow}>SecuritasEtSalus</Text>
                <Text style={styles.brandName}>Escuela de Cerrajería</Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.title}>Diploma de formación</Text>
              <Text style={styles.intro}>Se otorga el presente diploma a</Text>

              <Text style={styles.studentName}>{studentName}</Text>

              <Text style={styles.body}>
                por haber completado satisfactoriamente el curso
              </Text>

              <Text style={styles.courseTitle}>«{courseTitle}»</Text>

              <View style={styles.metaRow}>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>Duración</Text>
                  <Text style={styles.metaValue}>{durationHours} h lectivas</Text>
                </View>
                {finalGrade !== null ? (
                  <View style={styles.metaCell}>
                    <Text style={styles.metaLabel}>Nota final</Text>
                    <Text style={styles.metaValue}>{finalGrade.toFixed(1)} / 7.0</Text>
                  </View>
                ) : null}
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>Fecha</Text>
                  <Text style={styles.metaValue}>{formatDateLong(issuedAt)}</Text>
                </View>
                {venueName ? (
                  <View style={styles.metaCell}>
                    <Text style={styles.metaLabel}>Sede</Text>
                    <Text style={styles.metaValue}>{venueName}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.footer}>
              <View style={styles.signatureCol}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureName}>{instructorName}</Text>
                <Text style={styles.signatureLabel}>Instructor del curso</Text>
              </View>

              <View style={styles.qrCol}>
                <Image src={qrDataUrl} style={styles.qrImage} />
                <Text style={styles.qrCode}>{code}</Text>
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
