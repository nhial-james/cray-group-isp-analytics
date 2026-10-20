import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  ClipboardList, Plus, Search, Filter, Download, FileSpreadsheet,
  FileText, Printer, CheckCircle2, AlertTriangle, ShieldAlert,
  ChevronDown, X, Eye, Edit2, Calendar, UserCheck, Share2, Copy, Check, ExternalLink, Trash2
} from 'lucide-react';
import {
  Assessment, Participant, AppUser, AssessmentType,
  PHQ9_QUESTIONS, PHQ9_OPTIONS, scoreSeverity, severityColor,
  IPT_PROBLEM_AREAS, WORK_MODES, MENTAL_HEALTH_SUPPORTS, SystemSettings
} from '../types';
import * as XLSX from 'xlsx';

interface AssessmentsPageProps {
  assessments: Assessment[];
  participants: Participant[];
  currentUser: AppUser;
  onSaveAssessment: (a: Assessment, p?: Participant) => void;
  onDeleteAssessment?: (id: string) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  systemSettings?: SystemSettings;
}

export function AssessmentsPage({
  assessments,
  participants,
  currentUser,
  onSaveAssessment,
  onDeleteAssessment,
  showToast,
  systemSettings,
}: AssessmentsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPublicSurveyMode, setIsPublicSurveyMode] = useState(false);
  const [selectedAssessmentForView, setSelectedAssessmentForView] = useState<Assessment | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State: Written from scratch (NO existing participant dropdowns)
  const [participantName, setParticipantName] = useState('');
  const [participantRole, setParticipantRole] = useState('');
  const [organization, setOrganization] = useState('NHS Primary Care Network');
  const [department, setDepartment] = useState('');
  const [age, setAge] = useState<string>('36');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Non-binary' | 'Prefer not to say'>('Female');
  const [workMode, setWorkMode] = useState<'On-site' | 'Hybrid' | 'Remote' | 'Multiple-sites'>('Hybrid');
  const [tenure, setTenure] = useState('2 years');
  const [prevIndTherapy, setPrevIndTherapy] = useState<'Yes' | 'No' | 'Currently in therapy'>('No');
  const [prevGrpTherapy, setPrevGrpTherapy] = useState<'Yes' | 'No'>('No');
  const [currentSupport, setCurrentSupport] = useState<'None' | 'EAP' | 'External therapist' | 'On medication'>('None');

  // Assessment metadata
  const [assessmentTitle, setAssessmentTitle] = useState('Baseline Intake');
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [problemArea, setProblemArea] = useState<'Grief & loss' | 'Disputes' | 'Life changes' | 'Loneliness/social isolation'>('Life changes');
  const [peopleInvolved, setPeopleInvolved] = useState('');
  const [clientGoals, setClientGoals] = useState('');
  const [nextWeekPlan, setNextWeekPlan] = useState('');
  const [facilitatorNotes, setFacilitatorNotes] = useState('');

  // PHQ-9 9 Items
  const [phqAnswers, setPhqAnswers] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0]);

  // Live computed score and tier
  const totalScore = useMemo(() => {
    return phqAnswers.reduce((sum, val) => sum + val, 0);
  }, [phqAnswers]);

  const severity = useMemo(() => {
    return scoreSeverity(totalScore);
  }, [totalScore]);

  const hasSafetyFlag = phqAnswers[8] > 0; // Question 9

  const resetForm = () => {
    setParticipantName('');
    setParticipantRole('');
    setOrganization('NHS Primary Care Network');
    setDepartment('');
    setAge('36');
    setDob('');
    setGender('Female');
    setWorkMode('Hybrid');
    setTenure('2 years');
    setPrevIndTherapy('No');
    setPrevGrpTherapy('No');
    setCurrentSupport('None');
    setAssessmentTitle('Baseline Intake');
    setAssessmentDate(new Date().toISOString().split('T')[0]);
    setProblemArea('Life changes');
    setPeopleInvolved('');
    setClientGoals('');
    setNextWeekPlan('');
    setFacilitatorNotes('');
    setPhqAnswers([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  };

  const handleSaveAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantName.trim()) {
      showToast?.('Please write down the participant name', 'error');
      return;
    }

    const newParticipantId = 'p_' + Date.now();
    const newAssessmentId = 'a_' + Date.now();

    const nameParts = participantName.trim().split(' ');
    const firstName = nameParts[0] || participantName.trim();
    const lastName = nameParts.slice(1).join(' ') || '';

    const newParticipant: Participant = {
      id: newParticipantId,
      firstName,
      lastName,
      dob: dob || '1990-01-01',
      age: parseInt(age) || 35,
      gender,
      phone: '',
      email: '',
      referralSource: 'Clinical Assessment',
      groupIds: [],
      status: 'Active',
      enrollmentDate: assessmentDate,
      notes: facilitatorNotes || '',
      organization: organization || 'NHS Trust',
      department: department || '',
      role: participantRole || '',
      workMode: workMode || 'Hybrid',
      tenure: tenure || '2 years',
      previousIndividualTherapy: prevIndTherapy,
      previousGroupTherapy: prevGrpTherapy,
      currentMentalHealthSupport: currentSupport,
      problemArea: problemArea || 'Life changes',
      keyPeopleAndRole: peopleInvolved || '',
      goals: clientGoals || '',
      nextWeekPlan: nextWeekPlan || '',
      missedSessionAction: '',
    };

    const createdAssessment: Assessment = {
      id: newAssessmentId,
      participantId: newParticipantId,
      date: assessmentDate,
      type: (assessmentTitle.includes('Week 4') ? 'Week 4' : assessmentTitle.includes('Week 8') ? 'Week 8' : 'Baseline') as AssessmentType,
      responses: phqAnswers,
      totalScore,
      severity,
      safetyFlag: hasSafetyFlag,
      completedBy: currentUser?.name || 'Clinical Lead',
      safetyReviewed: !hasSafetyFlag,
      safetyNotes: hasSafetyFlag ? 'Safety review protocol initiated for Question 9 endorsement.' : undefined,
    };

    onSaveAssessment(createdAssessment, newParticipant);
    resetForm();
    setIsCreateModalOpen(false);
    setIsPublicSurveyMode(false);
    showToast?.(`Clinical assessment for "${participantName}" recorded and synced to dashboard!`, 'success');
  };

  // Filtered Assessments List
  const filteredAssessments = useMemo(() => {
    return assessments.filter(a => {
      const p = participants.find(part => part.id === a.participantId);
      const nameMatch = p ? `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      const typeMatch = filterType === 'All' || a.type === filterType;
      return nameMatch && typeMatch;
    });
  }, [assessments, participants, searchQuery, filterType]);

  // Share Survey Link
  const surveyUrl = window.location.origin + window.location.pathname + '?mode=assessment_survey';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(surveyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    showToast?.('Survey link copied to clipboard!', 'success');
  };

  // Printable PDF
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    const primary = systemSettings?.primaryColor || '#4f46e5';
    const logo = systemSettings?.companyLogo;
    const org = systemSettings?.organizationName || 'NHS Trust';
    const app = systemSettings?.appName || 'IPT-G Insights';
    const slogan = systemSettings?.slogan || 'Evidence-Based Group Interpersonal Therapy Outcomes';
    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const rowsHtml = filteredAssessments.map(a => {
      const p = participants.find(part => part.id === a.participantId);
      const name = p ? `${p.firstName} ${p.lastName}` : 'Participant';
      return `
        <tr>
          <td><strong>${name}</strong></td>
          <td>${p?.organization || 'NHS Trust'}</td>
          <td>${p?.problemArea || 'Life changes'}</td>
          <td style="text-align: center;">${a.type}</td>
          <td style="text-align: center;">${a.date}</td>
          <td style="text-align: center; font-weight: bold; color: ${primary};">${a.totalScore}</td>
          <td style="text-align: center;">${a.severity}</td>
          <td style="text-align: center;">${a.safetyFlag ? '<span style="color: #dc2626; font-weight: bold;">Safety Review (Q9>0)</span>' : 'Clear'}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${org} - PHQ-9 Assessments Report</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 15px; font-size: 9.5pt; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          th { background: #f1f5f9; color: #0f172a; padding: 7px; text-align: left; border: 1px solid #cbd5e1; font-size: 8.5pt; font-weight: 600; }
          td { padding: 6px 7px; border: 1px solid #cbd5e1; font-size: 8.5pt; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div style="border-bottom: 2px solid ${primary}; padding-bottom: 12px; margin-bottom: 16px;">
          <table style="width: 100%; border: none;">
            <tr>
              ${logo ? `<td style="width: 60px; border: none; padding-right: 12px;"><img src="${logo}" style="max-height: 50px; max-width: 55px; object-fit: contain;" /></td>` : ''}
              <td style="border: none;">
                <div style="font-size: 14pt; font-weight: bold; color: ${primary};">${app}</div>
                <div style="font-size: 9.5pt; font-weight: 600; color: #374151;">${org}</div>
                <div style="font-size: 8pt; color: #64748b; font-style: italic;">${slogan}</div>
              </td>
              <td style="text-align: right; border: none;">
                <div style="font-size: 8.5pt; color: #64748b;">Report Date: ${dateStr}</div>
                <div style="font-size: 8.5pt; color: #64748b;">Total Assessments: ${filteredAssessments.length}</div>
              </td>
            </tr>
          </table>
        </div>
        <table>
          <thead>
            <tr>
              <th>Participant</th>
              <th>Organization</th>
              <th>Problem Area</th>
              <th style="text-align: center;">Timepoint</th>
              <th style="text-align: center;">Date</th>
              <th style="text-align: center;">PHQ-9 Score</th>
              <th style="text-align: center;">Severity Tier</th>
              <th style="text-align: center;">Safety Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <script>
          document.title = "${org} - Assessments Report";
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card border border-border/70 rounded-xl p-3.5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">Clinical PHQ-9 Assessments</h2>
            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
              {filteredAssessments.length} Records
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Administer clinical questionnaires from scratch or distribute a shareable survey link.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Share Survey Link Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsShareModalOpen(true)}
            className="text-xs gap-1.5 h-8 font-medium border-border/80"
          >
            <Share2 className="w-3.5 h-3.5 text-primary" /> Share Survey Link
          </Button>

          {/* Create New Assessment Button */}
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="text-xs gap-1.5 h-8 bg-primary text-primary-foreground font-semibold shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> New Assessment
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handlePrintPDF}
            className="text-xs gap-1.5 h-8 font-medium"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/70 rounded-xl p-3">
        <div className="flex items-center gap-2 w-full sm:w-72 bg-background border border-border rounded-lg px-2.5 py-1.5">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by participant name..."
            className="bg-transparent border-none outline-none text-xs w-full text-foreground"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-muted-foreground font-medium">Timepoint:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs bg-background border border-border rounded-lg p-1.5 font-medium cursor-pointer"
          >
            <option value="All">All Timepoints</option>
            <option value="Baseline">Baseline</option>
            <option value="Week 4">Week 4</option>
            <option value="Week 8">Week 8</option>
          </select>
        </div>
      </div>

      {/* Assessments Records Table */}
      <div className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border/60 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Participant</th>
                <th className="py-2.5 px-3 font-semibold">Timepoint</th>
                <th className="py-2.5 px-3 font-semibold">Date</th>
                <th className="py-2.5 px-3 font-semibold text-center">Score</th>
                <th className="py-2.5 px-3 font-semibold">Severity</th>
                <th className="py-2.5 px-3 font-semibold text-center">Safety Review</th>
                <th className="py-2.5 px-3 font-semibold">Completed By</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredAssessments.length > 0 ? (
                filteredAssessments.map(a => {
                  const p = participants.find(part => part.id === a.participantId);
                  const name = p ? `${p.firstName} ${p.lastName}` : 'Participant';
                  return (
                    <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2 px-3 font-medium text-foreground">{name}</td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-[10px] font-medium">
                          {a.type}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">{a.date}</td>
                      <td className="py-2 px-3 text-center font-bold text-sm text-primary">
                        {a.totalScore}
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="secondary" className="text-[10px]">
                          {a.severity}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {a.safetyFlag ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive">
                            <ShieldAlert className="w-3.5 h-3.5" /> Flagged (Q9&gt;0)
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-medium">Clear</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">{a.completedBy}</td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedAssessmentForView(a)}
                            className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                            title="View Assessment Details"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View
                          </Button>
                          {onDeleteAssessment && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onDeleteAssessment(a.id)}
                              className="h-7 w-7 p-0 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Delete Assessment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">No Clinical Assessments Recorded Yet</span>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        No dummy data is shown. Create a new clinical assessment from scratch or share the survey link so participant responses appear automatically here and in the dashboard.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => {
                            resetForm();
                            setIsCreateModalOpen(true);
                          }}
                          className="text-xs gap-1.5 h-7 bg-primary text-primary-foreground font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5" /> Create Assessment
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsShareModalOpen(true)}
                          className="text-xs gap-1.5 h-7 font-medium"
                        >
                          <Share2 className="w-3.5 h-3.5" /> Share Survey Link
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Share Survey Link Modal ─── */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/80 rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Share Clinical Survey Link</h3>
                  <p className="text-[11px] text-muted-foreground">Distribute to clients for self-administered intake</p>
                </div>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground block">
                Direct Assessment & Feedback Link:
              </label>
              <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-2">
                <input
                  type="text"
                  readOnly
                  value={surveyUrl}
                  className="bg-transparent border-none outline-none text-xs flex-1 text-muted-foreground select-all font-mono"
                />
                <Button
                  size="sm"
                  onClick={handleCopyLink}
                  className="h-7 px-2.5 text-xs bg-primary text-primary-foreground gap-1"
                >
                  {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedLink ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Clients can access this link securely on mobile or desktop without needing a login account.
              </p>
            </div>

            <div className="pt-2 border-t border-border/50 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsShareModalOpen(false);
                  setIsPublicSurveyMode(true);
                  setIsCreateModalOpen(true);
                }}
                className="text-xs gap-1.5 h-8 text-primary"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Preview Participant Form
              </Button>
              <Button
                size="sm"
                onClick={() => setIsShareModalOpen(false)}
                className="text-xs h-8"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Create Assessment / Survey Form Modal (NO Dropdowns, Write Everything from Scratch) ─── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-card border border-border/80 rounded-xl shadow-2xl max-w-2xl w-full p-5 my-6 max-h-[90vh] overflow-y-auto space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  {isPublicSurveyMode ? 'Participant Self-Administered Clinical Survey' : 'Create New Assessment from Scratch'}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Complete demographic details, IPT problem area, and 9-item PHQ-9 depression questionnaire.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAssessment} className="space-y-4 text-xs">
              {/* Section 1: Participant Demographic Data (from gp.xlsx) */}
              <div className="p-3 rounded-lg border border-border/70 bg-muted/15 space-y-3">
                <span className="font-bold text-xs text-foreground block uppercase tracking-wider text-[10px]">
                  1. Participant Demographic & Employment Profile (gp.xlsx)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">
                      Participant Name / Identifier *
                    </label>
                    <input
                      type="text"
                      required
                      value={participantName}
                      onChange={(e) => setParticipantName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins or Client P101"
                      className="w-full p-2 rounded-lg border bg-background text-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">
                      Job Role / Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={participantRole}
                      onChange={(e) => setParticipantRole(e.target.value)}
                      placeholder="e.g. Senior Care Coordinator"
                      className="w-full p-2 rounded-lg border bg-background text-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">
                      Organization / Trust
                    </label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. NHS Primary Care Network"
                      className="w-full p-2 rounded-lg border bg-background text-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Community Nursing"
                      className="w-full p-2 rounded-lg border bg-background text-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">
                      Age & Gender
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="Age"
                        className="w-20 p-2 rounded-lg border bg-background text-foreground outline-none"
                      />
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className="flex-1 p-2 rounded-lg border bg-background text-foreground outline-none cursor-pointer"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">
                      Work Mode (gp.xlsx)
                    </label>
                    <select
                      value={workMode}
                      onChange={(e) => setWorkMode(e.target.value as any)}
                      className="w-full p-2 rounded-lg border bg-background text-foreground outline-none cursor-pointer"
                    >
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                      <option value="Remote">Remote</option>
                      <option value="Multiple-sites">Multiple-sites</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">
                      Tenure at Company
                    </label>
                    <input
                      type="text"
                      value={tenure}
                      onChange={(e) => setTenure(e.target.value)}
                      placeholder="e.g. 2 years, 3-5 years"
                      className="w-full p-2 rounded-lg border bg-background text-foreground outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">
                      Current Mental Health Support
                    </label>
                    <select
                      value={currentSupport}
                      onChange={(e) => setCurrentSupport(e.target.value as any)}
                      className="w-full p-2 rounded-lg border bg-background text-foreground outline-none cursor-pointer"
                    >
                      <option value="None">None</option>
                      <option value="EAP">EAP (Employee Assistance)</option>
                      <option value="External therapist">External therapist</option>
                      <option value="On medication">On medication</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Assessment Focus & IPT Problem Area */}
              <div className="p-3 rounded-lg border border-border/70 bg-muted/15 space-y-3">
                <span className="font-bold text-xs text-foreground block uppercase tracking-wider text-[10px]">
                  2. Assessment Context & IPT Problem Focus
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">
                      Assessment Title / Timepoint *
                    </label>
                    <input
                      type="text"
                      required
                      value={assessmentTitle}
                      onChange={(e) => setAssessmentTitle(e.target.value)}
                      placeholder="e.g. Baseline Intake, Week 4, Week 8"
                      className="w-full p-2 rounded-lg border bg-background text-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">
                      Assessment Date
                    </label>
                    <input
                      type="date"
                      value={assessmentDate}
                      onChange={(e) => setAssessmentDate(e.target.value)}
                      className="w-full p-2 rounded-lg border bg-background text-foreground outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">
                      IPT Problem Area (gp.xlsx)
                    </label>
                    <select
                      value={problemArea}
                      onChange={(e) => setProblemArea(e.target.value as any)}
                      className="w-full p-2 rounded-lg border bg-background text-foreground outline-none cursor-pointer"
                    >
                      <option value="Life changes">Life changes</option>
                      <option value="Disputes">Role Disputes</option>
                      <option value="Grief & loss">Grief & loss</option>
                      <option value="Loneliness/social isolation">Loneliness / Social isolation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground block mb-1">
                    Key People & Role in Client&apos;s Depression (gp.xlsx)
                  </label>
                  <input
                    type="text"
                    value={peopleInvolved}
                    onChange={(e) => setPeopleInvolved(e.target.value)}
                    placeholder="e.g. Line manager interpersonal dispute, partner role transition"
                    className="w-full p-2 rounded-lg border bg-background text-foreground outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">
                      Client Goals (gp.xlsx)
                    </label>
                    <textarea
                      rows={2}
                      value={clientGoals}
                      onChange={(e) => setClientGoals(e.target.value)}
                      placeholder="State client goals for group therapy..."
                      className="w-full p-2 rounded-lg border bg-background text-foreground outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">
                      Plan for Next Week (gp.xlsx)
                    </label>
                    <textarea
                      rows={2}
                      value={nextWeekPlan}
                      onChange={(e) => setNextWeekPlan(e.target.value)}
                      placeholder="Next week action steps..."
                      className="w-full p-2 rounded-lg border bg-background text-foreground outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: PHQ-9 Questionnaire (Over the last 2 weeks) */}
              <div className="p-3 rounded-lg border border-border/70 bg-card space-y-3">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div>
                    <span className="font-bold text-xs text-foreground block uppercase tracking-wider text-[10px]">
                      3. PHQ-9 Depression Questionnaire (gp.xlsx)
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      Over the last 2 weeks, how often have you been bothered by any of the following problems?
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-foreground">Score: {totalScore} / 27</span>
                    <Badge variant="outline" className="ml-2 text-[10px] font-bold text-primary">
                      {severity}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {PHQ9_QUESTIONS.map((q, qIdx) => {
                    const isQ9 = qIdx === 8;
                    const val = phqAnswers[qIdx];
                    return (
                      <div
                        key={qIdx}
                        className={`p-2 rounded-lg border ${
                          isQ9 && val > 0
                            ? 'bg-destructive/10 border-destructive/30'
                            : 'bg-muted/15 border-border/50'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <span className="text-[11px] font-medium text-foreground">
                            {qIdx + 1}. {q}
                          </span>
                          {isQ9 && val > 0 && (
                            <Badge variant="destructive" className="text-[9px] py-0 px-1 shrink-0">
                              Safety Protocol
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {PHQ9_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                const next = [...phqAnswers];
                                next[qIdx] = opt.value;
                                setPhqAnswers(next);
                              }}
                              className={`p-1.5 rounded-md border text-[10px] font-medium text-center transition-all ${
                                val === opt.value
                                  ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                                  : 'bg-background hover:bg-muted text-muted-foreground border-border/60'
                              }`}
                            >
                              {opt.label} ({opt.value})
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sticky Action Buttons */}
              <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm flex justify-end gap-2 pt-3 pb-1 border-t border-border/50 z-10">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="h-8 px-4 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 px-5 text-xs bg-primary text-primary-foreground font-semibold shadow-md"
                >
                  Save & Complete Assessment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── View Assessment Details Modal ─── */}
      {selectedAssessmentForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/80 rounded-xl shadow-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <div>
                <h3 className="font-bold text-sm text-foreground">Assessment Record</h3>
                <p className="text-[10px] text-muted-foreground">{selectedAssessmentForView.date} · {selectedAssessmentForView.type}</p>
              </div>
              <button
                onClick={() => setSelectedAssessmentForView(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-muted/20 p-3 rounded-lg border border-border/50">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Total Score</span>
                  <span className="text-xl font-bold text-primary">{selectedAssessmentForView.totalScore} / 27</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Severity</span>
                  <span className="font-semibold text-foreground">{selectedAssessmentForView.severity}</span>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] mb-1">Safety Status</span>
                {selectedAssessmentForView.safetyFlag ? (
                  <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-semibold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    Question 9 Flagged (&gt;0) — Safety review required.
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[11px] font-medium">
                    Question 9 is 0 — No thoughts of self-harm reported.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border/50">
              <Button
                size="sm"
                onClick={() => setSelectedAssessmentForView(null)}
                className="text-xs h-8"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
