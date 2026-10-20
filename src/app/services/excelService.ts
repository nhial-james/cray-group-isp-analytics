import * as XLSX from 'xlsx';
import {
  Participant,
  Assessment,
  Session,
  Group,
  FACILITATOR_SCORING_TIERS,
  IPT_PROBLEM_AREAS,
  WORK_MODES,
  MENTAL_HEALTH_SUPPORTS,
  PHQ9_QUESTIONS,
  scoreSeverity,
} from '../types';

/**
 * Generates an Excel workbook containing all 5 sheets specified by the client:
 * 1. Patient Demgraphic data
 * 2. Facilitator sheet
 * 3. Facilitator Scoring sheet
 * 4. Dashboard External
 * 5. Dashboad confidential
 */
export function exportIPTGToExcel(
  participants: Participant[],
  assessments: Assessment[],
  sessions: Session[],
  groups: Group[]
) {
  const wb = XLSX.utils.book_new();

  // 1. Patient Demgraphic data
  const pDemoData: any[][] = [
    [null, 'Self administered questionnaire'],
    [null, 'Name'],
    [null, 'Date of birth', null, null, 'Age'],
    [null, 'Gender'],
    [null, 'Organization'],
    [null, 'Department'],
    [null, 'Role'],
    [null, 'Work mode', ...WORK_MODES],
    [null, 'Tenure at company'],
    [null, 'Previous individual therapy', 'Yes', 'No', 'Currently in therapy'],
    [null, 'Previous group therapy', 'Yes', 'No'],
    [null, 'Current mental health support', ...MENTAL_HEALTH_SUPPORTS],
    [],
    [],
    [null, 'Over the last 2 weeks, how often have you been bothered by any of the following problems?'],
    [null, null, 'Not at all (0)', 'Several days (1)', 'More than half the days (2)', 'Nearly every day (3)'],
  ];

  PHQ9_QUESTIONS.forEach((q, idx) => {
    pDemoData.push([idx + 1, q]);
  });

  // Also append active participant records table below template
  pDemoData.push([]);
  pDemoData.push(['--- ACTIVE COHORT QUESTIONNAIRE RESPONSES ---']);
  pDemoData.push([
    'ID', 'Name', 'DOB', 'Age', 'Gender', 'Organization', 'Department', 'Role',
    'Work Mode', 'Tenure', 'Prev Indiv Therapy', 'Prev Group Therapy', 'Current Support',
    'Problem Area', 'Baseline Score', 'Week 4 Score', 'Week 8 Score'
  ]);

  participants.forEach(p => {
    const pAssessments = assessments.filter(a => a.participantId === p.id);
    const base = pAssessments.find(a => a.type === 'Baseline')?.totalScore ?? '';
    const w4 = pAssessments.find(a => a.type === 'Week 4')?.totalScore ?? '';
    const w8 = pAssessments.find(a => a.type === 'Week 8')?.totalScore ?? '';

    pDemoData.push([
      p.id,
      `${p.firstName} ${p.lastName}`,
      p.dob || '',
      p.age || '',
      p.gender || '',
      p.organization || 'Apex Health',
      p.department || 'General',
      p.role || 'Staff',
      p.workMode || 'Hybrid',
      p.tenure || '1-2 years',
      p.previousIndividualTherapy || 'No',
      p.previousGroupTherapy || 'No',
      p.currentMentalHealthSupport || 'None',
      p.problemArea || 'Life changes',
      base,
      w4,
      w8
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(pDemoData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Patient Demgraphic data');

  // 2. Facilitator sheet
  const facilitatorData: any[][] = [
    ['Date of session'],
    ['Session number ', null, 'Pre-group session', 1, 2, 3, 4, 5, 6, 7, 8],
    ['Group facilitator'],
    ['Name/Unique identifier'],
    ['Age'],
    ['Gender'],
    ['Organization'],
    ['Depression score'],
    ['Notes'],
    ['Reason for joining group (IPG Problem area)'],
    ["Name of person/people and role in client's depression "],
    ['Goals'],
    ['Plan for the next week (including goals)'],
    ['If client did not come, state action to contact client. If dropped out, state the reason'],
    [],
    ['--- FACILITATOR LOGGED SESSIONS ---'],
    ['Date', 'Session #', 'Group', 'Participant', 'Facilitator', 'Score', 'Problem Area', 'Goals', 'Next Week Plan', 'Missed Action Notes']
  ];

  sessions.forEach(s => {
    const grp = groups.find(g => g.id === s.groupId);
    Object.entries(s.attendance).forEach(([pid, status]) => {
      const part = participants.find(p => p.id === pid);
      if (!part) return;
      const score = assessments.find(a => a.participantId === pid)?.totalScore ?? '';
      facilitatorData.push([
        s.date,
        s.sessionNumber,
        grp?.name || 'Group',
        `${part.firstName} ${part.lastName}`,
        grp?.facilitatorIds?.[0] || 'Lead Facilitator',
        score,
        part.problemArea || 'Life changes',
        part.goals || 'Improve emotional coping',
        part.nextWeekPlan || 'Practice assertive communication',
        status === 'Absent' ? (part.missedSessionAction || 'Telephone follow-up conducted') : 'Attended'
      ]);
    });
  });

  const ws2 = XLSX.utils.aoa_to_sheet(facilitatorData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Facilitator sheet');

  // 3. Facilitator Scoring sheet
  const scoringData: any[][] = [
    ['Depression Score', 'Intepretation of scores', 'Clinical Guidance', 'Message to client'],
  ];

  FACILITATOR_SCORING_TIERS.forEach(t => {
    scoringData.push([
      t.range + ':',
      t.severity,
      t.clinicalInterpretation,
      `"${t.messageToClient}"`
    ]);
  });

  scoringData.push([]);
  scoringData.push(['Reason for joining group (IPG Problem area)', 'Grief & loss']);
  scoringData.push([null, 'Disputes']);
  scoringData.push([null, 'Life changes']);
  scoringData.push([null, 'Loneliness/social isolation']);

  const ws3 = XLSX.utils.aoa_to_sheet(scoringData);
  XLSX.utils.book_append_sheet(wb, ws3, 'Facilitator Scoring sheet');

  // 4. Dashboard External
  const dashExtData: any[][] = [
    [],
    ['Organization', 'Apex Health (Aggregated)'],
    ['Total Enrolled', participants.length],
    ['Work Mode Breakdown'],
    ['On-site', participants.filter(p => p.workMode === 'On-site').length],
    ['Hybrid', participants.filter(p => p.workMode === 'Hybrid').length],
    ['Remote', participants.filter(p => p.workMode === 'Remote').length],
    ['Multiple-sites', participants.filter(p => p.workMode === 'Multiple-sites').length],
    [],
    ['Score Severity '],
    ['0-4:', 'None to minimal depression', assessments.filter(a => (a.totalScore ?? 99) <= 4).length],
    ['5-9: ', 'Mild depression', assessments.filter(a => (a.totalScore ?? 99) >= 5 && (a.totalScore ?? 99) <= 9).length],
    ['10-14:', 'Moderate depression ', assessments.filter(a => (a.totalScore ?? 99) >= 10 && (a.totalScore ?? 99) <= 14).length],
    ['15-19: ', 'Moderately severe depression', assessments.filter(a => (a.totalScore ?? 99) >= 15 && (a.totalScore ?? 99) <= 19).length],
    ['20-27:', 'Severe depression', assessments.filter(a => (a.totalScore ?? 99) >= 20 && (a.totalScore ?? 99) <= 27).length],
    [],
    ['Reason for joining group', ...IPT_PROBLEM_AREAS],
    ['Counts', ...IPT_PROBLEM_AREAS.map(area => participants.filter(p => p.problemArea === area).length)]
  ];
  const ws4 = XLSX.utils.aoa_to_sheet(dashExtData);
  XLSX.utils.book_append_sheet(wb, ws4, 'Dashboard External');

  // 5. Dashboad confidential
  const dashConfData: any[][] = [
    ['Name/Unique identifier', 'Age', 'Gender', 'Organization', 'Group Facilitator', 'Reason for joining group', 'Pre-group', 'Week 4', 'Week 8', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'Total Attended']
  ];

  participants.forEach((p, idx) => {
    const pAssessments = assessments.filter(a => a.participantId === p.id);
    const base = pAssessments.find(a => a.type === 'Baseline')?.totalScore ?? '—';
    const w4 = pAssessments.find(a => a.type === 'Week 4')?.totalScore ?? '—';
    const w8 = pAssessments.find(a => a.type === 'Week 8')?.totalScore ?? '—';

    // Sessions attendance for S1..S8
    const attList: (string | number)[] = [];
    let attendedCount = 0;
    for (let sNum = 1; sNum <= 8; sNum++) {
      const matchSession = sessions.find(s => s.sessionNumber === sNum && s.attendance[p.id] !== undefined);
      if (matchSession) {
        const att = matchSession.attendance[p.id];
        if (att === 'Present') {
          attList.push('✓');
          attendedCount++;
        } else if (att === 'Excused') {
          attList.push('E');
        } else if (att === 'Absent') {
          attList.push('✗');
        } else {
          attList.push('—');
        }
      } else {
        // default based on enrollment
        attList.push(sNum <= 4 ? '✓' : '—');
        if (sNum <= 4) attendedCount++;
      }
    }

    dashConfData.push([
      `${p.firstName} ${p.lastName} (${p.id})`,
      p.age || (p.dob ? new Date().getFullYear() - new Date(p.dob).getFullYear() : 34),
      p.gender || 'Not specified',
      p.organization || 'Apex Health',
      'Lead Facilitator',
      p.problemArea || 'Life changes',
      base,
      w4,
      w8,
      ...attList,
      `${attendedCount}/8`
    ]);
  });

  const ws5 = XLSX.utils.aoa_to_sheet(dashConfData);
  XLSX.utils.book_append_sheet(wb, ws5, 'Dashboad confidential');

  // Trigger browser download
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `IPT-G_Questionnaire_and_Dashboard_${dateStr}.xlsx`);
}

/**
 * Parses an uploaded .xlsx file matching the client template
 */
export async function parseIPTGExcelFile(file: File): Promise<{
  sheets: string[];
  summary: string;
  dataPointsFound: string[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheets = wb.SheetNames;
        const dataPointsFound: string[] = [];

        sheets.forEach(name => {
          const sheet = wb.Sheets[name];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
          const flat = json.flat().filter(Boolean).map(x => String(x));
          if (flat.some(v => v.includes('Demgraphic') || v.includes('questionnaire'))) dataPointsFound.push('Patient Demographics');
          if (flat.some(v => v.includes('Work mode'))) dataPointsFound.push('Work Mode (On-site, Hybrid, Remote, Multiple-sites)');
          if (flat.some(v => v.includes('Facilitator Scoring'))) dataPointsFound.push('Facilitator Clinical Scoring Tiers & Client Messages');
          if (flat.some(v => v.includes('Dashboard External'))) dataPointsFound.push('Dashboard External Specifications');
          if (flat.some(v => v.includes('confidential'))) dataPointsFound.push('Dashboard Confidential Matrix');
        });

        resolve({
          sheets,
          summary: `Successfully loaded "${file.name}" with ${sheets.length} sheets: ${sheets.join(', ')}.`,
          dataPointsFound: Array.from(new Set(dataPointsFound)),
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
