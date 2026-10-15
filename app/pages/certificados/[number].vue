<script setup lang="ts">
import { DuiButton, DuiAlert } from '@dronico/droni-kit'

// Certificado Catastral Individual (PMR34) — vista imprimible
// Plantilla de referencia: sources/PMR34_spaces.docx
definePageMeta({ layout: false })

type Certificate = {
  certificateNumber: string
  addressedTo: string
  date: string
  time: string
  day: string
  month: string
  year: string
  issuer: { name: string; position: string | null }
  property: {
    number: string
    previousNumber: string | null
    zone: string | null
    registrationNumber: string | null
    address: string | null
    landArea: string | null
    builtArea: string | null
  }
  owners: { documentType: string | null; documentNumber: string | null; name: string; rightType: string; participation: string | null }[]
}

const route = useRoute()
const number = String(route.params.number)

const { data: cert, error } = await useFetch<Certificate>(`/api/properties/${number}/certificate`, {
  query: { addressedTo: route.query.para, consecutive: route.query.consecutivo },
})

const value = (v: string | null | undefined) => v || '—'
const print = () => window.print()

useHead({ title: () => (cert.value ? `Certificado ${cert.value.certificateNumber}` : 'Certificado catastral') })
</script>

<template>
  <div class="certificate-page">
    <div class="toolbar no-print">
      <DuiButton variant="ghost" :to="`/predios/${number}`">
        <i class="mdi mdi-arrow-left mr-1" /> Volver al predio
      </DuiButton>
      <span class="toolbar-hint">
        Al imprimir: papel <strong>Oficio</strong>, márgenes <strong>predeterminados</strong> y sin "Encabezados y pies de página".
      </span>
      <DuiButton v-if="cert" color="primary" @click="print">
        <i class="mdi mdi-printer-outline mr-1" /> Imprimir
      </DuiButton>
    </div>

    <div v-if="error" class="sheet sheet-error">
      <DuiAlert color="danger" variant="outline">
        <i class="mdi mdi-alert-circle-outline mr-1" /> {{ fetchErrorMessage(error, 'No se pudo generar el certificado') }}
      </DuiAlert>
    </div>

    <div v-else-if="cert" class="sheet">
      <!-- Encabezado (se repite en cada página al imprimir) -->
      <header class="page-header">
        <table class="bordered header-table">
          <colgroup>
            <col style="width: 19.4%" />
            <col style="width: 55.6%" />
            <col style="width: 25%" />
          </colgroup>
          <tbody>
            <tr>
              <td rowspan="4" class="center"><img src="/certificates/logo-girardot.png" alt="Alcaldía de Girardot" class="logo" /></td>
              <td rowspan="4" class="center bold">
                CERTIFICADO CATASTRAL INDIVIDUAL<br />
                PROCESO GESTIÓN CATASTRAL
              </td>
              <td class="bold">Código: PMR34</td>
            </tr>
            <tr><td class="bold">Versión: 1</td></tr>
            <tr><td class="bold">Año: 2026</td></tr>
            <tr><td class="bold">Copia Controlada</td></tr>
          </tbody>
        </table>
      </header>

      <!-- Pie (se repite en cada página al imprimir) -->
      <footer class="page-footer">
        <img src="/certificates/footer-girardot.jpg" alt="Alcaldía de Girardot - Carrera 11 No. 17 Esquina" />
      </footer>

      <!-- thead/tfoot reservan el espacio del encabezado y pie fijos en cada página impresa -->
      <table class="page-layout">
        <thead><tr><td><div class="header-space" /></td></tr></thead>
        <tfoot><tr><td><div class="footer-space" /></td></tr></tfoot>
        <tbody>
          <tr>
            <td class="content">
              <div class="meta">
                <p><strong>Fecha {{ cert.date }}</strong></p>
                <p><strong>Hora: {{ cert.time }}</strong></p>
                <p><strong>Sede: Oficina de Gestión Catastral de Girardot</strong></p>
                <p class="right"><strong>No. CERTIFICADO: {{ cert.certificateNumber }}</strong></p>
              </div>

              <p class="justify">
                La Oficina de Gestión Catastral de Girardot certifica que el predio en mención se encuentra inscrito en la base de
                datos catastral del Municipio de Girardot con la siguiente información:
              </p>

              <table class="bordered data-table">
                <colgroup>
                  <col style="width: 20.8%" />
                  <col style="width: 29%" />
                  <col style="width: 27.9%" />
                  <col style="width: 22.3%" />
                </colgroup>
                <tbody>
                  <tr>
                    <th>DEPARTAMENTO:</th>
                    <td>CUNDINAMARCA</td>
                    <th>ZONA:</th>
                    <td>{{ value(cert.property.zone) }}</td>
                  </tr>
                  <tr>
                    <th>MUNICIPIO:</th>
                    <td>GIRARDOT</td>
                    <th>FOLIO DE MATRÍCULA INMOBILIARIA</th>
                    <td>{{ value(cert.property.registrationNumber) }}</td>
                  </tr>
                  <tr>
                    <th>DIRECCIÓN:</th>
                    <td>{{ value(cert.property.address) }}</td>
                    <th>ÁREA TERRENO:</th>
                    <td>{{ value(cert.property.landArea) }} m2</td>
                  </tr>
                  <tr>
                    <th>NÚMERO PREDIAL ANTERIOR:</th>
                    <td>{{ value(cert.property.previousNumber) }}</td>
                    <th>ÁREA CONSTRUIDA:</th>
                    <td>{{ value(cert.property.builtArea) }} m2</td>
                  </tr>
                  <tr>
                    <td />
                    <td />
                    <th>TOTAL DE INTERESADOS:</th>
                    <td>{{ cert.owners.length }}</td>
                  </tr>
                  <tr>
                    <th colspan="2">NÚMERO PREDIAL NACIONAL:</th>
                    <td colspan="2">{{ cert.property.number }}</td>
                  </tr>
                </tbody>
              </table>

              <p class="center section-title"><strong>LISTA DE INTERESADOS</strong></p>

              <table class="bordered owners-table">
                <colgroup>
                  <col style="width: 13.7%" />
                  <col style="width: 12.8%" />
                  <col style="width: 40.2%" />
                  <col style="width: 12.8%" />
                  <col style="width: 20.5%" />
                </colgroup>
                <thead>
                  <tr>
                    <th class="center">TIPO DE DOCUMENTO</th>
                    <th class="center">DOCUMENTO</th>
                    <th class="center">NOMBRE</th>
                    <th class="center">TIPO INTERESADO</th>
                    <th class="center">PORCENTAJE DE PARTICIPACIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(owner, i) in cert.owners" :key="i">
                    <td>{{ value(owner.documentType) }}</td>
                    <td>{{ value(owner.documentNumber) }}</td>
                    <td>{{ owner.name }}</td>
                    <td>{{ owner.rightType }}</td>
                    <td>{{ owner.participation ? `${owner.participation} %` : '—' }}</td>
                  </tr>
                  <tr v-if="!cert.owners.length">
                    <td colspan="5" class="center">Sin interesados registrados</td>
                  </tr>
                </tbody>
              </table>

              <p class="justify">
                El presente certificado se expide para <strong>{{ cert.addressedTo }}</strong>, a solicitud del interesado a los
                {{ cert.day }} días del mes de {{ cert.month }} del {{ cert.year }}.
              </p>

              <div class="observations">
                <p><strong>Observaciones de validación de la información:</strong></p>
                <p>
                  La inscripción en el catastro no constituye título de dominio, no sanea vicios de la propiedad o de la tradición
                  y no puede alegarse como excepción contra quien pretenda tener mejor derecho de propiedad o posesión sobre el
                  predio, de conformidad con lo dispuesto en el artículo 2.2.2.1.2 del Decreto 148 de 2020 y en el artículo 1.5
                  de la Resolución 1040 de 2023 del IGAC.
                </p>
                <p>
                  Se certifica que la información contenida corresponde a lo registrado en la base catastral al momento de la
                  expedición del presente documento, sin perjuicio de que dicha información pueda diferir de la realidad física,
                  jurídica o económica actual del inmueble y, por tanto, requiera actualización conforme a la normativa vigente.
                </p>
                <p>
                  Para el caso de entidades públicas del orden nacional o autoridades judiciales, deberá adjuntarse el oficio
                  emitido por la entidad solicitante.
                </p>
                <p>
                  Se advierte que es responsabilidad exclusiva de la entidad o usuario solicitante hacer un uso adecuado, legal y
                  responsable de la información contenida en el presente certificado.
                </p>
                <p>
                  El certificado catastral tiene únicamente fines informativos y no constituye prueba plena de propiedad,
                  posesión o derechos reales sobre el predio, toda vez que su finalidad es registrar el estado catastral en un
                  momento determinado.
                </p>
                <p>
                  La expedición del presente certificado no sustituye los trámites de conservación catastral ni implica
                  validación de linderos, áreas o situaciones jurídicas que deban ser objeto de procedimiento administrativo o
                  judicial independiente conforme a la normativa vigente.
                </p>
                <p>
                  Ante cualquier inquietud, puede escribir al correo electrónico:
                  <span class="email">gestioncatastral@girardot-cundinamarca.gov.co</span>.
                </p>
              </div>

              <!-- Firma y gestión documental siempre juntas en la misma página -->
              <div class="closing">
                <div class="signature">
                  <p><strong>GERMAN ALBERTO PINZÓN WALTERO</strong></p>
                  <p><strong>Jefe Oficina Gestión Catastral</strong></p>
                </div>

                <div class="document-management">
                  <p>GESTIÓN DOCUMENTAL:</p>
                  <p>Original: Destinatarios</p>
                  <p>1ª Copia: Oficina de Gestión Catastral de Girardot</p>
                  <p>Proyectó: {{ cert.issuer.name }}.{{ cert.issuer.position ? ` ${cert.issuer.position}` : '' }}</p>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style>
/* Página oficio (21,6 × 33 cm). Los márgenes laterales los maneja la hoja para que el pie ocupe todo el ancho. */
@page {
  size: 216mm 330mm;
  margin: 12.5mm 0 8mm 0;

  @bottom-right {
    content: 'Página ' counter(page) ' de ' counter(pages);
    font-family: Calibri, Carlito, Arial, sans-serif;
    font-size: 8pt;
    margin-right: 20mm;
  }
}

/* El certificado siempre se ve en claro, aunque la app esté en modo oscuro */
html:has(.certificate-page) {
  color-scheme: light;
  background: #e5e7eb;
}

@media print {
  html:has(.certificate-page) {
    background: #fff;
  }
}
</style>

<style scoped>
.certificate-page {
  --header-height: 24mm;
  --footer-height: 37mm;
  min-height: 100vh;
  padding: 16px 0 32px;
  color: #000;
  font-family: Calibri, Carlito, Arial, sans-serif;
  font-size: 10pt;
  line-height: 1.25;
}

.toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  max-width: 216mm;
  margin: 0 auto 16px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.15);
  font-family: system-ui, sans-serif;
}

.toolbar-hint {
  flex: 1;
  font-size: 12px;
  color: #4b5563;
}

.sheet {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 216mm;
  max-width: 100%;
  margin: 0 auto;
  padding: 12.5mm 20mm 0;
  background: #fff;
  box-shadow: 0 2px 12px rgb(0 0 0 / 0.2);
}

.sheet-error {
  padding: 20mm;
}

p {
  margin: 0;
}

.bold,
th {
  font-weight: 700;
}

.center {
  text-align: center;
}

.right {
  text-align: right;
}

.justify {
  text-align: justify;
  margin: 10pt 0;
}

/* Tablas con bordes finos como la plantilla */
.bordered {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.bordered th,
.bordered td {
  border: 0.5pt solid #000;
  padding: 2pt 4pt;
  text-align: left;
  vertical-align: middle;
  overflow-wrap: break-word;
}

/* Columnas estrechas como en la plantilla: letra un poco menor para no partir palabras */
.owners-table {
  font-size: 9pt;
}

.owners-table th,
.owners-table td {
  padding: 2pt 3pt;
}

.owners-table thead th {
  font-size: 8pt;
  overflow-wrap: normal;
}

.bordered th.center,
.bordered td.center {
  text-align: center;
}

.header-table td {
  height: 4mm;
}

.logo {
  display: block;
  width: 32mm;
  max-width: 100%;
  margin: 0 auto;
}

.meta p {
  line-height: 1.4;
}

.section-title {
  margin: 12pt 0 4pt;
}

.owners-table thead {
  display: table-header-group;
}

.owners-table tr,
.data-table tr {
  break-inside: avoid;
}

.observations {
  margin-top: 12pt;
  font-size: 8pt;
  text-align: justify;
}

.observations p {
  margin-bottom: 6pt;
}

.email {
  color: #0070c0;
}

.closing {
  break-inside: avoid;
}

/* Espacio para la firma manuscrita */
.signature {
  padding-top: 16mm;
}

.document-management {
  margin-top: 6mm;
  font-size: 7pt;
}

/* En pantalla el encabezado y el pie se muestran una sola vez */
.page-layout {
  width: 100%;
  border-collapse: collapse;
}

.page-layout > thead,
.page-layout > tfoot {
  display: none;
}

.page-layout td.content {
  padding: 0;
}

.page-header {
  margin-bottom: 8mm;
}

.page-footer {
  order: 2;
  margin: 10mm -20mm 0;
}

.page-footer img {
  display: block;
  width: 100%;
}

@media print {
  .no-print {
    display: none !important;
  }

  .certificate-page {
    padding: 0;
    min-height: 0;
  }

  .sheet {
    display: block;
    width: auto;
    margin: 0;
    padding: 0 20mm;
    box-shadow: none;
  }

  /* Encabezado y pie fijos: Chrome los repite en cada página impresa */
  .page-header {
    position: fixed;
    top: 0;
    left: 20mm;
    right: 20mm;
    margin: 0;
  }

  .page-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    margin: 0;
  }

  .page-layout > thead {
    display: table-header-group;
  }

  .page-layout > tfoot {
    display: table-footer-group;
  }

  .header-space {
    height: calc(var(--header-height) + 4mm);
  }

  .footer-space {
    height: var(--footer-height);
  }
}
</style>
