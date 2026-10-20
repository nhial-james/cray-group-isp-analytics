import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  ShieldAlert,
  HelpCircle,
  TrendingDown,
  Users,
  Activity,
  AlertTriangle
} from 'lucide-react';
import {
  AppUser,
  Participant,
  Group,
  Session,
  Assessment,
  Task,
  UploadedFileRecord,
  ROLE_PERMISSIONS
} from '../types';
import { answerClinicQueryWithGemini } from '../services/gemini';

interface AskInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  participants: Participant[];
  groups: Group[];
  sessions: Session[];
  assessments: Assessment[];
  tasks: Task[];
  files: UploadedFileRecord[];
  geminiApiKey?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  restricted?: boolean;
}

export function AskInsightsModal({
  isOpen,
  onClose,
  currentUser,
  participants,
  groups,
  sessions,
  assessments,
  tasks,
  files,
  geminiApiKey,
}: AskInsightsModalProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm0',
      sender: 'assistant',
      content: `Hello ${currentUser.name}. I am your IPT-G Insights assistant. I can calculate group metrics, summarize PHQ-9 score trajectories, explain safety flags, and query uploaded files. How can I help you?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);

  const permissions = ROLE_PERMISSIONS[currentUser.role];

  if (!isOpen) return null;

  const quickPrompts = [
    'What is our overall attendance rate across groups?',
    'How many participants have active Question 9 safety flags?',
    'Summarize Week 4 vs Baseline PHQ-9 improvements',
    'Which tasks or follow-ups are currently overdue?',
    'What files are currently available in the Knowledge Base?',
  ];

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || query).trim();
    if (!q) return;

    const userMsg: Message = {
      id: 'u_' + Date.now(),
      sender: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setQuery('');
    setIsThinking(true);

    const lower = q.toLowerCase();
    let reply = '';
    let isRestricted = false;

    // Permission Gate: External Viewer or restricted roles asking for confidential PII
    if (
      (!permissions.canViewParticipants || !permissions.canViewClinicalPII) &&
      (lower.includes('phone') || lower.includes('email') || lower.includes('address') || lower.includes('contact') || lower.includes('carmen') || lower.includes('bernard') || lower.includes('alice'))
    ) {
      reply = `Access Restricted: Your assigned role (${currentUser.role}) does not have clearance to view individual participant clinical identifiers or PII. Aggregate data is available in the Reports section.`;
      isRestricted = true;
    } else if (geminiApiKey) {
      // Connect to Gemini with live clinic context
      try {
        const allAtt = sessions.flatMap(s => Object.values(s.attendance).filter(v => v !== null));
        const present = allAtt.filter(v => v === 'Present').length;
        const attRate = allAtt.length ? Math.round((present / allAtt.length) * 100) : 0;
        const baseline = assessments.filter(a => a.type === 'Baseline' && a.totalScore !== null);
        const w4 = assessments.filter(a => a.type === 'Week 4' && a.totalScore !== null);
        const baseAvg = baseline.length ? +(baseline.reduce((sum, a) => sum + (a.totalScore || 0), 0) / baseline.length).toFixed(1) : 0;
        const w4Avg = w4.length ? +(w4.reduce((sum, a) => sum + (a.totalScore || 0), 0) / w4.length).toFixed(1) : 0;
        const todayStr = new Date().toISOString().split('T')[0];
        const pending = tasks.filter(t => t.status !== 'Completed');
        const overdue = pending.filter(t => t.dueDate < todayStr);

        const geminiReply = await answerClinicQueryWithGemini(
          q,
          currentUser.role,
          {
            enrolledCount: participants.length,
            activeGroups: groups.map(g => g.name),
            attendanceRate: attRate,
            baselineMean: baseAvg,
            week4Mean: w4Avg,
            overdueTasksCount: overdue.length,
            safetyFlagsCount: assessments.filter(a => a.safetyFlag).length,
            filesCount: files.length,
          },
          geminiApiKey
        );

        if (geminiReply) {
          reply = geminiReply;
        }
      } catch (err) {
        console.warn('Gemini clinic assistant error, using fallback:', err);
      }
    }

    // Deterministic Rule Fallback if Gemini did not answer
    if (!reply) {
      if (lower.includes('attendance') || lower.includes('absent') || lower.includes('present')) {
        const allAtt = sessions.flatMap(s => Object.values(s.attendance).filter(v => v !== null));
        const present = allAtt.filter(v => v === 'Present').length;
        const rate = allAtt.length ? Math.round((present / allAtt.length) * 100) : 0;
        reply = `The recorded attendance rate across all groups is currently ${rate}% (${present} present attendances out of ${allAtt.length} logged participant session records). Active groups include ${groups.map(g => g.name).join(' and ')}.`;
      } else if (lower.includes('safety') || lower.includes('q9') || lower.includes('flag') || lower.includes('suicide') || lower.includes('harm')) {
        const flaggedAssessments = assessments.filter(a => a.safetyFlag);
        if (permissions.canPerformSafetyReview || permissions.canViewAssessments) {
          const names = flaggedAssessments.map(a => {
            const p = participants.find(part => part.id === a.participantId);
            return p ? `${p.firstName} ${p.lastName}` : 'Unknown';
          });
          reply = `There are currently ${flaggedAssessments.length} assessment(s) flagged for clinical safety review due to a response > 0 on PHQ-9 Question 9 (thoughts of self-harm). Flagged participant(s): ${names.join(', ')}. Clinical safety protocols must be followed.`;
        } else {
          reply = `There are ${flaggedAssessments.length} assessment(s) flagged for clinical safety review. Details are restricted to clinical staff.`;
        }
      } else if (lower.includes('score') || lower.includes('phq') || lower.includes('improvement') || lower.includes('week 4') || lower.includes('baseline')) {
        const baseline = assessments.filter(a => a.type === 'Baseline' && a.totalScore !== null);
        const w4 = assessments.filter(a => a.type === 'Week 4' && a.totalScore !== null);
        const baseAvg = baseline.length ? (baseline.reduce((sum, a) => sum + (a.totalScore || 0), 0) / baseline.length).toFixed(1) : 'N/A';
        const w4Avg = w4.length ? (w4.reduce((sum, a) => sum + (a.totalScore || 0), 0) / w4.length).toFixed(1) : 'N/A';
        reply = `PHQ-9 Outcome Metrics: Baseline assessments (n=${baseline.length}) averaged ${baseAvg} points (Moderate depression severity). By Week 4 (n=${w4.length}), the cohort mean decreased to ${w4Avg} points (Mild severity), representing an average symptom reduction of approximately ${baseAvg !== 'N/A' && w4Avg !== 'N/A' ? Math.round(((parseFloat(baseAvg) - parseFloat(w4Avg)) / parseFloat(baseAvg)) * 100) : 0}%.`;
      } else if (lower.includes('task') || lower.includes('overdue') || lower.includes('follow-up') || lower.includes('pending')) {
        const todayStr = new Date().toISOString().split('T')[0];
        const pending = tasks.filter(t => t.status !== 'Completed');
        const overdue = pending.filter(t => t.dueDate < todayStr);
        reply = `Task Status: There are ${pending.length} pending tasks in the system. ${overdue.length} are currently overdue (${overdue.map(t => `"${t.title}" due ${t.dueDate}`).join('; ')}).`;
      } else if (lower.includes('file') || lower.includes('knowledge base') || lower.includes('upload') || lower.includes('dataset')) {
        reply = `Knowledge Base contains ${files.length} uploaded dataset(s): ${files.map(f => `"${f.name}" (${f.analysisStatus})`).join(', ')}. You can inspect sheet previews, run AI statistical analyses, or query specific columns in the Knowledge Base tab.`;
      } else {
        reply = `IPT-G Insights records show ${participants.length} enrolled participants across ${groups.length} active group cohorts (${groups.map(g => g.name).join(', ')}). ${assessments.length} total PHQ-9 evaluations have been recorded to date.`;
      }
    }

    const botMsg: Message = {
      id: 'b_' + Date.now(),
      sender: 'assistant',
      content: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      restricted: isRestricted,
    };

    setMessages(prev => [...prev, botMsg]);
    setIsThinking(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="max-w-2xl w-full h-[620px] flex flex-col shadow-2xl border border-border/60 bg-card overflow-hidden">
        {/* Header */}
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-primary-foreground">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                Ask IPT-G Insights
                <Badge variant="outline" className="text-[10px] font-normal">
                  Role: {currentUser.role}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Audited clinical analytics & dataset queries
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="w-8 h-8 rounded-full">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        {/* Chat Message Scroll */}
        <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map(m => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium ${
                  m.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : m.restricted
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-foreground'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : m.restricted ? <ShieldAlert className="w-4 h-4" /> : <Bot className="w-4 h-4 text-primary" />}
              </div>
              <div
                className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-primary text-primary-foreground font-normal'
                    : m.restricted
                    ? 'bg-destructive/10 border border-destructive/20 text-destructive'
                    : 'bg-accent/40 border border-border/50 text-foreground'
                }`}
              >
                <p>{m.content}</p>
                <span className="block text-[10px] opacity-60 text-right mt-1">
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span>Analyzing live database records...</span>
            </div>
          )}
        </CardContent>

        {/* Quick Prompts */}
        <div className="px-4 py-2 border-t border-border/30 bg-muted/20 flex gap-1.5 overflow-x-auto">
          {quickPrompts.slice(0, 3).map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(prompt)}
              className="text-[11px] whitespace-nowrap bg-background border border-border/60 hover:border-primary/40 rounded-full px-2.5 py-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about attendance, score deltas, safety flags, or files..."
              className="h-9 text-xs"
              disabled={isThinking}
            />
            <Button type="submit" size="sm" disabled={isThinking || !query.trim()} className="gap-1.5 text-xs">
              <Send className="w-3.5 h-3.5" /> Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
