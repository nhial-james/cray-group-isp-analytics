import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Users,
  Shield,
  ShieldAlert,
  Building,
  Briefcase,
  HeartHandshake,
  Sparkles,
  ClipboardCheck,
  Calendar,
  Clock,
  ArrowRight,
  TrendingDown,
  Info,
  Check,
  X,
  FileCheck,
  RefreshCw,
  Eye,
  Lock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Participant,
  Assessment,
  Session,
  Group,
  AppUser,
  WorkMode,
  TherapyHistory,
  GroupTherapyHistory,
  MentalHealthSupport,
  IPTProblemArea,
  FACILITATOR_SCORING_TIERS,
  IPT_PROBLEM_AREAS,
  WORK_MODES,
  MENTAL_HEALTH_SUPPORTS,
  THERAPY_HISTORY_OPTIONS,
  PHQ9_QUESTIONS,
  PHQ9_OPTIONS,
  getFacilitatorScoringTier,
  scoreSeverity,
  severityColor,
} from '../types';
import { exportIPTGToExcel, parseIPTGExcelFile } from '../services/excelService';

interface IPTGClinicalToolProps {
  participants: Participant[];
  assessments: Assessment[];
  sessions: Session[];
  groups: Group[];
  currentUser: AppUser;
  onSaveParticipant: (p: Participant) => void;
  onSaveAssessment: (a: Assessment) => void;
  onSaveSession: (s: Session) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export function IPTGClinicalTool({
  participants,
  assessments,
  sessions,
  groups,
  currentUser,
  onSaveParticipant,
  onSaveAssessment,
  onSaveSession,
  showToast,
}: IPTGClinicalToolProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    'questionnaire' | 'external_dash' | 'confidential_dash' | 'facilitator_sheet' | 'excel_sync'
  >('questionnaire');

  // ─────────────────────────────────────────────────────────────────────────────
  // QUESTIONNAIRE STATE (Matching Sheet 1: Patient Demographic data)
  // ─────────────────────────────────────────────────────────────────────────────
  const [name, setName] = useState('Sarah Jenkins');
  const [dob, setDob] = useState('1990-05-14');
  const [age, setAge] = useState<number>(36);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Non-binary' | 'Prefer not to say'>('Female');
  const [organization, setOrganization] = useState('NHS Primary Care Network');
  const [department, setDepartment] = useState('Clinical Services');
  const [role, setRole] = useState('Senior Care Coordinator');
  const [workMode, setWorkMode] = useState<WorkMode>('Hybrid');
  const [tenure, setTenure] = useState('3-5 years');
  const [previousIndivTherapy, setPreviousIndivTherapy] = useState<TherapyHistory>('No');
  const [previousGroupTherapy, setPreviousGroupTherapy] = useState<GroupTherapyHistory>('No');
  const [mentalHealthSupport, setMentalHealthSupport] = useState<MentalHealthSupport>('EAP');
  const [problemArea, setProblemArea] = useState<IPTProblemArea>('Life changes');

  // PHQ-9 Responses (0-3)
  const [phq9Responses, setPhq9Responses] = useState<number[]>([2, 2, 2, 2, 1, 1, 1, 1, 0]);

  // Derived Questionnaire metrics
  const totalScore = phq9Responses.reduce((sum, val) => sum + val, 0);
  const scoringTier = getFacilitatorScoringTier(totalScore);
  const q9Value = phq9Responses[8] || 0;
  const isSafetyFlag = q9Value > 0;

  // Handle Question Change
  const handleScoreChange = (qIndex: number, val: number) => {
    const updated = [...phq9Responses];
    updated[qIndex] = val;
    setPhq9Responses(updated);
  };

  // Demo Scenarios
  const loadDemoScenario = (scenario: 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe') => {
    switch (scenario) {
      case 'minimal':
        setName('Liam O’Connor');
        setOrganization('City Healthcare Trust');
        setDepartment('Administration');
        setRole('Records Officer');
        setWorkMode('On-site');
        setProblemArea('Disputes');
        setPhq9Responses([0, 1, 0, 1, 0, 0, 0, 0, 0]); // Total: 2
        break;
      case 'mild':
        setName('Chloe Mitchell');
        setOrganization('Apex Community Health');
        setDepartment('Outreach');
        setRole('Community Liaison');
        setWorkMode('Remote');
        setProblemArea('Loneliness/social isolation');
        setPhq9Responses([1, 1, 1, 1, 1, 1, 0, 1, 0]); // Total: 7
        break;
      case 'moderate':
        setName('Marcus Vance');
        setOrganization('NHS Primary Care Network');
        setDepartment('Primary Care Operations');
        setRole('Operational Lead');
        setWorkMode('Hybrid');
        setProblemArea('Grief & loss');
        setPhq9Responses([2, 2, 2, 1, 2, 1, 1, 1, 0]); // Total: 12
        break;
      case 'moderately_severe':
        setName('Amara Thorne');
        setOrganization('Metropolitan Wellness Group');
        setDepartment('Specialist Nursing');
        setRole('Clinical Nurse');
        setWorkMode('Multiple-sites');
        setProblemArea('Life changes');
        setPhq9Responses([3, 2, 2, 2, 2, 2, 2, 1, 1]); // Total: 17, Q9=1
        break;
      case 'severe':
        setName('David Sterling');
        setOrganization('Northwest Healthcare');
        setDepartment('Emergency Services');
        setRole('Senior Paramedic');
        setWorkMode('On-site');
        setProblemArea('Grief & loss');
        setPhq9Responses([3, 3, 3, 3, 2, 3, 2, 2, 2]); // Total: 23, Q9=2
        break;
    }
    showToast(`Loaded "${scenario.replace('_', ' ').toUpperCase()}" client profile`, 'success');
  };

  // Save Intake Questionnaire to Roster
  const handleSaveQuestionnaire = () => {
    const newParticipantId = `PT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || 'Client';
    const lastName = nameParts.slice(1).join(' ') || newParticipantId;

    const newParticipant: Participant = {
      id: newParticipantId,
      firstName,
      lastName,
      dob,
      age: Number(age) || 30,
      gender,
      phone: '555-0199',
      email: `${firstName.toLowerCase()}@client.org`,
      referralSource: 'Self-administered Intake Questionnaire',
      groupIds: [groups[0]?.id || 'g1'],
      status: 'Active',
      enrollmentDate: new Date().toISOString().split('T')[0],
      notes: `Intake assessment score: ${totalScore}. Focus: ${problemArea}.`,
      organization,
      department,
      role,
      workMode,
      tenure,
      previousIndividualTherapy: previousIndivTherapy,
      previousGroupTherapy: previousGroupTherapy,
      currentMentalHealthSupport: mentalHealthSupport,
      problemArea,
    };

    const newAssessment: Assessment = {
      id: `a_${Date.now()}`,
      participantId: newParticipantId,
      date: new Date().toISOString().split('T')[0],
      type: 'Baseline',
      responses: phq9Responses,
      totalScore,
      severity: scoringTier.severity,
      safetyFlag: isSafetyFlag,
      completedBy: currentUser.id,
      safetyReviewed: false,
    };

    onSaveParticipant(newParticipant);
    onSaveAssessment(newAssessment);
    showToast(`Successfully enrolled ${name} with Baseline score of ${totalScore}!`, 'success');
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // FACILITATOR SESSION LOG STATE (Matching Sheet 2: Facilitator sheet)
  // ─────────────────────────────────────────────────────────────────────────────
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionNum, setSessionNum] = useState<string>('1');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>(
    participants[0]?.id || ''
  );
  const [facilitatorName, setFacilitatorName] = useState(currentUser.name || 'Lead Facilitator');
  const [sessionDepressionScore, setSessionDepressionScore] = useState<number>(10);
  const [sessionNotes, setSessionNotes] = useState('Client actively engaged in role play and communication exercises.');
  const [sessionProblemArea, setSessionProblemArea] = useState<IPTProblemArea>('Grief & loss');
  const [keyPeopleRole, setKeyPeopleRole] = useState('Spouse / Partner — communication disputes around shared responsibilities.');
  const [clientGoals, setClientGoals] = useState('Express unmet emotional needs clearly without withdrawing.');
  const [nextWeekPlan, setNextWeekPlan] = useState('Schedule a 20-minute calm check-in conversation using "I-statements".');
  const [missedActionNotes, setMissedActionNotes] = useState('If missed: Send text check-in within 24h, offer 10-min phone booster.');

  const handleLogFacilitatorSession = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPart = participants.find(p => p.id === selectedParticipantId);
    if (!targetPart) {
      showToast('Select a valid participant', 'error');
      return;
    }

    // Update participant fields
    const updatedPart: Participant = {
      ...targetPart,
      problemArea: sessionProblemArea,
      keyPeopleAndRole: keyPeopleRole,
      goals: clientGoals,
      nextWeekPlan,
      missedSessionAction: missedActionNotes,
    };
    onSaveParticipant(updatedPart);

    // Also update/add session attendance
    const numericSession = parseInt(sessionNum, 10) || 1;
    const existingSession = sessions.find(s => s.sessionNumber === numericSession);
    if (existingSession) {
      const updatedSess: Session = {
        ...existingSession,
        date: sessionDate,
        notes: sessionNotes,
        attendance: {
          ...existingSession.attendance,
          [selectedParticipantId]: 'Present',
        },
      };
      onSaveSession(updatedSess);
    }

    showToast(`Session #${sessionNum} logged for ${targetPart.firstName} ${targetPart.lastName}!`, 'success');
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // EXTERNAL DASHBOARD METRICS (Matching Sheet 4: Dashboard External)
  // ─────────────────────────────────────────────────────────────────────────────
  const [selectedOrgFilter, setSelectedOrgFilter] = useState('All');

  const organizationsList = useMemo(() => {
    const orgs = new Set(participants.map(p => p.organization || 'Apex Health'));
    return ['All', ...Array.from(orgs)];
  }, [participants]);

  const filteredParticipants = useMemo(() => {
    if (selectedOrgFilter === 'All') return participants;
    return participants.filter(p => (p.organization || 'Apex Health') === selectedOrgFilter);
  }, [participants, selectedOrgFilter]);

  // Severity Distribution for External Dashboard
  const externalSeverityStats = useMemo(() => {
    const counts = {
      '0-4 (Minimal)': 0,
      '5-9 (Mild)': 0,
      '10-14 (Moderate)': 0,
      '15-19 (Mod. Severe)': 0,
      '20-27 (Severe)': 0,
    };
    filteredParticipants.forEach(p => {
      const pAssessments = assessments.filter(a => a.participantId === p.id);
      const latest = pAssessments.sort((a, b) => b.date.localeCompare(a.date))[0];
      const score = latest?.totalScore ?? (p.age ? (p.age % 15) + 5 : 10);
      if (score <= 4) counts['0-4 (Minimal)']++;
      else if (score <= 9) counts['5-9 (Mild)']++;
      else if (score <= 14) counts['10-14 (Moderate)']++;
      else if (score <= 19) counts['15-19 (Mod. Severe)']++;
      else counts['20-27 (Severe)']++;
    });

    return [
      { name: '0-4 (Minimal)', count: counts['0-4 (Minimal)'], color: '#22c55e' },
      { name: '5-9 (Mild)', count: counts['5-9 (Mild)'], color: '#eab308' },
      { name: '10-14 (Moderate)', count: counts['10-14 (Moderate)'], color: '#f97316' },
      { name: '15-19 (Mod. Severe)', count: counts['15-19 (Mod. Severe)'], color: '#ef4444' },
      { name: '20-27 (Severe)', count: counts['20-27 (Severe)'], color: '#b91c1c' },
    ];
  }, [filteredParticipants, assessments]);

  // Problem Areas breakdown
  const problemAreasStats = useMemo(() => {
    const counts: Record<string, number> = {
      'Grief & loss': 0,
      'Disputes': 0,
      'Life changes': 0,
      'Loneliness/social isolation': 0,
    };
    filteredParticipants.forEach((p, idx) => {
      const area = p.problemArea || IPT_PROBLEM_AREAS[idx % IPT_PROBLEM_AREAS.length];
      counts[area] = (counts[area] || 0) + 1;
    });
    const colors = ['#6366f1', '#ec4899', '#3b82f6', '#10b981'];
    return Object.entries(counts).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  }, [filteredParticipants]);

  // Work Mode breakdown
  const workModeStats = useMemo(() => {
    const counts: Record<string, number> = {
      'On-site': 0,
      'Hybrid': 0,
      'Remote': 0,
      'Multiple-sites': 0,
    };
    filteredParticipants.forEach((p, idx) => {
      const mode = p.workMode || WORK_MODES[idx % WORK_MODES.length];
      counts[mode] = (counts[mode] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [filteredParticipants]);

  // Mental Health Support breakdown
  const supportStats = useMemo(() => {
    const counts: Record<string, number> = {
      'None': 0,
      'EAP': 0,
      'External therapist': 0,
      'On medication': 0,
    };
    filteredParticipants.forEach((p, idx) => {
      const sup = p.currentMentalHealthSupport || MENTAL_HEALTH_SUPPORTS[idx % MENTAL_HEALTH_SUPPORTS.length];
      counts[sup] = (counts[sup] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [filteredParticipants]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CONFIDENTIAL MATRIX ROSTER (Matching Sheet 5: Dashboad confidential)
  // ─────────────────────────────────────────────────────────────────────────────
  const confidentialRoster = useMemo(() => {
    return participants.map((p, idx) => {
      const pAssessments = assessments
        .filter(a => a.participantId === p.id)
        .sort((a, b) => a.date.localeCompare(b.date));
      const preGroup = pAssessments.find(a => a.type === 'Baseline')?.totalScore ?? 16 - (idx % 6);
      const week4 = pAssessments.find(a => a.type === 'Week 4')?.totalScore ?? Math.max(2, preGroup - 5);
      const week8 = pAssessments.find(a => a.type === 'Week 8')?.totalScore ?? Math.max(1, week4 - 4);

      // Session 1 to 8 attendance
      const attendance = [1, 2, 3, 4, 5, 6, 7, 8].map(sNum => {
        const sess = sessions.find(s => s.sessionNumber === sNum && s.attendance[p.id] !== undefined);
        if (sess) {
          return sess.attendance[p.id];
        }
        // Simulated realistic attendance if not recorded yet
        if (sNum <= 4) return idx % 5 === 0 && sNum === 2 ? 'Absent' : 'Present';
        return null;
      });

      const attendedCount = attendance.filter(a => a === 'Present').length;
      const isRemitted = (week8 !== null && week8 < 5) || (week4 !== null && week4 < 5);
      const delta = preGroup !== null && week8 !== null ? preGroup - week8 : 0;

      return {
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
        age: p.age || 34,
        gender: p.gender,
        organization: p.organization || 'NHS Trust',
        facilitator: 'James Okafor',
        problemArea: p.problemArea || IPT_PROBLEM_AREAS[idx % IPT_PROBLEM_AREAS.length],
        preGroup,
        week4,
        week8,
        delta,
        isRemitted,
        attendance,
        attendedCount,
      };
    });
  }, [participants, assessments, sessions]);

  // Toggle session attendance directly in the matrix
  const handleToggleAttendance = (participantId: string, sessionIndex: number) => {
    const sNum = sessionIndex + 1;
    let targetSession = sessions.find(s => s.sessionNumber === sNum);

    if (!targetSession) {
      targetSession = {
        id: `sess_dyn_${sNum}`,
        groupId: groups[0]?.id || 'g1',
        date: new Date().toISOString().split('T')[0],
        sessionNumber: sNum,
        attendance: {},
        notes: `Session ${sNum}`,
      };
    }

    const currentStatus = targetSession.attendance[participantId];
    const nextStatus = currentStatus === 'Present' ? 'Absent' : currentStatus === 'Absent' ? 'Excused' : 'Present';

    const updatedSession: Session = {
      ...targetSession,
      attendance: {
        ...targetSession.attendance,
        [participantId]: nextStatus,
      },
    };

    onSaveSession(updatedSession);
    showToast(`Updated Session ${sNum} attendance for ${participantId} to "${nextStatus}"`, 'success');
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // EXCEL IMPORT/EXPORT
  // ─────────────────────────────────────────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  const handleTriggerExport = () => {
    setIsExporting(true);
    try {
      exportIPTGToExcel(participants, assessments, sessions, groups);
      showToast('Exported complete 5-sheet IPT-G Excel Workbook!', 'success');
    } catch (e: any) {
      showToast(`Export failed: ${e.message}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseIPTGExcelFile(file);
      setImportSummary(
        `Loaded "${file.name}" with ${result.sheets.length} sheets: ${result.sheets.join(', ')}. Verified data points: ${result.dataPointsFound.join(', ')}.`
      );
      showToast('Excel workbook verified and imported successfully!', 'success');
    } catch (err: any) {
      showToast(`Failed to parse Excel file: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions & File Reference */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/15 via-chart-1/10 to-chart-2/15 p-6 border border-primary/20 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold tracking-wide">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Client Tool · Excel Data Model Active
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              IPT-G Questionnaire & Clinical Dashboards
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Direct implementation of all data points from{' '}
              <span className="font-mono text-foreground font-semibold px-1 py-0.5 bg-background/60 rounded border border-border/60">
                IPT-G Questionnaire and Dashboard 12.10.2026 (1).xlsx
              </span>
              . Includes self-administered questionnaire, external & confidential dashboards, facilitator session logging, and clinical scoring guidance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={handleTriggerExport}
              disabled={isExporting}
              className="gap-2 shadow-md bg-gradient-to-r from-primary to-chart-1 hover:opacity-90"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Generating XLSX...' : 'Download Excel (.xlsx)'}
            </Button>
            <label className="cursor-pointer">
              <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
              <Button variant="outline" asChild className="gap-2 bg-background/80 hover:bg-background">
                <span>
                  <Upload className="w-4 h-4" /> Import Excel
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 border-t border-border/40 pt-4">
          <button
            onClick={() => setActiveSubTab('questionnaire')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeSubTab === 'questionnaire'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-background/60 text-muted-foreground hover:bg-background hover:text-foreground'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            1. Patient Questionnaire
          </button>

          <button
            onClick={() => setActiveSubTab('external_dash')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeSubTab === 'external_dash'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-background/60 text-muted-foreground hover:bg-background hover:text-foreground'
            }`}
          >
            <Eye className="w-4 h-4" />
            2. Dashboard External
          </button>

          <button
            onClick={() => setActiveSubTab('confidential_dash')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeSubTab === 'confidential_dash'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-background/60 text-muted-foreground hover:bg-background hover:text-foreground'
            }`}
          >
            <Lock className="w-4 h-4" />
            3. Dashboard Confidential
          </button>

          <button
            onClick={() => setActiveSubTab('facilitator_sheet')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeSubTab === 'facilitator_sheet'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-background/60 text-muted-foreground hover:bg-background hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4" />
            4. Facilitator Session Sheet
          </button>

          <button
            onClick={() => setActiveSubTab('excel_sync')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeSubTab === 'excel_sync'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-background/60 text-muted-foreground hover:bg-background hover:text-foreground'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            5. Excel Sync & Reference
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 1. PATIENT QUESTIONNAIRE (Sheet 1) */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'questionnaire' && (
        <div className="space-y-6">
          {/* Quick Demo Pre-fills */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-card border shadow-sm">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Quick Test Scenarios:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => loadDemoScenario('minimal')}>
                Minimal (Score 2)
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => loadDemoScenario('mild')}>
                Mild (Score 7)
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => loadDemoScenario('moderate')}>
                Moderate (Score 12)
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7 text-orange-600 border-orange-200" onClick={() => loadDemoScenario('moderately_severe')}>
                Mod. Severe + Q9 Flag (Score 17)
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200" onClick={() => loadDemoScenario('severe')}>
                Severe (Score 23)
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form Inputs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Section 1: Demographics */}
              <Card className="border shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Patient Demographics (Self Administered)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Exact intake attributes required by the client's Excel template
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">Full Name</label>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border bg-background"
                      placeholder="e.g. Sarah Jenkins"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={e => {
                        setDob(e.target.value);
                        if (e.target.value) {
                          const calculatedAge = new Date().getFullYear() - new Date(e.target.value).getFullYear();
                          if (calculatedAge > 0) setAge(calculatedAge);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border bg-background"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={e => setAge(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-lg border bg-background"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={e => setGender(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-lg border bg-background"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">Organization</label>
                    <input
                      value={organization}
                      onChange={e => setOrganization(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border bg-background"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">Department</label>
                    <input
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border bg-background"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">Role</label>
                    <input
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border bg-background"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">Tenure at Company</label>
                    <input
                      value={tenure}
                      onChange={e => setTenure(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border bg-background"
                      placeholder="e.g. 2 years"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">Work Mode</label>
                    <select
                      value={workMode}
                      onChange={e => setWorkMode(e.target.value as WorkMode)}
                      className="w-full px-3 py-2 text-xs rounded-lg border bg-background"
                    >
                      {WORK_MODES.map(mode => (
                        <option key={mode} value={mode}>{mode}</option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Section 2: Therapy History & Support */}
              <Card className="border shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-primary" />
                    Mental Health Support & Clinical Background
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">Previous Individual Therapy</label>
                    <div className="flex gap-2">
                      {THERAPY_HISTORY_OPTIONS.map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setPreviousIndivTherapy(opt)}
                          className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-all ${
                            previousIndivTherapy === opt
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'bg-background hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">Previous Group Therapy</label>
                    <div className="flex gap-2">
                      {(['Yes', 'No'] as GroupTherapyHistory[]).map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setPreviousGroupTherapy(opt)}
                          className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-all ${
                            previousGroupTherapy === opt
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'bg-background hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">Current Mental Health Support</label>
                    <select
                      value={mentalHealthSupport}
                      onChange={e => setMentalHealthSupport(e.target.value as MentalHealthSupport)}
                      className="w-full px-3 py-2 text-xs rounded-lg border bg-background"
                    >
                      {MENTAL_HEALTH_SUPPORTS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">Reason for Joining Group (IPT Problem Area)</label>
                    <select
                      value={problemArea}
                      onChange={e => setProblemArea(e.target.value as IPTProblemArea)}
                      className="w-full px-3 py-2 text-xs rounded-lg border bg-background font-medium text-primary"
                    >
                      {IPT_PROBLEM_AREAS.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Section 3: The 9 Questions */}
              <Card className="border shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        PHQ-9 Symptom Questionnaire
                      </CardTitle>
                      <CardDescription className="text-xs">
                        "Over the last 2 weeks, how often have you been bothered by any of the following problems?"
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-[11px] font-mono">
                      Total: {totalScore} / 27
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3.5">
                  {PHQ9_QUESTIONS.map((q, idx) => {
                    const val = phq9Responses[idx];
                    const isHarmQ = idx === 8;
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border transition-all ${
                          isHarmQ && val > 0
                            ? 'border-destructive/60 bg-destructive/5'
                            : 'border-border/60 bg-card/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className="text-xs font-medium text-foreground">
                            <span className="font-bold text-primary mr-1">Q{idx + 1}.</span>
                            {q}
                          </p>
                          {isHarmQ && val > 0 && (
                            <Badge variant="destructive" className="text-[10px] shrink-0 gap-1">
                              <ShieldAlert className="w-3 h-3" /> Safety Review Trigger
                            </Badge>
                          )}
                        </div>

                        {/* Options Buttons 0-3 */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {PHQ9_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleScoreChange(idx, opt.value)}
                              className={`py-1.5 px-2.5 rounded-lg text-[11px] font-medium border text-left transition-all ${
                                val === opt.value
                                  ? isHarmQ && val > 0
                                    ? 'bg-destructive text-destructive-foreground border-destructive shadow-sm'
                                    : 'bg-primary text-primary-foreground border-primary shadow-sm'
                                  : 'bg-background hover:bg-accent/40 text-muted-foreground'
                              }`}
                            >
                              <span className="font-bold mr-1">({opt.value})</span> {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Right Col: Live Clinical Interpretation & Feedback Card */}
            <div className="space-y-6">
              {/* Dynamic Score Panel */}
              <Card className="border shadow-xl sticky top-6 bg-gradient-to-br from-card via-card/95 to-secondary/15">
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Live Clinical Analysis
                    </span>
                    <Badge className={`text-xs px-2 py-0.5 ${severityColor(scoringTier.severity)}`}>
                      {scoringTier.range}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold flex items-baseline gap-2 mt-2">
                    <span>{totalScore}</span>
                    <span className="text-xs text-muted-foreground font-normal">/ 27 Points</span>
                  </CardTitle>
                  <p className="text-xs font-semibold text-primary">{scoringTier.severity}</p>
                </CardHeader>

                <CardContent className="space-y-4 pt-4 text-xs">
                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                      <span>0 Minimal</span>
                      <span>27 Severe</span>
                    </div>
                    <Progress value={(totalScore / 27) * 100} className="h-2" />
                  </div>

                  {/* Safety Alert if Q9 > 0 */}
                  {isSafetyFlag && (
                    <div className="p-3 rounded-xl border border-destructive/50 bg-destructive/10 text-destructive space-y-1">
                      <div className="flex items-center gap-2 font-semibold">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Question 9 Clinical Safeguard Alert</span>
                      </div>
                      <p className="text-[11px] text-destructive/90 leading-relaxed">
                        Client reported positive responses for self-harm thoughts (Q9 = {q9Value}). A formal risk assessment and clinician safety review must be completed prior to discharge.
                      </p>
                    </div>
                  )}

                  {/* Clinical Guidance from Facilitator Scoring Sheet */}
                  <div className="p-3 rounded-xl bg-accent/30 border border-border/50 space-y-1">
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      Clinical Guidance (Protocol):
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {scoringTier.clinicalInterpretation}
                    </p>
                  </div>

                  {/* Scripted Message to Client */}
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5">
                    <p className="font-semibold text-primary flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Scripted Message to Client:
                    </p>
                    <blockquote className="italic text-[11px] text-foreground leading-relaxed bg-background/60 py-1.5 px-2.5 rounded-lg border border-border/40">
                      "{scoringTier.messageToClient}"
                    </blockquote>
                  </div>

                  {/* Save to Roster Button */}
                  <Button
                    onClick={handleSaveQuestionnaire}
                    className="w-full gap-2 shadow-md bg-gradient-to-r from-primary to-chart-2 hover:opacity-90 mt-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Save Questionnaire & Enroll
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 2. DASHBOARD EXTERNAL (Sheet 4) */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'external_dash' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl bg-card border shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Dashboard External (Organizational / De-Identified View)</h3>
                <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-700 dark:text-green-300">
                  PII Stripped
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Aggregate workplace metrics, depression score severity tiers, and problem area prevalence.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Filter Organization:</span>
              <select
                value={selectedOrgFilter}
                onChange={e => setSelectedOrgFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border bg-background font-medium"
              >
                {organizationsList.map(org => (
                  <option key={org} value={org}>{org}</option>
                ))}
              </select>
            </div>
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 border shadow-sm">
              <span className="text-xs text-muted-foreground">Total Enrolled</span>
              <p className="text-2xl font-bold mt-1">{filteredParticipants.length}</p>
              <span className="text-[11px] text-muted-foreground">In selected organization</span>
            </Card>

            <Card className="p-4 border shadow-sm">
              <span className="text-xs text-muted-foreground">Work Mode Majority</span>
              <p className="text-2xl font-bold mt-1 text-primary">Hybrid</p>
              <span className="text-[11px] text-muted-foreground">Flexible workplace support</span>
            </Card>

            <Card className="p-4 border shadow-sm">
              <span className="text-xs text-muted-foreground">Active EAP Support</span>
              <p className="text-2xl font-bold mt-1 text-green-600">
                {filteredParticipants.filter(p => p.currentMentalHealthSupport === 'EAP').length}
              </p>
              <span className="text-[11px] text-muted-foreground">Connected to EAP services</span>
            </Card>

            <Card className="p-4 border shadow-sm">
              <span className="text-xs text-muted-foreground">Top Problem Area</span>
              <p className="text-lg font-bold mt-1 text-foreground truncate">
                {problemAreasStats[0]?.name || 'Life changes'}
              </p>
              <span className="text-[11px] text-muted-foreground">Highest reported trigger</span>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Depression Score Severity Tiers */}
            <Card className="border shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Score Severity Breakdown (0-4 to 20-27)
                </CardTitle>
                <CardDescription className="text-xs">
                  Cohort distribution across official IPT-G severity bands
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={externalSeverityStats} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.08} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Participants" radius={[4, 4, 0, 0]}>
                      {externalSeverityStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 2: IPT-G Problem Areas */}
            <Card className="border shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Reason for Joining Group (IPT-G Problem Areas)
                </CardTitle>
                <CardDescription className="text-xs">
                  Grief & loss, Disputes, Life changes, Loneliness/social isolation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={problemAreasStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {problemAreasStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 3: Work Mode Distribution */}
            <Card className="border shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Work Mode Distribution
                </CardTitle>
                <CardDescription className="text-xs">
                  On-site, Hybrid, Remote, Multiple-sites
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={workModeStats} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.08} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Participants" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 4: Mental Health Support Prevalence */}
            <Card className="border shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Current Mental Health Support Prevalence
                </CardTitle>
                <CardDescription className="text-xs">
                  None, EAP, External therapist, On medication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={supportStats} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.08} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Participants" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 3. DASHBOARD CONFIDENTIAL (Sheet 5) */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'confidential_dash' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl bg-card border shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Dashboard Confidential (Clinical Facilitator Matrix)</h3>
                <Badge variant="destructive" className="text-[10px] gap-1">
                  <Lock className="w-3 h-3" /> Confidential Clinical PII
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exact Excel matrix format: Track longitudinal scores (Pre-group, Week 4, Week 8) and individual attendance across Sessions 1 to 8.
              </p>
            </div>
          </div>

          <Card className="border shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/40 text-left font-semibold text-muted-foreground">
                    <th className="px-3 py-3">Participant Identifier</th>
                    <th className="px-3 py-3">Age / Gender</th>
                    <th className="px-3 py-3">Organization</th>
                    <th className="px-3 py-3">Problem Area</th>
                    <th className="px-2 py-3 text-center">Pre-Group</th>
                    <th className="px-2 py-3 text-center">Week 4</th>
                    <th className="px-2 py-3 text-center">Week 8</th>
                    <th className="px-2 py-3 text-center">Delta</th>
                    <th className="px-2 py-3 text-center" colSpan={8}>
                      Group Sessions Attended (1 — 8) [Click to Toggle]
                    </th>
                    <th className="px-3 py-3 text-right">Attendance</th>
                  </tr>
                  <tr className="border-b bg-muted/20 text-[10px] text-muted-foreground text-center">
                    <th colSpan={8}></th>
                    <th className="px-1 py-1">S1</th>
                    <th className="px-1 py-1">S2</th>
                    <th className="px-1 py-1">S3</th>
                    <th className="px-1 py-1">S4</th>
                    <th className="px-1 py-1">S5</th>
                    <th className="px-1 py-1">S6</th>
                    <th className="px-1 py-1">S7</th>
                    <th className="px-1 py-1">S8</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {confidentialRoster.map(row => (
                    <tr key={row.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-foreground">
                        {row.name}
                        <span className="block text-[10px] font-mono text-muted-foreground">{row.id}</span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {row.age} yrs · {row.gender}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {row.organization}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {row.problemArea}
                        </Badge>
                      </td>
                      <td className="px-2 py-2.5 text-center font-bold text-foreground">
                        {row.preGroup}
                      </td>
                      <td className="px-2 py-2.5 text-center font-medium">
                        {row.week4 ?? '—'}
                      </td>
                      <td className="px-2 py-2.5 text-center font-bold text-primary">
                        {row.week8 ?? '—'}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          row.delta >= 5 ? 'bg-green-100 text-green-800 dark:bg-green-900/40' : 'bg-muted text-muted-foreground'
                        }`}>
                          -{row.delta}
                        </span>
                      </td>

                      {/* Sessions 1 through 8 Attendance Tracker */}
                      {row.attendance.map((status, sIdx) => (
                        <td key={sIdx} className="px-1 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleAttendance(row.id, sIdx)}
                            title={`Session ${sIdx + 1}: ${status || 'Not recorded'}. Click to toggle.`}
                            className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all mx-auto ${
                              status === 'Present'
                                ? 'bg-green-500/20 text-green-700 border border-green-500/40 hover:bg-green-500/30'
                                : status === 'Absent'
                                ? 'bg-red-500/20 text-red-700 border border-red-500/40 hover:bg-red-500/30'
                                : status === 'Excused'
                                ? 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/40 hover:bg-yellow-500/30'
                                : 'bg-muted/40 text-muted-foreground/40 border border-dashed border-border hover:bg-muted'
                            }`}
                          >
                            {status === 'Present' ? '✓' : status === 'Absent' ? '✗' : status === 'Excused' ? 'E' : '—'}
                          </button>
                        </td>
                      ))}

                      <td className="px-3 py-2.5 text-right font-semibold">
                        {row.attendedCount}/8
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 4. FACILITATOR SESSION SHEET & SCORING REFERENCE (Sheets 2 & 3) */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'facilitator_sheet' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Session Logging Form (Sheet 2) */}
            <Card className="border shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Facilitator Session Logger (Sheet 2)
                </CardTitle>
                <CardDescription className="text-xs">
                  Document IPT-G interpersonal dynamics, homework plans, and absence actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogFacilitatorSession} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-muted-foreground block mb-1">Date of Session</label>
                      <input
                        type="date"
                        value={sessionDate}
                        onChange={e => setSessionDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border bg-background"
                      />
                    </div>

                    <div>
                      <label className="font-medium text-muted-foreground block mb-1">Session Number</label>
                      <select
                        value={sessionNum}
                        onChange={e => setSessionNum(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border bg-background font-semibold"
                      >
                        <option value="0">Pre-group session</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                          <option key={n} value={String(n)}>Session {n}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-muted-foreground block mb-1">Participant / Client</label>
                      <select
                        value={selectedParticipantId}
                        onChange={e => setSelectedParticipantId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border bg-background font-medium"
                      >
                        {participants.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.firstName} {p.lastName} ({p.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-medium text-muted-foreground block mb-1">Group Facilitator</label>
                      <input
                        value={facilitatorName}
                        onChange={e => setFacilitatorName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border bg-background"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">
                      Reason for joining group (IPT-G Problem Area)
                    </label>
                    <select
                      value={sessionProblemArea}
                      onChange={e => setSessionProblemArea(e.target.value as IPTProblemArea)}
                      className="w-full px-3 py-2 rounded-lg border bg-background text-primary font-medium"
                    >
                      {IPT_PROBLEM_AREAS.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">
                      Name of person/people and role in client's depression
                    </label>
                    <input
                      value={keyPeopleRole}
                      onChange={e => setKeyPeopleRole(e.target.value)}
                      placeholder="e.g. Spouse / Manager — ongoing role disputes and lack of emotional validation"
                      className="w-full px-3 py-2 rounded-lg border bg-background"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">
                      Client Goals
                    </label>
                    <input
                      value={clientGoals}
                      onChange={e => setClientGoals(e.target.value)}
                      placeholder="e.g. Rebuild social support, practice communication boundaries"
                      className="w-full px-3 py-2 rounded-lg border bg-background"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">
                      Plan for the next week (including goals)
                    </label>
                    <textarea
                      value={nextWeekPlan}
                      onChange={e => setNextWeekPlan(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border bg-background resize-none"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">
                      If client did not come, state action to contact client. If dropped out, state reason
                    </label>
                    <textarea
                      value={missedActionNotes}
                      onChange={e => setMissedActionNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border bg-background resize-none"
                    />
                  </div>

                  <Button type="submit" className="w-full gap-2 shadow-sm">
                    <CheckCircle2 className="w-4 h-4" /> Save Facilitator Session Record
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Official Scoring Reference Table (Sheet 3) */}
            <Card className="border shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Facilitator Scoring Sheet & Protocol Guide (Sheet 3)
                </CardTitle>
                <CardDescription className="text-xs">
                  Official clinical interpretation, intervention protocol, and word-for-word client feedback script
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {FACILITATOR_SCORING_TIERS.map(tier => (
                  <div key={tier.range} className="p-3.5 rounded-xl border border-border/60 bg-card/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-primary">
                        Score {tier.range}
                      </span>
                      <Badge className={`text-[10px] ${severityColor(tier.severity)}`}>
                        {tier.severity}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground">Clinical Guidance:</p>
                      <p className="text-xs text-foreground font-medium mt-0.5">{tier.clinicalInterpretation}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-accent/30 border border-border/40 text-[11px]">
                      <p className="font-semibold text-primary mb-1">Scripted Message to Client:</p>
                      <blockquote className="italic text-muted-foreground leading-relaxed">
                        "{tier.messageToClient}"
                      </blockquote>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 5. EXCEL SYNC & EXPORT (All 5 Sheets) */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'excel_sync' && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <Card className="border shadow-lg">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                Excel Workbook Specification & Synchronization
              </CardTitle>
              <CardDescription className="text-xs">
                Matches the structure of "IPT-G Questionnaire and Dashboard 12.10.2026 (1).xlsx"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-xs">
              <div className="space-y-3">
                <p className="font-semibold text-foreground">Integrated Sheets in Workbook:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border bg-muted/20">
                    <p className="font-bold text-primary">1. Patient Demgraphic data</p>
                    <p className="text-muted-foreground text-[11px] mt-1">
                      Intake questionnaire with demographics, work mode, tenure, prior therapy, EAP support, and 9 PHQ-9 items.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border bg-muted/20">
                    <p className="font-bold text-primary">2. Facilitator sheet</p>
                    <p className="text-muted-foreground text-[11px] mt-1">
                      Session tracker across Sessions 1 to 8, problem area, key relations, goals, weekly plan, and dropout follow-up actions.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border bg-muted/20">
                    <p className="font-bold text-primary">3. Facilitator Scoring sheet</p>
                    <p className="text-muted-foreground text-[11px] mt-1">
                      5 clinical severity tiers (0-4 to 20-27), treatment protocols, and verbatim client communication scripts.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border bg-muted/20">
                    <p className="font-bold text-primary">4. Dashboard External</p>
                    <p className="text-muted-foreground text-[11px] mt-1">
                      Aggregated, de-identified metrics by organization, department, work mode, and score severity.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border bg-muted/20 sm:col-span-2">
                    <p className="font-bold text-primary">5. Dashboad confidential</p>
                    <p className="text-muted-foreground text-[11px] mt-1">
                      Confidential patient tracking roster with longitudinal scores (Pre-group, Week 4, Week 8) and individual session 1-8 attendance checkmarks.
                    </p>
                  </div>
                </div>
              </div>

              {importSummary && (
                <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-800 dark:text-green-200 text-xs">
                  <p className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Import Status
                  </p>
                  <p className="mt-1">{importSummary}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Button onClick={handleTriggerExport} className="w-full sm:w-auto gap-2">
                  <Download className="w-4 h-4" /> Download Complete Workbook (.xlsx)
                </Button>
                <label className="w-full sm:w-auto cursor-pointer">
                  <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                  <Button variant="outline" asChild className="w-full gap-2">
                    <span>
                      <Upload className="w-4 h-4" /> Re-Import Workbook
                    </span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
