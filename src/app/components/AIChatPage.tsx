import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger
} from './ui/dialog';
import {
  Send, Bot, User, Sparkles, RefreshCw, Copy, Check, Trash2,
  Download, Database, ChevronRight, HelpCircle, AlertCircle, Plus,
  MessageSquare, FileText, Key, ExternalLink, ShieldCheck, Zap
} from 'lucide-react';
import { ISPFullDataset, AppUser, SystemSettings } from '../types';
import { queryGeminiInsights, testGeminiConnection } from '../services/gemini';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: string[];
}

interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

interface AIChatPageProps {
  dataset: ISPFullDataset;
  currentUser: AppUser;
  geminiApiKey: string;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  systemSettings?: SystemSettings;
}

const SUGGESTED_PROMPTS = [
  "Summarize total voucher revenue, volume and ARPU",
  "Which base station delivers the highest profitability?",
  "Analyze top subscriber 254745754571 purchase habits",
  "How can we boost voucher sales at Mumias & Juja stations?",
  "What is the stickiness comparison between 5GB Daily and 3GB 6hrs?",
  "Forecast next quarter voucher demand and growth strategy"
];

function FormattedMessage({ text }: { text: string }) {
  const lines = text.split('\n');

  const formatInline = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-muted/80 text-primary font-mono text-[11px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-2 text-xs leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        if (trimmed.startsWith('#### ')) {
          return (
            <h5 key={idx} className="font-bold text-xs text-primary mt-2.5 mb-1">
              {formatInline(trimmed.replace(/^####\s+/, ''))}
            </h5>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-sm text-foreground mt-3 mb-1 border-b border-border/40 pb-1">
              {formatInline(trimmed.replace(/^###\s+/, ''))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-bold text-sm text-primary mt-3.5 mb-1.5 border-b border-border/50 pb-1">
              {formatInline(trimmed.replace(/^##\s+/, ''))}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="font-extrabold text-base text-foreground mt-4 mb-2">
              {formatInline(trimmed.replace(/^#\s+/, ''))}
            </h2>
          );
        }

        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          // Render markdown table line
          const cols = trimmed.split('|').filter((_, cIdx, arr) => cIdx > 0 && cIdx < arr.length - 1);
          if (trimmed.includes('---')) {
            return null; // Header separator
          }
          return (
            <div key={idx} className="grid grid-cols-6 gap-1 bg-muted/30 px-2 py-1 rounded text-[11px] font-mono border border-border/30 my-0.5">
              {cols.map((col, cI) => (
                <span key={cI} className={`truncate ${cI === 0 ? 'font-bold text-foreground col-span-2' : 'col-span-1 text-right'}`}>
                  {col.trim()}
                </span>
              ))}
            </div>
          );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-primary font-bold select-none">&bull;</span>
              <span className="flex-1 text-foreground/90">{formatInline(trimmed.replace(/^[-*]\s+/, ''))}</span>
            </div>
          );
        }

        if (/^\d+\.\s/.test(trimmed)) {
          const num = trimmed.match(/^(\d+)\./)?.[1] || '1';
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-primary font-semibold text-[11px] select-none">{num}.</span>
              <span className="flex-1 text-foreground/90">{formatInline(trimmed.replace(/^\d+\.\s+/, ''))}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="text-foreground/90">
            {formatInline(line)}
          </p>
        );
      })}
    </div>
  );
}

export function AIChatPage({
  dataset,
  currentUser,
  geminiApiKey,
  showToast,
  systemSettings,
}: AIChatPageProps) {
  const [localApiKey, setLocalApiKey] = useState<string>(() => {
    return localStorage.getItem('cray_gemini_api_key') || geminiApiKey || '';
  });
  const [tempApiKey, setTempApiKey] = useState(localApiKey);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [threads, setThreads] = useState<ChatThread[]>(() => {
    return [
      {
        id: 't_isp_1',
        title: 'Cray Group System Overview',
        createdAt: 'Today',
        updatedAt: 'Just now',
        messages: [
          {
            id: 'm1',
            sender: 'assistant',
            text: `Hello ${currentUser.name}! I am your **Cray Group AI Network & Commercial Copilot**.\n\nI have complete real-time access to the **14 connected ISP data points**, including voucher revenue (**${dataset.summary.totalRevenueFormatted}**), **${dataset.summary.totalVouchers.toLocaleString()} vouchers sold**, active hotspot stations (**${dataset.stations.length} stations**), and subscriber retention metrics.\n\nHow can I assist your network planning or sales analysis today?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources: ['Cray-Group-Sales-Analytics-Report.xlsx', 'Cray Group ISP Core DB']
          }
        ]
      }
    ];
  });

  const [activeThreadId, setActiveThreadId] = useState<string>('t_isp_1');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeThread?.messages]);

  const handleTestKey = async () => {
    if (!tempApiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter a key to test' });
      return;
    }
    setIsTestingKey(true);
    setTestResult(null);
    try {
      const res = await testGeminiConnection(tempApiKey.trim());
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection test failed' });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSaveApiKey = () => {
    const trimmed = tempApiKey.trim();
    setLocalApiKey(trimmed);
    localStorage.setItem('cray_gemini_api_key', trimmed);
    setIsKeyModalOpen(false);
    showToast?.(trimmed ? 'Gemini API Key saved and activated' : 'Reverted to Autonomous Telecom Engine', 'success');
  };

  const handleSendMessage = async (msgToSend?: string) => {
    const text = (msgToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'm_' + Math.random().toString(36).slice(2, 9),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setThreads(prev => prev.map(t => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          messages: [...t.messages, userMsg],
          updatedAt: 'Just now',
        };
      }
      return t;
    }));

    setInputMessage('');
    setIsLoading(true);

    try {
      // Small 350ms delay to give a smooth analytical typing transition
      await new Promise(r => setTimeout(r, 350));

      const res = await queryGeminiInsights({
        query: text,
        dataset,
        currentUser,
        apiKey: localApiKey,
      });

      const assistantMsg: ChatMessage = {
        id: 'm_' + Math.random().toString(36).slice(2, 9),
        sender: 'assistant',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: res.sources,
      };

      setThreads(prev => prev.map(t => {
        if (t.id === activeThreadId) {
          return {
            ...t,
            messages: [...t.messages, assistantMsg],
            updatedAt: 'Just now',
          };
        }
        return t;
      }));
    } catch (err: any) {
      showToast?.(`AI response error: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewThread = () => {
    const newId = 't_' + Math.random().toString(36).slice(2, 9);
    const newThread: ChatThread = {
      id: newId,
      title: 'New ISP Analysis Session',
      createdAt: 'Just now',
      updatedAt: 'Just now',
      messages: [
        {
          id: 'm_init',
          sender: 'assistant',
          text: 'New session started. Ask any question regarding vouchers, ARPU, station performance, or subscriber retention.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]
    };
    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newId);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast?.('Message copied to clipboard', 'info');
  };

  const handleExportSession = () => {
    const thread = activeThread;
    const content = `# Cray Group ISP AI Copilot — Analysis Transcript\nSession: ${thread.title}\nDate: ${new Date().toLocaleDateString()}\n\n` +
      thread.messages.map(m => `### ${m.sender === 'user' ? '👤 ' + currentUser.name : '🤖 Cray Group AI Copilot'} (${m.timestamp})\n\n${m.text}\n\n${m.sources ? `*Sources: ${m.sources.join(', ')}*\n\n` : ''}`).join('---\n\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cray-isp-ai-session-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast?.('Session transcript downloaded as Markdown', 'success');
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4">
      {/* Left Sidebar: Session Threads */}
      <div className="w-full md:w-64 flex flex-col gap-3 shrink-0">
        <Button
          onClick={handleCreateNewThread}
          className="w-full text-xs h-9 gap-2 bg-[#243542] hover:bg-[#1a2630] text-white font-semibold ring-1 ring-[#3db7e4]/40"
        >
          <Plus className="w-4 h-4 text-[#3db7e4]" /> New Analysis Session
        </Button>

        <Card className="flex-1 border border-border/70 rounded-xl overflow-hidden flex flex-col bg-card">
          <div className="p-3 border-b border-border/50 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Active Sessions</span>
            <span className="text-[10px] text-primary">{threads.length}</span>
          </div>
          <div className="p-2 space-y-1 overflow-y-auto flex-1">
            {threads.map(t => (
              <div
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                className={`p-2.5 rounded-lg text-xs cursor-pointer transition-all flex items-center justify-between ${
                  t.id === activeThreadId
                    ? 'bg-[#243542] text-white font-semibold shadow-xs ring-1 ring-[#3db7e4]/40'
                    : 'hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${t.id === activeThreadId ? 'text-[#3db7e4]' : 'text-muted-foreground'}`} />
                  <span className="truncate">{t.title}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2 border-t border-border/40">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSession}
              className="w-full text-xs h-8 gap-1.5 border-border/60"
            >
              <Download className="w-3.5 h-3.5 text-primary" /> Export Session
            </Button>
          </div>
        </Card>
      </div>

      {/* Main Chat Interface */}
      <Card className="flex-1 border border-border/70 rounded-xl overflow-hidden flex flex-col bg-card shadow-sm">
        {/* Chat Header */}
        <div className="p-4 border-b border-border/50 flex flex-wrap items-center justify-between gap-2 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#243542] text-[#3db7e4] flex items-center justify-center ring-1 ring-[#3db7e4]/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-foreground flex items-center gap-2">
                <span>Cray Group ISP AI Copilot</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <p className="text-[10px] text-muted-foreground">Connected to Cray-Group-Sales-Analytics & Live DB</p>
            </div>
          </div>

          {/* Engine Status / Key Config Button */}
          <Dialog open={isKeyModalOpen} onOpenChange={setIsKeyModalOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                  localApiKey
                    ? 'bg-[#3db7e4]/10 text-[#3db7e4] border-[#3db7e4]/30 hover:bg-[#3db7e4]/20'
                    : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20'
                }`}
                title="Click to configure Gemini API Key"
              >
                {localApiKey ? (
                  <>
                    <Key className="w-3 h-3 text-[#3db7e4]" />
                    <span>Gemini 2.5 Cloud Active</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3 text-emerald-500" />
                    <span>Autonomous Telecom Engine Active</span>
                  </>
                )}
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Configure AI Intelligence Engine
                </DialogTitle>
                <DialogDescription className="text-xs">
                  The Cray Group AI Copilot works automatically using its built-in Autonomous Telecom Engine. You can also connect your Google Gemini Cloud API Key for cloud-hosted LLM generation.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Google Gemini API Key</label>
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full text-xs px-3 py-2 rounded-lg border border-border/70 bg-muted/30 outline-none focus:border-primary"
                  />
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span>Keys are stored locally in your browser. Leave blank to use the built-in Telecom Engine.</span>
                  </p>
                </div>

                {testResult && (
                  <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
                    testResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 'bg-destructive/10 border-destructive/30 text-destructive'
                  }`}>
                    {testResult.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{testResult.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestKey}
                    disabled={isTestingKey || !tempApiKey.trim()}
                    className="text-xs h-8"
                  >
                    {isTestingKey ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                    Test Connection
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsKeyModalOpen(false)}
                      className="text-xs h-8"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveApiKey}
                      className="text-xs h-8 bg-primary text-primary-foreground font-semibold"
                    >
                      Save Key
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {activeThread.messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 group ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-[#243542] text-[#3db7e4] flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-[#3db7e4]/30">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-3.5 text-xs shadow-xs relative ${
                  m.sender === 'user'
                    ? 'bg-[#243542] text-white font-medium rounded-tr-xs ring-1 ring-[#3db7e4]/40'
                    : 'bg-muted/40 border border-border/50 rounded-tl-xs'
                }`}
              >
                {m.sender === 'user' ? (
                  <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                ) : (
                  <FormattedMessage text={m.text} />
                )}

                <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-border/20 text-[9px] opacity-70">
                  <span>{m.timestamp}</span>
                  <div className="flex items-center gap-2">
                    {m.sources && (
                      <span className="italic truncate max-w-[200px]">Sources: {m.sources.join(', ')}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(m.id, m.text)}
                      className="opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity"
                      title="Copy text"
                    >
                      {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#243542] text-[#3db7e4] flex items-center justify-center shrink-0 ring-1 ring-[#3db7e4]/30">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-muted/40 border border-border/50 rounded-xl p-3 text-xs text-muted-foreground flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3db7e4] animate-ping" />
                <span>Computing real-time telecommunications intelligence...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Pill Row */}
        <div className="px-4 py-2 border-t border-border/40 bg-muted/10 overflow-x-auto flex items-center gap-2">
          {SUGGESTED_PROMPTS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(p)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-background border border-border/60 hover:border-primary text-muted-foreground hover:text-foreground transition-all shrink-0"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 border-t border-border/50 bg-background flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask anything: vouchers, base station revenues, ARPU, subscriber spend..."
            className="flex-1 text-xs bg-muted/30 border border-border/60 rounded-lg px-3 py-2 outline-none focus:border-primary"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!inputMessage.trim() || isLoading}
            className="h-8 px-4 bg-[#243542] hover:bg-[#1a2630] text-[#3db7e4] font-semibold border border-[#3db7e4]/40 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
