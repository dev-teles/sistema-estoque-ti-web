/**
 * Gerador nativo de planilhas Excel (.xlsx - Office Open XML) sem dependências externas.
 * Suporta larguras de coluna, células mescladas, cores, bordas, formatos numéricos/moeda (R$),
 * congelamento de cabeçalho e autofiltro.
 */

export type CellStyleId =
  | 'title'
  | 'subtitle'
  | 'kpiLabel'
  | 'kpiValueInt'
  | 'kpiValueCurrency'
  | 'header'
  | 'headerCenter'
  | 'headerRight'
  | 'text'
  | 'textAlt'
  | 'textCenter'
  | 'textCenterAlt'
  | 'textBold'
  | 'textBoldAlt'
  | 'int'
  | 'intAlt'
  | 'intBold'
  | 'intBoldAlt'
  | 'intGreen'
  | 'intGreenAlt'
  | 'intRed'
  | 'intRedAlt'
  | 'intHighlight'
  | 'intHighlightAlt'
  | 'decimal'
  | 'decimalAlt'
  | 'currency'
  | 'currencyAlt'
  | 'statusCritico'
  | 'statusAlerta'
  | 'statusPedido'
  | 'statusRegular'
  | 'totalLabel'
  | 'totalInt'
  | 'totalCurrency'
  | 'emptyRow';

export interface ExcelCell {
  v: string | number | null | undefined;
  t?: 's' | 'n';
  s?: CellStyleId;
}

export interface ExcelSheetSpec {
  sheetName: string;
  colWidths: number[];
  rows: (ExcelCell | null)[][];
  merges?: string[]; // ex: ['A1:K1', 'A2:K2']
  freezeRow?: number; // linha abaixo da qual congelar (ex: 6 congela linhas 1..6)
  autoFilterRef?: string; // ex: 'A6:K20'
  landscape?: boolean;
}

const STYLE_INDEX: Record<CellStyleId, number> = {
  text: 0,
  title: 1,
  subtitle: 2,
  kpiLabel: 3,
  kpiValueInt: 4,
  kpiValueCurrency: 5,
  header: 6,
  headerCenter: 7,
  headerRight: 8,
  textAlt: 9,
  textCenter: 10,
  textCenterAlt: 11,
  textBold: 12,
  textBoldAlt: 13,
  int: 14,
  intAlt: 15,
  intBold: 16,
  intBoldAlt: 17,
  intGreen: 18,
  intGreenAlt: 19,
  intRed: 20,
  intRedAlt: 21,
  intHighlight: 22,
  intHighlightAlt: 23,
  decimal: 24,
  decimalAlt: 25,
  currency: 26,
  currencyAlt: 27,
  statusCritico: 28,
  statusAlerta: 29,
  statusPedido: 30,
  statusRegular: 31,
  totalLabel: 32,
  totalInt: 33,
  totalCurrency: 34,
  emptyRow: 35,
};

function xmlEscape(val: string): string {
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function colLetter(colIdx0: number): string {
  let n = colIdx0 + 1;
  let s = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function buildStylesXml(): string {
  // numFmts customizados:
  // 164: #,##0
  // 165: #,##0.00
  // 166: "R$" #,##0.00
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="3">
    <numFmt numFmtId="164" formatCode="#,##0"/>
    <numFmt numFmtId="165" formatCode="#,##0.00"/>
    <numFmt numFmtId="166" formatCode="&quot;R$&quot;\\ #,##0.00"/>
  </numFmts>
  <fonts count="11">
    <font><sz val="10"/><color rgb="FF1E293B"/><name val="Segoe UI"/></font>
    <font><b/><sz val="13"/><color rgb="FFD4A359"/><name val="Segoe UI"/></font>
    <font><sz val="9.5"/><color rgb="FFE2E8F0"/><name val="Segoe UI"/></font>
    <font><b/><sz val="8.5"/><color rgb="FF64748B"/><name val="Segoe UI"/></font>
    <font><b/><sz val="11"/><color rgb="FF0F172A"/><name val="Segoe UI"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Segoe UI"/></font>
    <font><b/><sz val="10"/><color rgb="FF0F172A"/><name val="Segoe UI"/></font>
    <font><b/><sz val="10"/><color rgb="FF15803D"/><name val="Segoe UI"/></font>
    <font><b/><sz val="10"/><color rgb="FFB91C1C"/><name val="Segoe UI"/></font>
    <font><b/><sz val="9.5"/><color rgb="FF92400E"/><name val="Segoe UI"/></font>
    <font><i/><sz val="10"/><color rgb="FF64748B"/><name val="Segoe UI"/></font>
  </fonts>
  <fills count="12">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0E1218"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1F2633"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFFBEB"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEF3C7"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFDBEAFE"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFDCFCE7"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/></patternFill></fill>
  </fills>
  <borders count="4">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
    </border>
    <border>
      <left style="thin"><color rgb="FF334155"/></left>
      <right style="thin"><color rgb="FF334155"/></right>
      <top style="medium"><color rgb="FF0E1218"/></top>
      <bottom style="medium"><color rgb="FFD4A359"/></bottom>
    </border>
    <border>
      <left style="thin"><color rgb="FF94A3B8"/></left>
      <right style="thin"><color rgb="FF94A3B8"/></right>
      <top style="medium"><color rgb="FF0F172A"/></top>
      <bottom style="double"><color rgb="FF0F172A"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="36">
    <!-- 0: text -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <!-- 1: title -->
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center" indent="1"/></xf>
    <!-- 2: subtitle -->
    <xf numFmtId="0" fontId="2" fillId="3" borderId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center" indent="1"/></xf>
    <!-- 3: kpiLabel -->
    <xf numFmtId="0" fontId="3" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 4: kpiValueInt -->
    <xf numFmtId="164" fontId="4" fillId="4" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 5: kpiValueCurrency -->
    <xf numFmtId="166" fontId="4" fillId="4" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 6: header -->
    <xf numFmtId="0" fontId="5" fillId="3" borderId="2" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <!-- 7: headerCenter -->
    <xf numFmtId="0" fontId="5" fillId="3" borderId="2" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <!-- 8: headerRight -->
    <xf numFmtId="0" fontId="5" fillId="3" borderId="2" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1"/></xf>
    <!-- 9: textAlt -->
    <xf numFmtId="0" fontId="0" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <!-- 10: textCenter -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 11: textCenterAlt -->
    <xf numFmtId="0" fontId="0" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 12: textBold -->
    <xf numFmtId="0" fontId="6" fillId="0" borderId="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <!-- 13: textBoldAlt -->
    <xf numFmtId="0" fontId="6" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <!-- 14: int -->
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <!-- 15: intAlt -->
    <xf numFmtId="164" fontId="0" fillId="4" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <!-- 16: intBold -->
    <xf numFmtId="164" fontId="6" fillId="0" borderId="1" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <!-- 17: intBoldAlt -->
    <xf numFmtId="164" fontId="6" fillId="4" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <!-- 18: intGreen -->
    <xf numFmtId="164" fontId="7" fillId="0" borderId="1" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <!-- 19: intGreenAlt -->
    <xf numFmtId="164" fontId="7" fillId="4" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <!-- 20: intRed -->
    <xf numFmtId="164" fontId="8" fillId="0" borderId="1" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <!-- 21: intRedAlt -->
    <xf numFmtId="164" fontId="8" fillId="4" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <!-- 22: intHighlight -->
    <xf numFmtId="164" fontId="9" fillId="6" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <!-- 23: intHighlightAlt -->
    <xf numFmtId="164" fontId="9" fillId="7" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <!-- 24: decimal -->
    <xf numFmtId="165" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <!-- 25: decimalAlt -->
    <xf numFmtId="165" fontId="0" fillId="4" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <!-- 26: currency -->
    <xf numFmtId="166" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <!-- 27: currencyAlt -->
    <xf numFmtId="166" fontId="0" fillId="4" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <!-- 28: statusCritico -->
    <xf numFmtId="0" fontId="8" fillId="8" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 29: statusAlerta -->
    <xf numFmtId="0" fontId="9" fillId="7" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 30: statusPedido -->
    <xf numFmtId="0" fontId="6" fillId="9" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 31: statusRegular -->
    <xf numFmtId="0" fontId="7" fillId="10" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 32: totalLabel -->
    <xf numFmtId="0" fontId="6" fillId="11" borderId="3" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <!-- 33: totalInt -->
    <xf numFmtId="164" fontId="6" fillId="11" borderId="3" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <!-- 34: totalCurrency -->
    <xf numFmtId="166" fontId="6" fillId="11" borderId="3" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <!-- 35: emptyRow -->
    <xf numFmtId="0" fontId="10" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  </cellXfs>
</styleSheet>`;
}

function buildSheetXml(spec: ExcelSheetSpec): string {
  const colsXml = spec.colWidths
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join('');

  const rowsXml: string[] = [];
  spec.rows.forEach((row, rIdx) => {
    const rNum = rIdx + 1;
    let ht = 21;
    if (rNum === 1) ht = 30;
    else if (rNum === 2) ht = 22;
    else if (rNum === 6) ht = 28;
    else if (rNum === spec.rows.length && rNum > 6) ht = 25;

    const cellsXml: string[] = [];
    row.forEach((cell, cIdx) => {
      if (!cell) return;
      const ref = `${colLetter(cIdx)}${rNum}`;
      const styleIdx = cell.s ? STYLE_INDEX[cell.s] : 0;
      const val = cell.v;
      if (val === null || val === undefined || val === '') {
        cellsXml.push(`<c r="${ref}" s="${styleIdx}"/>`);
        return;
      }
      const isNum = cell.t === 'n' || (cell.t === undefined && typeof val === 'number' && Number.isFinite(val));
      if (isNum) {
        cellsXml.push(`<c r="${ref}" s="${styleIdx}" t="n"><v>${Number(val)}</v></c>`);
      } else {
        cellsXml.push(
          `<c r="${ref}" s="${styleIdx}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(String(val))}</t></is></c>`,
        );
      }
    });

    rowsXml.push(`<row r="${rNum}" ht="${ht}" customHeight="1">${cellsXml.join('')}</row>`);
  });

  const freezeXml = spec.freezeRow
    ? `<sheetViews><sheetView tabSelected="1" workbookViewId="0"><pane ySplit="${spec.freezeRow}" topLeftCell="A${spec.freezeRow + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
    : `<sheetViews><sheetView tabSelected="1" workbookViewId="0"/></sheetViews>`;

  const mergesXml =
    spec.merges && spec.merges.length > 0
      ? `<mergeCells count="${spec.merges.length}">${spec.merges.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>`
      : '';

  const autoFilterXml = spec.autoFilterRef ? `<autoFilter ref="${spec.autoFilterRef}"/>` : '';

  const orientation = spec.landscape !== false ? 'landscape' : 'portrait';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  ${freezeXml}
  <sheetFormatPr defaultRowHeight="21"/>
  <cols>${colsXml}</cols>
  <sheetData>${rowsXml.join('')}</sheetData>
  ${autoFilterXml}
  ${mergesXml}
  <pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
  <pageSetup paperSize="9" orientation="${orientation}" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;
}

/** Empacota arquivos em um container ZIP (Store / Method 0) compatível com Excel (.xlsx) */
function createZipStore(files: { name: string; content: string }[]): Uint8Array {
  const enc = new TextEncoder();
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }
  const crc32 = (bytes: Uint8Array): number => {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  };

  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const dataBytes = enc.encode(f.content);
    const crc = crc32(dataBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true); // UTF-8 flag
    lv.setUint16(8, 0, true); // store
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0x5421, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, dataBytes.length, true);
    lv.setUint32(22, dataBytes.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x5421, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, dataBytes.length, true);
    cv.setUint32(24, dataBytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    localParts.push(localHeader, dataBytes);
    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralSize = centralParts.reduce((a, b) => a + b.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const totalLen = offset + centralSize + eocd.length;
  const out = new Uint8Array(totalLen);
  let pos = 0;
  for (const p of localParts) {
    out.set(p, pos);
    pos += p.length;
  }
  for (const p of centralParts) {
    out.set(p, pos);
    pos += p.length;
  }
  out.set(eocd, pos);
  return out;
}

export function baixarPlanilhaXlsx(nomeArquivo: string, spec: ExcelSheetSpec) {
  const safeSheetName = xmlEscape(spec.sheetName.slice(0, 31));
  const files = [
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${safeSheetName}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      name: 'xl/styles.xml',
      content: buildStylesXml(),
    },
    {
      name: 'xl/worksheets/sheet1.xml',
      content: buildSheetXml(spec),
    },
  ];

  const zipBytes = createZipStore(files);
  const blob = new Blob([zipBytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo.endsWith('.xlsx') ? nomeArquivo : `${nomeArquivo}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

function padRow(cells: (ExcelCell | null)[], totalCols: number, style?: CellStyleId): (ExcelCell | null)[] {
  const out = [...cells];
  while (out.length < totalCols) {
    out.push(style ? { v: '', s: style } : null);
  }
  return out;
}

function dataHoraAtualBr(): string {
  return new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatarDataIsoBr(iso?: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

/**
 * 1. Exportação da Lista de Compras e Reposição (.xlsx)
 */
export function exportarPlanilhaListaCompras(itens: any[], janelaDias = 30) {
  const totalCols = 13;
  const hojeIso = new Date().toISOString().slice(0, 10);
  const totalEmFalta = itens.filter((i) => Number(i.saldo_disponivel ?? 0) <= 0).length;
  const totalAlerta = itens.filter(
    (i) => Number(i.saldo_disponivel ?? 0) > 0 && Number(i.saldo_disponivel ?? 0) <= Number(i.quantidade_minima ?? 0),
  ).length;
  const totalSugestao = itens.reduce((acc, i) => acc + Number(i.sugestao_compra ?? 0), 0);

  const rows: (ExcelCell | null)[][] = [];

  // Linha 1: Título
  rows.push(
    padRow(
      [{ v: 'SISTEMA DE GESTÃO DE ESTOQUE DE TI — LISTA DE COMPRAS E REPOSIÇÃO', s: 'title' }],
      totalCols,
      'title',
    ),
  );

  // Linha 2: Subtítulo
  rows.push(
    padRow(
      [
        {
          v: `Emitido em: ${dataHoraAtualBr()}   |   Janela de Consumo Analisada: últimos ${janelaDias} dias   |   Itens para Reposição: ${itens.length}`,
          s: 'subtitle',
        },
      ],
      totalCols,
      'subtitle',
    ),
  );

  // Linha 3: Espaço + KPIs (Linhas 3 e 4)
  rows.push([
    { v: 'ITENS NA LISTA', s: 'kpiLabel' },
    { v: '', s: 'kpiLabel' },
    { v: 'EM FALTA (ZERADOS)', s: 'kpiLabel' },
    { v: '', s: 'kpiLabel' },
    { v: 'ESTOQUE BAIXO (ALERTA)', s: 'kpiLabel' },
    { v: '', s: 'kpiLabel' },
    { v: 'UNIDADES SUGERIDAS P/ COMPRA', s: 'kpiLabel' },
    { v: '', s: 'kpiLabel' },
    null,
    null,
    null,
    null,
    null,
  ]);

  rows.push([
    { v: itens.length, t: 'n', s: 'kpiValueInt' },
    { v: '', s: 'kpiValueInt' },
    { v: totalEmFalta, t: 'n', s: 'kpiValueInt' },
    { v: '', s: 'kpiValueInt' },
    { v: totalAlerta, t: 'n', s: 'kpiValueInt' },
    { v: '', s: 'kpiValueInt' },
    { v: totalSugestao, t: 'n', s: 'kpiValueInt' },
    { v: '', s: 'kpiValueInt' },
    null,
    null,
    null,
    null,
    null,
  ]);

  // Linha 5: Linha em branco separadora
  rows.push([]);

  // Linha 6: Cabeçalho da Tabela
  rows.push([
    { v: 'Cód.', s: 'headerCenter' },
    { v: 'Item / Descrição', s: 'header' },
    { v: 'Categoria', s: 'header' },
    { v: 'Unid.', s: 'headerCenter' },
    { v: 'Saldo Físico', s: 'headerRight' },
    { v: 'Saldo Disponível', s: 'headerRight' },
    { v: 'Estoque Mínimo', s: 'headerRight' },
    { v: 'Lead Time (dias)', s: 'headerCenter' },
    { v: 'Consumo Médio/Dia', s: 'headerRight' },
    { v: 'Ponto de Pedido', s: 'headerRight' },
    { v: 'Cobertura Est.', s: 'headerCenter' },
    { v: 'Sugestão de Compra', s: 'headerRight' },
    { v: 'Prioridade / Status', s: 'headerCenter' },
  ]);

  const merges: string[] = ['A1:M1', 'A2:M2', 'A3:B3', 'C3:D3', 'E3:F3', 'G3:H3', 'A4:B4', 'C4:D4', 'E4:F4', 'G4:H4'];

  if (itens.length === 0) {
    rows.push(
      padRow(
        [{ v: 'Nenhum item crítico ou abaixo do ponto de pedido no momento.', s: 'emptyRow' }],
        totalCols,
        'emptyRow',
      ),
    );
    merges.push('A7:M7');
  } else {
    let somaFisico = 0;
    let somaDisponivel = 0;
    let somaMinimo = 0;
    let somaPontoPedido = 0;
    let somaSugestao = 0;

    itens.forEach((item, idx) => {
      const alt = idx % 2 === 1;
      const fisico = Number(item.saldo_fisico ?? item.saldo_disponivel ?? 0);
      const disponivel = Number(item.saldo_disponivel ?? 0);
      const minimo = Number(item.quantidade_minima ?? 0);
      const lead = Number(item.lead_time_dias ?? 0);
      const diario = Number(item.consumo_medio_diario ?? 0);
      const ponto = Number(item.ponto_pedido ?? 0);
      const sugestao = Number(item.sugestao_compra ?? 0);

      somaFisico += fisico;
      somaDisponivel += disponivel;
      somaMinimo += minimo;
      somaPontoPedido += ponto;
      somaSugestao += sugestao;

      let statusLabel = 'PONTO DE PEDIDO';
      let statusStyle: CellStyleId = 'statusPedido';
      if (disponivel <= 0 || item.status_reposicao === 'critico') {
        statusLabel = disponivel <= 0 ? 'CRÍTICO (SEM ESTOQUE)' : 'CRÍTICO (ABAIXO MÍN.)';
        statusStyle = 'statusCritico';
      } else if (disponivel <= minimo || item.status_reposicao === 'alerta') {
        statusLabel = 'ALERTA (ESTOQUE BAIXO)';
        statusStyle = 'statusAlerta';
      }

      const coberturaTexto =
        item.dias_cobertura !== null && item.dias_cobertura !== undefined
          ? `${item.dias_cobertura} dia(s)`
          : diario > 0
            ? `${Math.floor(disponivel / diario)} dia(s)`
            : 'Sem consumo rec.';

      const codNum = Number(item.item_id);
      const codCell: ExcelCell = Number.isFinite(codNum) && String(item.item_id).trim() !== ''
        ? { v: codNum, t: 'n', s: alt ? 'textCenterAlt' : 'textCenter' }
        : { v: String(item.item_id || idx + 1), s: alt ? 'textCenterAlt' : 'textCenter' };

      rows.push([
        codCell,
        { v: item.nome ?? '', s: alt ? 'textBoldAlt' : 'textBold' },
        { v: item.categoria ?? 'Sem categoria', s: alt ? 'textAlt' : 'text' },
        { v: (item.unidade_medida ?? 'un').toUpperCase(), s: alt ? 'textCenterAlt' : 'textCenter' },
        { v: fisico, t: 'n', s: alt ? 'intAlt' : 'int' },
        {
          v: disponivel,
          t: 'n',
          s: disponivel <= 0 ? (alt ? 'intRedAlt' : 'intRed') : alt ? 'intBoldAlt' : 'intBold',
        },
        { v: minimo, t: 'n', s: alt ? 'intAlt' : 'int' },
        { v: lead, t: 'n', s: alt ? 'textCenterAlt' : 'textCenter' },
        { v: diario, t: 'n', s: alt ? 'decimalAlt' : 'decimal' },
        { v: ponto, t: 'n', s: alt ? 'intAlt' : 'int' },
        { v: coberturaTexto, s: alt ? 'textCenterAlt' : 'textCenter' },
        { v: sugestao, t: 'n', s: alt ? 'intHighlightAlt' : 'intHighlight' },
        { v: statusLabel, s: statusStyle },
      ]);
    });

    // Linha de Totais
    const totalRowIdx = rows.length + 1;
    rows.push([
      { v: 'TOTAL GERAL', s: 'totalLabel' },
      { v: `${itens.length} item(ns)`, s: 'totalLabel' },
      { v: '', s: 'totalLabel' },
      { v: '', s: 'totalLabel' },
      { v: somaFisico, t: 'n', s: 'totalInt' },
      { v: somaDisponivel, t: 'n', s: 'totalInt' },
      { v: somaMinimo, t: 'n', s: 'totalInt' },
      { v: '', s: 'totalLabel' },
      { v: '', s: 'totalLabel' },
      { v: somaPontoPedido, t: 'n', s: 'totalInt' },
      { v: '', s: 'totalLabel' },
      { v: somaSugestao, t: 'n', s: 'totalInt' },
      { v: '', s: 'totalLabel' },
    ]);
    merges.push(`B${totalRowIdx}:D${totalRowIdx}`);
  }

  const lastDataRow = Math.max(7, 6 + itens.length);

  baixarPlanilhaXlsx(`lista_compras_estoque_ti_${hojeIso}.xlsx`, {
    sheetName: 'Lista de Compras',
    colWidths: [9, 38, 25, 10, 15, 17, 16, 16, 19, 16, 17, 20, 25],
    rows,
    merges,
    freezeRow: 6,
    autoFilterRef: `A6:M${lastDataRow}`,
    landscape: true,
  });
}

/**
 * 2. Exportação do Fechamento Mensal de Estoque (.xlsx)
 */
export function exportarPlanilhaFechamentoMensal(payload: {
  mes: string;
  periodo?: { inicio: string; fim: string };
  totais?: {
    saldo_inicial: number;
    entradas: number;
    consumo: number;
    baixas_dano: number;
    ajustes: number;
    saldo_final: number;
    valor_entradas: number;
    notas_fiscais: number;
  };
  itens: any[];
}) {
  const totalCols = 11;
  const { mes, periodo, itens } = payload;
  const [anoStr, mesStr] = (mes || '').split('-');
  const competenciaBr = mesStr && anoStr ? `${mesStr}/${anoStr}` : mes;
  const periodoBr =
    periodo?.inicio && periodo?.fim
      ? `${formatarDataIsoBr(periodo.inicio)} a ${formatarDataIsoBr(periodo.fim)}`
      : competenciaBr;

  const somaInicial = itens.reduce((acc, i) => acc + Number(i.saldo_inicial ?? 0), 0);
  const somaEntradas = itens.reduce((acc, i) => acc + Number(i.entradas ?? 0), 0);
  const somaConsumo = itens.reduce((acc, i) => acc + Number(i.consumo ?? 0), 0);
  const somaDano = itens.reduce((acc, i) => acc + Number(i.baixas_dano ?? 0), 0);
  const somaAjustes = itens.reduce((acc, i) => acc + Number(i.ajustes ?? 0), 0);
  const somaFinal = itens.reduce((acc, i) => acc + Number(i.saldo_final ?? 0), 0);
  const somaValorEntradas = itens.reduce((acc, i) => acc + Number(i.valor_entradas ?? 0), 0);
  const qtdNfs = payload.totais?.notas_fiscais ?? 0;

  const rows: (ExcelCell | null)[][] = [];

  // Linha 1: Título
  rows.push(
    padRow(
      [{ v: `SISTEMA DE GESTÃO DE ESTOQUE DE TI — FECHAMENTO MENSAL (${competenciaBr})`, s: 'title' }],
      totalCols,
      'title',
    ),
  );

  // Linha 2: Subtítulo
  rows.push(
    padRow(
      [
        {
          v: `Período: ${periodoBr}   |   Notas Fiscais Lançadas no Mês: ${qtdNfs}   |   Emitido em: ${dataHoraAtualBr()}`,
          s: 'subtitle',
        },
      ],
      totalCols,
      'subtitle',
    ),
  );

  // Linhas 3 e 4: Resumo executivo (KPIs)
  rows.push([
    { v: 'SALDO INICIAL', s: 'kpiLabel' },
    { v: '', s: 'kpiLabel' },
    { v: 'ENTRADAS (+)', s: 'kpiLabel' },
    { v: 'SAÍDAS CONSUMO (-)', s: 'kpiLabel' },
    { v: 'BAIXAS DANO (-)', s: 'kpiLabel' },
    { v: 'AJUSTES / ESTORNOS', s: 'kpiLabel' },
    { v: 'SALDO FINAL', s: 'kpiLabel' },
    { v: '', s: 'kpiLabel' },
    { v: 'VALOR ENTRADAS (NF)', s: 'kpiLabel' },
    { v: '', s: 'kpiLabel' },
    { v: 'NOTAS FISCAIS', s: 'kpiLabel' },
  ]);

  rows.push([
    { v: somaInicial, t: 'n', s: 'kpiValueInt' },
    { v: '', s: 'kpiValueInt' },
    { v: somaEntradas, t: 'n', s: 'kpiValueInt' },
    { v: somaConsumo, t: 'n', s: 'kpiValueInt' },
    { v: somaDano, t: 'n', s: 'kpiValueInt' },
    { v: somaAjustes, t: 'n', s: 'kpiValueInt' },
    { v: somaFinal, t: 'n', s: 'kpiValueInt' },
    { v: '', s: 'kpiValueInt' },
    { v: somaValorEntradas, t: 'n', s: 'kpiValueCurrency' },
    { v: '', s: 'kpiValueCurrency' },
    { v: qtdNfs, t: 'n', s: 'kpiValueInt' },
  ]);

  // Linha 5: Separador
  rows.push([]);

  // Linha 6: Cabeçalho da Tabela
  rows.push([
    { v: 'Cód.', s: 'headerCenter' },
    { v: 'Item / Descrição', s: 'header' },
    { v: 'Categoria', s: 'header' },
    { v: 'Unid.', s: 'headerCenter' },
    { v: 'Saldo Inicial', s: 'headerRight' },
    { v: 'Entradas (+)', s: 'headerRight' },
    { v: 'Saídas Consumo (-)', s: 'headerRight' },
    { v: 'Baixas p/ Dano (-)', s: 'headerRight' },
    { v: 'Ajustes / Estornos (±)', s: 'headerRight' },
    { v: 'Saldo Final', s: 'headerRight' },
    { v: 'Valor Entradas (R$)', s: 'headerRight' },
  ]);

  const merges: string[] = ['A1:K1', 'A2:K2', 'A3:B3', 'G3:H3', 'I3:J3', 'A4:B4', 'G4:H4', 'I4:J4'];

  if (itens.length === 0) {
    rows.push(
      padRow(
        [{ v: `Nenhum item ou movimentação registrada na competência ${competenciaBr}.`, s: 'emptyRow' }],
        totalCols,
        'emptyRow',
      ),
    );
    merges.push('A7:K7');
  } else {
    itens.forEach((item, idx) => {
      const alt = idx % 2 === 1;
      const inicial = Number(item.saldo_inicial ?? 0);
      const entradas = Number(item.entradas ?? 0);
      const consumo = Number(item.consumo ?? 0);
      const dano = Number(item.baixas_dano ?? 0);
      const ajustes = Number(item.ajustes ?? 0);
      const final = Number(item.saldo_final ?? 0);
      const valor = Number(item.valor_entradas ?? 0);

      const codNum = Number(item.item_id);
      const codCell: ExcelCell = Number.isFinite(codNum) && String(item.item_id).trim() !== ''
        ? { v: codNum, t: 'n', s: alt ? 'textCenterAlt' : 'textCenter' }
        : { v: String(item.item_id || idx + 1), s: alt ? 'textCenterAlt' : 'textCenter' };

      rows.push([
        codCell,
        { v: item.nome ?? '', s: alt ? 'textBoldAlt' : 'textBold' },
        { v: item.categoria ?? 'Sem categoria', s: alt ? 'textAlt' : 'text' },
        { v: (item.unidade_medida ?? 'un').toUpperCase(), s: alt ? 'textCenterAlt' : 'textCenter' },
        { v: inicial, t: 'n', s: alt ? 'intAlt' : 'int' },
        {
          v: entradas,
          t: 'n',
          s: entradas > 0 ? (alt ? 'intGreenAlt' : 'intGreen') : alt ? 'intAlt' : 'int',
        },
        { v: consumo, t: 'n', s: alt ? 'intAlt' : 'int' },
        {
          v: dano,
          t: 'n',
          s: dano > 0 ? (alt ? 'intRedAlt' : 'intRed') : alt ? 'intAlt' : 'int',
        },
        {
          v: ajustes,
          t: 'n',
          s:
            ajustes < 0
              ? alt
                ? 'intRedAlt'
                : 'intRed'
              : ajustes > 0
                ? alt
                  ? 'intGreenAlt'
                  : 'intGreen'
                : alt
                  ? 'intAlt'
                  : 'int',
        },
        { v: final, t: 'n', s: alt ? 'intHighlightAlt' : 'intHighlight' },
        { v: valor, t: 'n', s: alt ? 'currencyAlt' : 'currency' },
      ]);
    });

    // Linha de Totais
    const totalRowIdx = rows.length + 1;
    rows.push([
      { v: 'TOTAL DO MÊS', s: 'totalLabel' },
      { v: `${itens.length} item(ns)`, s: 'totalLabel' },
      { v: '', s: 'totalLabel' },
      { v: '', s: 'totalLabel' },
      { v: somaInicial, t: 'n', s: 'totalInt' },
      { v: somaEntradas, t: 'n', s: 'totalInt' },
      { v: somaConsumo, t: 'n', s: 'totalInt' },
      { v: somaDano, t: 'n', s: 'totalInt' },
      { v: somaAjustes, t: 'n', s: 'totalInt' },
      { v: somaFinal, t: 'n', s: 'totalInt' },
      { v: somaValorEntradas, t: 'n', s: 'totalCurrency' },
    ]);
    merges.push(`B${totalRowIdx}:D${totalRowIdx}`);
  }

  const lastDataRow = Math.max(7, 6 + itens.length);

  baixarPlanilhaXlsx(`fechamento_mensal_estoque_ti_${mes}.xlsx`, {
    sheetName: `Fechamento ${mes}`,
    colWidths: [9, 38, 25, 10, 16, 16, 19, 19, 21, 16, 22],
    rows,
    merges,
    freezeRow: 6,
    autoFilterRef: `A6:K${lastDataRow}`,
    landscape: true,
  });
}
