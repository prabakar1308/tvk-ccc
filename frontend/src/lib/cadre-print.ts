import { formatDesignation } from '@/components/cadre-card';
import { translatePersonNameToTamil, isSecretaryRole } from '@/lib/name-translations';

export interface PrintCadreRosterOptions {
  cadres: any[];
  locale?: string;
  level?: 'DISTRICT' | 'UNION' | 'KILAI' | 'ALL' | 'WINGS';
  title?: string;
  docTitle?: string;
  districtName?: string;
  unionName?: string;
  unitName?: string;
  unitType?: string;
  divisionName?: string;
  panchayatName?: string;
  kilaiName?: string;
  boothDetails?: string;
  maskAadhaar?: boolean;
}

/**
 * Format 12-digit Aadhaar into `XXXX XXXX 1234` or `1234 5678 9012`
 */
export function formatAadhaar(raw?: string, masked: boolean = false): string {
  if (!raw) return '-';
  const clean = String(raw).replace(/\D/g, '');
  if (clean.length !== 12) return raw;

  if (masked) {
    return `•••• •••• ${clean.slice(8)}`;
  }
  return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8)}`;
}

/**
 * Format phone number into clean readable format
 */
export function formatPhone(raw?: string): string {
  if (!raw) return '-';
  const clean = String(raw).replace(/\D/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return raw;
}

/**
 * Trigger official TVK branded PDF print preview in browser via hidden iframe
 */
export function printCadreRosterPdf(options: PrintCadreRosterOptions) {
  const {
    cadres = [],
    locale = 'en',
    level = 'ALL',
    title,
    docTitle,
    districtName = '',
    unionName = '',
    unitName = '',
    unitType = '',
    divisionName = '',
    panchayatName = '',
    kilaiName = '',
    boothDetails = '',
    maskAadhaar = false,
  } = options;

  if (typeof window === 'undefined') return;

  const isTamil = locale === 'ta';
  const isDistrict = level === 'DISTRICT';
  const isKilai = !!kilaiName || level === 'KILAI';
  const isUnion = !isDistrict && !isKilai;

  const now = new Date();
  const formattedDate = now.toLocaleDateString(isTamil ? 'ta-IN' : 'en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString(isTamil ? 'ta-IN' : 'en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Effective district name
  const effectiveDistrict = districtName || (isTamil ? 'கடலூர் கிழக்கு' : 'Cuddalore East');
  const districtLabel = isTamil ? `${effectiveDistrict} மாவட்டம்` : `${effectiveDistrict} District`;

  // Resolved Document Title
  let fullDocTitle = '';
  if (docTitle) {
    fullDocTitle = docTitle;
  } else if (isDistrict) {
    fullDocTitle = isTamil
      ? `மாவட்ட தலைமை மற்றும் நிர்வாகிகள் - ${districtLabel}`
      : `District Leadership & Cadres - ${districtLabel}`;
  } else {
    const baseTitle = isTamil ? 'நிர்வாகிகள் பட்டியல்' : 'Administrators Roster';
    const districtSuffix = districtLabel ? ` - ${districtLabel}` : '';
    fullDocTitle = `${baseTitle}${districtSuffix}`;
  }

  // Resolved Org Unit & Union Name
  const effectiveUnionName = unionName || unitName || (isTamil ? 'ஒன்றியம்' : 'Union');
  const formattedOrgUnit = unitType ? `${effectiveUnionName} [ ${unitType} ]` : effectiveUnionName;

  const partyNameTa = 'தமிழக வெற்றிக் கழகம்';
  const partyNameEn = 'TAMIZHAGA VETRI KAZHAGAM';

  // Subtitle in Header Box
  let subtitleText = '';
  if (isDistrict) {
    subtitleText = isTamil
      ? `${districtLabel} • குறிஞ்சிப்பாடி சட்டமன்ற தொகுதி • ${formattedDate}`
      : `${districtLabel} • Kurinjipadi Assembly Constituency • ${formattedDate}`;
  } else {
    subtitleText = `${divisionName || districtLabel} ${kilaiName ? `• ${kilaiName}` : ''} • ${formattedDate}`;
  }

  // Ensure Secretary appears first if available in District level
  let listToPrint = [...cadres];
  if (isDistrict) {
    const secretary = listToPrint.find(c => isSecretaryRole(c.rawRole || c.canonicalRole || c.role));
    if (secretary) {
      listToPrint = [secretary, ...listToPrint.filter(c => c.id !== secretary.id)];
    }
  }

  // Build Metadata Grid HTML based on Level
  let metadataHtml = '';
  if (isDistrict) {
    metadataHtml = `
      <div class="meta-item">
        <strong>${isTamil ? 'அமைப்பு அடுக்கு:' : 'Organizational Level:'}</strong>
        <span>${isTamil ? 'மாவட்ட தலைமை ' : 'District Leadership'}</span>
      </div>
      <div class="meta-item">
        <strong>${isTamil ? 'மாவட்டம்:' : 'District:'}</strong>
        <span>${districtLabel}</span>
      </div>
      <div class="meta-item">
        <strong>${isTamil ? 'மொத்த நிர்வாகிகள்:' : 'Total Administrators:'}</strong>
        <span>${listToPrint.length}</span>
      </div>
    `;
  } else {
    // Union or Kilai
    metadataHtml = `
      <div class="meta-item">
        <strong>${isTamil ? 'அமைப்பு அலகு:' : 'Org Unit:'}</strong>
        <span>${formattedOrgUnit}</span>
      </div>
      <div class="meta-item">
        <strong>${isTamil ? 'ஊராட்சி:' : 'Panchayat:'}</strong>
        <span>${panchayatName || '-'}</span>
      </div>
      ${isKilai ? `
      <div class="meta-item">
        <strong>${isTamil ? 'கிளை:' : 'Kilai:'}</strong>
        <span>${kilaiName}</span>
      </div>
      <div class="meta-item col-span-2">
        <strong>${isTamil ? 'சாவடி விவரம்:' : 'Booth Details:'}</strong>
        <span>${boothDetails || '-'}</span>
      </div>
      <div class="meta-item">
        <strong>${isTamil ? 'மொத்த நிர்வாகிகள்:' : 'Total Administrators:'}</strong>
        <span>${listToPrint.length}</span>
      </div>
      ` : `
      <div class="meta-item">
        <strong>${isTamil ? 'மொத்த நிர்வாகிகள்:' : 'Total Administrators:'}</strong>
        <span>${listToPrint.length}</span>
      </div>
      `}
    `;
  }

  // Table rows HTML
  const tableRowsHtml = listToPrint.map((c, idx) => {
    const primaryName = isTamil ? (c.nameTa || translatePersonNameToTamil(c.name)) : c.name;
    const secondaryName = isTamil ? c.name : (c.nameTa || translatePersonNameToTamil(c.name));
    const rawRole = c.officeBearerRoles?.[0]?.role || c.role || 'Member';
    const role = formatDesignation(rawRole, locale);
    const phone = formatPhone(c.phone);
    const aadhaar = formatAadhaar(c.aadhaarNumber, maskAadhaar);
    const voterId = c.voterId ? String(c.voterId).toUpperCase() : '';
    const memberId = c.memberId ? String(c.memberId) : '';

    return `
      <tr>
        <td style="text-align: center; font-weight: bold; width: 34px;">${idx + 1}</td>
        <td>
          <div style="font-weight: 700; font-size: 12.5px; color: #111827;">${primaryName}</div>
          ${secondaryName && secondaryName !== primaryName ? `<div style="font-size: 10.5px; color: #6B7280; margin-top: 1px;">${secondaryName}</div>` : ''}
        </td>
        <td>
          <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 700; background: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5;">
            ${role}
          </span>
        </td>
        ${isUnion ? `
        <td style="font-family: monospace; font-size: 11.5px; font-weight: 700; color: #1F2937;">
          ${c.boothNo ? `#${c.boothNo}` : '-'}
        </td>
        ` : ''}
        <td style="font-family: monospace; font-size: 11.5px; font-weight: 600; color: #1F2937;">${phone}</td>
        <td style="font-family: monospace; font-size: 11.5px; font-weight: 600; color: #1F2937;">${aadhaar}</td>
        <td>
          ${(voterId || memberId) ? `<div style="font-family: monospace; font-size: 11.5px; font-weight: 700; color: #1F2937;">${voterId || memberId}</div>` : ''}
          ${!voterId && !memberId ? '-' : ''}
        </td>
      </tr>
    `;
  }).join('');

  // Signatures block
  let signatureLeft = isTamil ? 'செயலாளர் கையொப்பம்' : 'Secretary Signature';
  let signatureRight = isTamil ? 'தலைவர் கையொப்பம்' : 'Chief Secretary Signature';
  if (isDistrict) {
    signatureLeft = isTamil ? 'மாவட்டச் செயலாளர் கையொப்பம்' : 'District Secretary Signature';
    signatureRight = isTamil ? 'கழகத் தலைமை / தலைவர் கையொப்பம்' : 'State / HQ Leader Signature';
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${fullDocTitle}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 8mm 8mm 12mm 8mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Mukta Malar', 'Noto Sans Tamil', sans-serif;
          color: #111827;
          background: #fff;
          margin: 0;
          padding: 10px;
          font-size: 11.5px;
          line-height: 1.35;
        }
        .header-stripe {
          height: 6px;
          background: linear-gradient(90deg, #8F0A1B 0%, #D97706 50%, #FFC72C 100%);
          border-radius: 4px;
          margin-bottom: 10px;
        }
        .header-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #8F0A1B;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .party-title-ta {
          font-size: 18px;
          font-weight: 900;
          color: #8F0A1B;
          letter-spacing: 0.5px;
        }
        .party-title-en {
          font-size: 10.5px;
          font-weight: 800;
          color: #4B5563;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-top: 1px;
        }
        .doc-badge {
          text-align: right;
        }
        .doc-badge h2 {
          margin: 0;
          font-size: 14.5px;
          font-weight: 900;
          color: #1F2937;
        }
        .doc-badge p {
          margin: 2px 0 0 0;
          font-size: 9.5px;
          color: #6B7280;
          font-weight: 600;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px 14px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 6px;
          padding: 10px 14px;
          margin-bottom: 12px;
          font-size: 11px;
          align-items: start;
        }
        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .meta-item strong {
          color: #6B7280;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .meta-item span {
          color: #111827;
          font-weight: 700;
          font-size: 11.5px;
          word-break: break-word;
          line-height: 1.35;
        }
        .meta-item.col-span-2 {
          grid-column: span 2;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 4px;
        }
        th {
          background-color: #8F0A1B !important;
          color: #ffffff !important;
          font-weight: 700;
          font-size: 10.5px;
          text-align: left;
          padding: 6px 8px;
          border: 1px solid #750816;
          text-transform: uppercase;
          letter-spacing: 0.2px;
        }
        td {
          padding: 6px 8px;
          border: 1px solid #E5E7EB;
          vertical-align: middle;
          font-size: 11px;
        }
        tr:nth-child(even) td {
          background-color: #F9FAFB !important;
        }
        .sign-section {
          margin-top: 32px;
          display: flex;
          justify-content: space-between;
          padding: 0 30px;
          page-break-inside: avoid;
        }
        .sign-box {
          text-align: center;
          border-top: 1px dashed #6B7280;
          width: 180px;
          padding-top: 6px;
          font-size: 10.5px;
          font-weight: 700;
          color: #374151;
        }
        .footer-note {
          margin-top: 20px;
          text-align: center;
          font-size: 9px;
          color: #9CA3AF;
          border-top: 1px solid #E5E7EB;
          padding-top: 6px;
        }
      </style>
    </head>
    <body>
      <div class="header-stripe"></div>
      <div class="header-box">
        <div>
          <div class="party-title-ta">${partyNameTa}</div>
          <div class="party-title-en">${partyNameEn}</div>
        </div>
        <div class="doc-badge">
          <h2>${fullDocTitle}</h2>
          <p>${subtitleText}</p>
        </div>
      </div>

      <div class="meta-grid">
        ${metadataHtml}
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 34px; text-align: center;">#</th>
            <th>${isTamil ? 'பெயர்' : 'Name'}</th>
            <th>${isTamil ? 'பொறுப்பு' : 'Role'}</th>
            ${isUnion ? `<th>${isTamil ? 'சாவடி எண்' : 'Booth No'}</th>` : ''}
            <th>${isTamil ? 'கைபேசி எண்' : 'Phone No'}</th>
            <th>${isTamil ? 'ஆதார் எண்' : 'Aadhaar No'}</th>
            <th>${isTamil ? 'வாக்காளர் எண்' : 'Voter ID'}</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <div class="sign-section">
        <div class="sign-box">
          ${signatureLeft}
        </div>
        <div class="sign-box">
          ${signatureRight}
        </div>
      </div>

      <div class="footer-note">
        ${isTamil ? 'தமிழக வெற்றிக் கழகம் தலைமை கட்டளை மையம் மூலம் அச்சிடப்பட்டது' : 'Generated by TVK Command Centre Official Platform'} • ${formattedDate} ${formattedTime}
      </div>
    </body>
    </html>
  `;

  // Trigger print via dynamic iframe
  let printFrame = document.getElementById('tvk-print-iframe') as HTMLIFrameElement | null;
  if (!printFrame) {
    printFrame = document.createElement('iframe');
    printFrame.id = 'tvk-print-iframe';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);
  }

  const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
  if (frameDoc) {
    frameDoc.open();
    frameDoc.write(htmlContent);
    frameDoc.close();

    setTimeout(() => {
      printFrame?.contentWindow?.focus();
      printFrame?.contentWindow?.print();
    }, 350);
  } else {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(htmlContent);
      win.document.close();
      setTimeout(() => {
        win.focus();
        win.print();
      }, 350);
    }
  }
}

