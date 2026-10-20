import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Send, Bot, User, Sparkles, RefreshCw, Copy, Check, Trash2,
  Download, Database, ChevronRight, HelpCircle, AlertCircle, Plus,
  MessageSquare, FileText, Printer, Wifi, Radio
} from 'lucide-react';
import { ISPFullDataset, AppUser, SystemSettings } from '../types';
import { queryGeminiInsights } from '../services/gemini';

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
  "Forecast next month's voucher demand based on weekly trend"
];

function FormattedMessage({ text }: { text: string }) {
  const lines = text.split('\n');

  const formatInline = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
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

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-primary font-bold select-none">&bull;</span>
              <span className="flex-1 text-foreground/90">{formatInline(trimmed.replace(/^[-*]\s+/, ''))}</span>
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeThread?.messages]);

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
      const res = await queryGeminiInsights({
        query: text,
        dataset,
        currentUser,
        apiKey: geminiApiKey,
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

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4">
      {/* Left Sidebar: Session Threads */}
      <div className="w-full md:w-64 flex flex-col gap-3 shrink-0">
        <Button
          onClick={handleCreateNewThread}
          className="w-full text-xs h-9 gap-2 bg-primary text-primary-foreground font-semibold"
        >
          <Plus className="w-4 h-4" /> New Analysis Session
        </Button>

        <Card className="flex-1 border border-border/70 rounded-xl overflow-hidden flex flex-col bg-card">
          <div className="p-3 border-b border-border/50 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Active Sessions
          </div>
          <div className="p-2 space-y-1 overflow-y-auto flex-1">
            {threads.map(t => (
              <div
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                className={`p-2.5 rounded-lg text-xs cursor-pointer transition-all flex items-center justify-between ${
                  t.id === activeThreadId
                    ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                    : 'hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.title}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Main Chat Interface */}
      <Card className="flex-1 border border-border/70 rounded-xl overflow-hidden flex flex-col bg-card shadow-sm">
        {/* Chat Header */}
        <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-foreground">Cray Group ISP AI Copilot</h3>
              <p className="text-[10px] text-muted-foreground">Connected to Cray-Group-Sales-Analytics & Live DB</p>
            </div>
          </div>

          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
            Telecom Intelligence
          </Badge>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {activeThread.messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-xl p-3.5 text-xs shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-primary text-primary-foreground font-medium rounded-tr-xs'
                    : 'bg-muted/40 border border-border/50 rounded-tl-xs'
                }`}
              >
                {m.sender === 'user' ? (
                  <p className="leading-relaxed">{m.text}</p>
                ) : (
                  <FormattedMessage text={m.text} />
                )}

                <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-border/20 text-[9px] opacity-70">
                  <span>{m.timestamp}</span>
                  {m.sources && (
                    <span className="italic">Sources: {m.sources.join(', ')}</span>
                  )}
                </div>
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-muted/40 border border-border/50 rounded-xl p-3 text-xs text-muted-foreground flex items-center gap-2">
                <span>Analyzing ISP metrics...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Pill Row */}
        <div className="px-4 py-2 border-t border-border/40 bg-muted/10 overflow-x-auto flex items-center gap-2">
          {SUGGESTED_PROMPTS.slice(0, 4).map((p, i) => (
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
        <div className="p-3 border-t border-border/50 bg-background flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about vouchers, base stations, ARPU, or subscriber retention..."
            className="flex-1 text-xs bg-muted/30 border border-border/60 rounded-lg px-3 py-2 outline-none focus:border-primary"
          />
          <Button
            size="sm"
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="h-8 px-3 bg-primary text-primary-foreground font-semibold"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
