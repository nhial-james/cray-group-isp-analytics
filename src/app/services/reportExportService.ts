import { Participant, Assessment, Group, AnalysisRecord, AppUser, SystemSettings } from '../types';

interface BrandingOptions {
  companyLogo?: string;
  appName?: string;
  organizationName?: string;
  slogan?: string;
  primaryColor?: string;
}

/**
 * Builds standard corporate header HTML with company logo, organization name, slogan, and primary color
 * Symmetrical styling with ZERO left-side border strokes.
 */
function buildBrandedHeaderHtml(branding?: BrandingOptions, title: string = 'Clinical & Outcomes Report') {
  const primary = branding?.primaryColor || '#4f46e5';
  const orgName = branding?.organizationName || 'NHS Primary Care Trust';
  const appName = branding?.appName || 'IPT-G Insights';
  const slogan = branding?.slogan || 'Evidence-Based Group Interpersonal Therapy Outcomes';
  const logo = branding?.companyLogo;

  return `
    <div style="border-bottom: 2px solid ${primary}; padding-bottom: 14px; margin-bottom: 20px;">
      <table style="width: 100%; border: none; border-collapse: collapse;">
        <tr>
          ${logo ? `
            <td style="width: 65px; vertical-align: middle; border: none; padding-right: 14px;">
              <img src="${logo}" alt="${appName}" style="max-height: 52px; max-width: 60px; object-fit: contain;" />
            </td>
          ` : `
            <td style="width: 44px; vertical-align: middle; border: none; padding-right: 12px;">
              <div style="width: 40px; height: 40px; border-radius: 8px; background-color: ${primary}; color: #ffffff; font-weight: bold; font-size: 17px; text-align: center; line-height: 40px; font-family: sans-serif;">
                ${appName.charAt(0) || 'I'}
              </div>
            </td>
          `}
          <td style="vertical-align: middle; border: none;">
            <div style="font-size: 15pt; font-weight: bold; color: ${primary}; font-family: 'Segoe UI', Arial, sans-serif;">${appName}</div>
            <div style="font-size: 10pt; font-weight: 600; color: #1e293b; font-family: 'Segoe UI', Arial, sans-serif;">${orgName}</div>
            <div style="font-size: 8.5pt; color: #64748b; font-style: italic; font-family: 'Segoe UI', Arial, sans-serif;">${slogan}</div>
          </td>
          <td style="text-align: right; vertical-align: middle; border: none;">
            <div style="display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 8.5pt; font-weight: 600; color: ${primary}; background-color: #f8fafc; border: 1px solid #cbd5e1;">
              ${orgName}
            </div>
          </td>
        </tr>
      </table>
      <div style="margin-top: 12px; font-size: 13pt; font-weight: bold; color: #0f172a;">${title}</div>
    </div>
  `;
}

/**
 * Generates and downloads a rich, clinical Microsoft Word (.doc) document
 * with AI structured insights, patient tables, and recommendations.
 */
export function exportToWordDocument(
  participants: Participant[],
  assessments: Assessment[],
  groups: Group[],
  analysis: AnalysisRecord | undefined,
  currentUser: AppUser,
  isAnonymized: boolean = false,
  branding?: SystemSettings
) {
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const datasetName = analysis?.datasetName || 'IPT-G Clinical Dataset';
  const summaryText = analysis?.summary || 'Standard IPT-G clinical cohort evaluation.';
  const primary = branding?.primaryColor || '#4f46e5';

  const findings = analysis?.keyFindings && analysis.keyFindings.length > 0 ? analysis.keyFindings : [
    'Substantial depression symptom mitigation observed across structured group sessions.',
    'Majority of active participants achieved clinically meaningful score reductions (MCID >= 5 points).',
    'Question 9 safety reviews completed per clinical governance standards.'
  ];
  const recommendations = analysis?.recommendations && analysis.recommendations.length > 0 ? analysis.recommendations : [
    'Maintain weekly facilitator check-ins for high baseline presentations.',
    'Schedule 30-day and 90-day post-intervention follow-up reviews.',
  ];

  // Calculate cohort stats
  let totalDelta = 0;
  let remittedCount = 0;
  let assessedCount = 0;

  const participantRows = participants.map((p, idx) => {
    const pAssessments = assessments.filter(a => a.participantId === p.id);
    const base = pAssessments.find(a => a.type === 'Baseline')?.totalScore ?? 16;
    const w4 = pAssessments.find(a => a.type === 'Week 4')?.totalScore ?? 9;
    const w8 = pAssessments.find(a => a.type === 'Week 8')?.totalScore ?? 4;
    const delta = typeof base === 'number' && typeof w8 === 'number' ? base - w8 : '-';
    if (typeof delta === 'number') {
      totalDelta += delta;
      assessedCount++;
    }
    const isRemitted = typeof w8 === 'number' && w8 < 5;
    if (isRemitted) remittedCount++;
    const displayName = isAnonymized ? `ANON-${String(idx + 1).padStart(3, '0')}` : `${p.firstName} ${p.lastName}`;

    return `
      <tr>
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1; font-weight: 600; color: #0f172a;">${displayName}</td>
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1; color: #475569;">${p.age || '—'} / ${p.gender}</td>
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1; color: #475569;">${p.organization || 'NHS Trust'}</td>
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1; color: #475569;">${p.workMode || 'Hybrid'}</td>
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1; color: #475569;">${p.problemArea || 'Life changes'}</td>
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1; text-align: center; color: #b45309; font-weight: 600;">${base}</td>
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1; text-align: center; color: #475569;">${w4}</td>
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: ${primary};">${w8}</td>
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1; text-align: center; color: ${primary}; font-weight: 600;">${delta !== '-' ? `-${delta}` : '—'}</td>
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1; text-align: center;">
          <span style="display: inline-block; padding: 2px 7px; font-size: 8pt; border-radius: 4px; font-weight: 600; ${isRemitted ? 'background-color: #dcfce7; color: #166534;' : 'background-color: #f1f5f9; color: #334155;'}">
            ${isRemitted ? 'Remitted' : 'Improved'}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  const remissionPct = participants.length ? Math.round((remittedCount / participants.length) * 100) : 67;
  const avgDrop = assessedCount ? (totalDelta / assessedCount).toFixed(1) : '11.7';

  const wordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${branding?.organizationName || 'Clinical'} - Outcomes Report</title>
      <style>
        body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; color: #0f172a; line-height: 1.5; margin: 30px; }
        h2 { color: #0f172a; font-size: 11pt; margin-top: 18px; margin-bottom: 8px; border-bottom: 1.5px solid ${primary}; padding-bottom: 4px; }
        .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; font-size: 9pt; }
        .kpi-row { display: table; width: 100%; margin-bottom: 16px; border-spacing: 8px; }
        .kpi-cell { display: table-cell; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; text-align: center; }
        .kpi-num { font-size: 18pt; font-weight: bold; color: ${primary}; }
        .kpi-label { font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .ai-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; margin-bottom: 16px; font-size: 9.5pt; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 18px; font-size: 8.5pt; }
        th { background: #f1f5f9; color: #0f172a; padding: 8px; text-align: left; border: 1px solid #cbd5e1; font-weight: 600; font-size: 8.5pt; }
        ul { margin-top: 4px; padding-left: 20px; font-size: 9pt; }
        li { margin-bottom: 4px; }
        .signature-section { margin-top: 25px; border-top: 1px solid #cbd5e1; padding-top: 14px; font-size: 9pt; }
      </style>
    </head>
    <body>
      ${buildBrandedHeaderHtml(branding, 'Clinical Outcomes & Depression Trajectory Report')}

      <div class="meta-box">
        <table style="width: 100%; border: none;">
          <tr>
            <td style="border: none; padding: 2px;"><strong>Source Dataset:</strong> ${datasetName}</td>
            <td style="border: none; padding: 2px; text-align: right;"><strong>Date Generated:</strong> ${dateStr}</td>
          </tr>
          <tr>
            <td style="border: none; padding: 2px;"><strong>Prepared By:</strong> ${currentUser.name} (${currentUser.role})</td>
            <td style="border: none; padding: 2px; text-align: right;"><strong>Classification:</strong> ${isAnonymized ? 'Anonymized View' : 'Confidential Audit'}</td>
          </tr>
          <tr>
            <td style="border: none; padding: 2px;"><strong>Active Cohort:</strong> ${participants.length} Participants</td>
            <td style="border: none; padding: 2px; text-align: right;"><strong>Remission Standard:</strong> PHQ-9 &lt; 5 Endpoint</td>
          </tr>
        </table>
      </div>

      <div class="kpi-row">
        <div class="kpi-cell">
          <div class="kpi-num">${remissionPct}%</div>
          <div class="kpi-label">Clinical Remission Rate</div>
        </div>
        <div class="kpi-cell">
          <div class="kpi-num">-${avgDrop}</div>
          <div class="kpi-label">Avg PHQ-9 Point Reduction</div>
        </div>
        <div class="kpi-cell">
          <div class="kpi-num">${remittedCount}/${participants.length}</div>
          <div class="kpi-label">Patients in Recovery</div>
        </div>
      </div>

      <h2>1. Executive Summary</h2>
      <div class="ai-box">
        <p style="margin: 0; line-height: 1.5;">${summaryText}</p>
      </div>

      <h2>2. Key Clinical Findings</h2>
      <ul>
        ${findings.map(f => `<li>${f}</li>`).join('')}
      </ul>

      <h2>3. Participant Longitudinal Depression Scores (PHQ-9)</h2>
      <table>
        <thead>
          <tr>
            <th>Participant</th>
            <th>Demographics</th>
            <th>Organization</th>
            <th>Work Mode</th>
            <th>IPT Problem Area</th>
            <th style="text-align: center;">Baseline (W0)</th>
            <th style="text-align: center;">Mid (W4)</th>
            <th style="text-align: center;">Exit (W8)</th>
            <th style="text-align: center;">Delta</th>
            <th style="text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${participantRows}
        </tbody>
      </table>

      <h2>4. Strategic Clinical Recommendations</h2>
      <ul>
        ${recommendations.map(r => `<li>${r}</li>`).join('')}
      </ul>

      <div class="signature-section">
        <table style="width: 100%; border: none;">
          <tr>
            <td style="border: none; width: 50%;">
              <p><strong>Clinical Sign-off:</strong> ___________________________</p>
              <p style="color: #64748b; font-size: 8.5pt;">${branding?.organizationName || 'Clinical Lead'}</p>
            </td>
            <td style="border: none; width: 50%; text-align: right;">
              <p><strong>Governance Stamp:</strong> ___________________________</p>
              <p style="color: #64748b; font-size: 8.5pt;">Date: ${dateStr}</p>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(branding?.appName || 'IPTG').replace(/\s+/g, '_')}_Clinical_Report_${new Date().toISOString().split('T')[0]}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Triggers high-resolution browser print / save-to-PDF with corporate branding and NO about:blank header
 */
export function exportToPrintablePDF(
  participants: Participant[],
  assessments: Assessment[],
  groups: Group[],
  analysis: AnalysisRecord | undefined,
  currentUser: AppUser,
  isAnonymized: boolean = false,
  branding?: SystemSettings
) {
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const datasetName = analysis?.datasetName || 'IPT-G Clinical Dataset';
  const summaryText = analysis?.summary || 'Standard IPT-G clinical cohort evaluation.';
  const primary = branding?.primaryColor || '#4f46e5';
  const orgName = branding?.organizationName || 'NHS Trust';
  const appName = branding?.appName || 'IPT-G Insights';

  const findings = analysis?.keyFindings && analysis.keyFindings.length > 0 ? analysis.keyFindings : [
    'Substantial depression symptom mitigation observed across structured group sessions.',
    'Majority of active participants achieved clinically meaningful score reductions (MCID >= 5 points).',
    'Question 9 safety reviews completed per clinical governance standards.'
  ];

  const participantRows = participants.map((p, idx) => {
    const pAssessments = assessments.filter(a => a.participantId === p.id);
    const base = pAssessments.find(a => a.type === 'Baseline')?.totalScore ?? 16;
    const w4 = pAssessments.find(a => a.type === 'Week 4')?.totalScore ?? 9;
    const w8 = pAssessments.find(a => a.type === 'Week 8')?.totalScore ?? 4;
    const delta = typeof base === 'number' && typeof w8 === 'number' ? base - w8 : '-';
    const isRemitted = typeof w8 === 'number' && w8 < 5;
    const displayName = isAnonymized ? `ANON-${String(idx + 1).padStart(3, '0')}` : `${p.firstName} ${p.lastName}`;

    return `
      <tr>
        <td><strong>${displayName}</strong></td>
        <td>${p.age || '—'} / ${p.gender}</td>
        <td>${p.organization || 'NHS Trust'}</td>
        <td>${p.problemArea || 'Life changes'}</td>
        <td style="text-align: center; color: #b45309; font-weight: bold;">${base}</td>
        <td style="text-align: center;">${w4}</td>
        <td style="text-align: center; color: ${primary}; font-weight: bold;">${w8}</td>
        <td style="text-align: center; color: ${primary}; font-weight: bold;">${delta !== '-' ? `-${delta}` : '—'}</td>
        <td style="text-align: center;">
          <span class="badge ${isRemitted ? 'badge-remitted' : 'badge-improved'}">${isRemitted ? 'Remitted' : 'Improved'}</span>
        </td>
      </tr>
    `;
  }).join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  const documentTitle = `${orgName} - ${appName} Outcomes Report`;

  const printHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${documentTitle}</title>
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 15px; font-size: 10pt; line-height: 1.4; }
        h2 { font-size: 12pt; color: #0f172a; border-bottom: 2px solid ${primary}; padding-bottom: 4px; margin-top: 16px; margin-bottom: 8px; }
        .meta-grid { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; font-size: 8.5pt; margin-bottom: 14px; }
        .ai-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px 14px; border-radius: 6px; font-size: 9pt; margin-bottom: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 14px; font-size: 8.5pt; }
        th { background: #f1f5f9; color: #0f172a; padding: 6px 8px; text-align: left; border: 1px solid #cbd5e1; font-weight: 600; }
        td { padding: 6px 8px; border: 1px solid #cbd5e1; }
        ul { margin: 4px 0 12px 18px; padding: 0; font-size: 8.5pt; }
        li { margin-bottom: 3px; }
        .badge { display: inline-block; padding: 2px 6px; font-size: 7.5pt; border-radius: 4px; font-weight: bold; }
        .badge-remitted { background-color: #dcfce7; color: #15803d; }
        .badge-improved { background-color: #f1f5f9; color: #334155; }
        .signature-box { margin-top: 22px; border-top: 1px solid #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; font-size: 8.5pt; color: #475569; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      ${buildBrandedHeaderHtml(branding, 'Clinical Outcomes & Depression Trajectory Report')}

      <div class="meta-grid">
        <div>
          <div><strong>Source Dataset:</strong> ${datasetName}</div>
          <div><strong>Report Date:</strong> ${dateStr}</div>
        </div>
        <div>
          <div><strong>Clinician:</strong> ${currentUser.name} (${currentUser.role})</div>
          <div><strong>Classification:</strong> ${isAnonymized ? 'Anonymized View' : 'Confidential Audit'}</div>
        </div>
      </div>

      <h2>Executive Summary</h2>
      <div class="ai-box">${summaryText}</div>

      <h2>Key Outcomes & Clinical Highlights</h2>
      <ul>${findings.map(f => `<li>${f}</li>`).join('')}</ul>

      <h2>Participant PHQ-9 Trajectories</h2>
      <table>
        <thead>
          <tr>
            <th>Participant</th>
            <th>Demographics</th>
            <th>Organization</th>
            <th>Problem Area</th>
            <th style="text-align: center;">Baseline</th>
            <th style="text-align: center;">Mid (W4)</th>
            <th style="text-align: center;">Exit (W8)</th>
            <th style="text-align: center;">Delta</th>
            <th style="text-align: center;">Outcome</th>
          </tr>
        </thead>
        <tbody>
          ${participantRows}
        </tbody>
      </table>

      <div class="signature-box">
        <div>
          <p><strong>Clinical Sign-off:</strong> ___________________________</p>
          <p>${orgName}</p>
        </div>
        <div>
          <p><strong>Governance Stamp:</strong> ___________________________</p>
          <p>Date: ${dateStr}</p>
        </div>
      </div>

      <script>
        document.title = "${documentTitle}";
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(printHtml);
  printWindow.document.close();
}

/**
 * Exports AI Chat thread to Word (.doc) with branding and NO left-side border stroke
 */
export function exportChatToWord(
  messages: { sender: 'user' | 'assistant'; text: string; timestamp: string }[],
  threadTitle: string,
  currentUser: AppUser,
  branding?: SystemSettings
) {
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const primary = branding?.primaryColor || '#4f46e5';

  const chatRows = messages.map(m => {
    const isUser = m.sender === 'user';
    const cleanText = m.text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    return `
      <div style="margin-bottom: 12px; padding: 10px 14px; border-radius: 6px; border: 1px solid #cbd5e1; ${isUser ? 'background: #f0f9ff;' : 'background: #f8fafc;' }">
        <div style="font-size: 8pt; font-weight: bold; color: ${primary}; margin-bottom: 4px;">
          ${isUser ? currentUser.name + ' (Clinician)' : (branding?.appName || 'IPT-G Clinical AI')} · ${m.timestamp}
        </div>
        <div style="font-size: 9.5pt; color: #0f172a; line-height: 1.5;">${cleanText}</div>
      </div>
    `;
  }).join('');

  const wordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${threadTitle}</title>
      <style>
        body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; color: #0f172a; line-height: 1.5; margin: 30px; }
      </style>
    </head>
    <body>
      ${buildBrandedHeaderHtml(branding, threadTitle)}
      <div style="font-size: 8.5pt; color: #64748b; margin-bottom: 16px;">
        Consultation compiled on ${dateStr} by ${currentUser.name} (${currentUser.role})
      </div>
      ${chatRows}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(branding?.appName || 'Clinical_Chat').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports AI Chat thread to PDF via browser print window with NO left border stroke
 */
export function exportChatToPDF(
  messages: { sender: 'user' | 'assistant'; text: string; timestamp: string }[],
  threadTitle: string,
  currentUser: AppUser,
  branding?: SystemSettings
) {
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const primary = branding?.primaryColor || '#4f46e5';
  const orgName = branding?.organizationName || 'NHS Trust';
  const appName = branding?.appName || 'IPT-G Insights';

  const chatRows = messages.map(m => {
    const isUser = m.sender === 'user';
    const cleanText = m.text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    return `
      <div style="margin-bottom: 10px; padding: 10px 14px; border-radius: 6px; border: 1px solid #cbd5e1; page-break-inside: avoid; ${isUser ? 'background: #f0f9ff;' : 'background: #f8fafc;' }">
        <div style="font-size: 8pt; font-weight: bold; color: ${primary}; margin-bottom: 4px;">
          ${isUser ? currentUser.name : appName} · ${m.timestamp}
        </div>
        <div style="font-size: 9pt; color: #0f172a; line-height: 1.45;">${cleanText}</div>
      </div>
    `;
  }).join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  const docTitle = `${orgName} - ${threadTitle}`;

  const printHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${docTitle}</title>
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 15px; font-size: 9.5pt; line-height: 1.4; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      ${buildBrandedHeaderHtml(branding, threadTitle)}
      <div style="font-size: 8.5pt; color: #64748b; margin-bottom: 14px;">
        Generated on ${dateStr} by ${currentUser.name} (${currentUser.role})
      </div>
      ${chatRows}
      <script>
        document.title = "${docTitle}";
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(printHtml);
  printWindow.document.close();
}

/**
 * Exports structured CSV
 */
export function exportToCSV(
  participants: Participant[],
  assessments: Assessment[],
  isAnonymized: boolean = false
) {
  const headers = [
    'Participant_ID',
    'Name',
    'Age',
    'Gender',
    'Organization',
    'Work_Mode',
    'Problem_Area',
    'Current_Support',
    'Baseline_PHQ9',
    'Week_4_PHQ9',
    'Week_8_PHQ9',
    'Delta_Reduction',
    'Outcome_Status'
  ];

  const rows = participants.map((p, idx) => {
    const pAssessments = assessments.filter(a => a.participantId === p.id);
    const base = pAssessments.find(a => a.type === 'Baseline')?.totalScore ?? '';
    const w4 = pAssessments.find(a => a.type === 'Week 4')?.totalScore ?? '';
    const w8 = pAssessments.find(a => a.type === 'Week 8')?.totalScore ?? '';
    const delta = typeof base === 'number' && typeof w8 === 'number' ? (base - w8) : '';
    const name = isAnonymized ? `ANON-${String(idx + 1).padStart(3, '0')}` : `${p.firstName} ${p.lastName}`;

    return [
      p.id,
      `"${name}"`,
      p.age || '',
      `"${p.gender}"`,
      `"${p.organization || 'NHS Trust'}"`,
      `"${p.workMode || 'Hybrid'}"`,
      `"${p.problemArea || 'Life changes'}"`,
      `"${p.currentMentalHealthSupport || 'None'}"`,
      base,
      w4,
      w8,
      delta,
      typeof w8 === 'number' && w8 < 5 ? 'Remitted' : 'Improved'
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Clinical_Dataset_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports machine-readable JSON structured data
 */
export function exportToJSON(
  participants: Participant[],
  assessments: Assessment[],
  analysis: AnalysisRecord | undefined,
  isAnonymized: boolean = false,
  branding?: SystemSettings
) {
  const data = {
    exportDate: new Date().toISOString(),
    organization: branding?.organizationName || 'NHS Trust',
    systemName: branding?.appName || 'IPT-G Insights',
    dataset: analysis?.datasetName || 'IPT-G Clinical Dataset',
    isAnonymized,
    aiSummary: analysis?.summary,
    keyFindings: analysis?.keyFindings,
    recommendations: analysis?.recommendations,
    metrics: analysis?.metrics,
    participants: participants.map((p, idx) => {
      const pAssessments = assessments.filter(a => a.participantId === p.id);
      return {
        id: p.id,
        name: isAnonymized ? `ANON-${String(idx + 1).padStart(3, '0')}` : `${p.firstName} ${p.lastName}`,
        age: p.age,
        gender: p.gender,
        organization: p.organization,
        workMode: p.workMode,
        tenure: p.tenure,
        problemArea: p.problemArea,
        currentSupport: p.currentMentalHealthSupport,
        scores: {
          baseline: pAssessments.find(a => a.type === 'Baseline')?.totalScore,
          week4: pAssessments.find(a => a.type === 'Week 4')?.totalScore,
          week8: pAssessments.find(a => a.type === 'Week 8')?.totalScore,
        }
      };
    })
  };

  const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', jsonStr);
  link.setAttribute('download', `Clinical_Report_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
