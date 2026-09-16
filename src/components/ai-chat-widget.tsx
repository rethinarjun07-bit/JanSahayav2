"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MessageCircle, X, Send, Bot, User, Loader2, Mic,
  MicOff, Phone, Copy, Check, RefreshCw, ChevronDown, Sparkles,
  ArrowUpRight, AlertTriangle, ShieldCheck, MapPin, Activity, FileText, Globe
} from "lucide-react";
import { CopilotAction, CopilotCard } from "@/lib/copilot/types";
import { useLanguage } from "@/components/language-provider";

interface Message {
  role: "user" | "model";
  text: string;
  timestamp: Date;
  isDemo?: boolean;
  lang?: string;
  actions?: CopilotAction[];
  card?: CopilotCard;
  groundedSource?: string;
}

const TYPING_PHRASES_EN = [
  "Checking JanSahaya data...",
  "Querying local records...",
  "Analyzing civic signals...",
  "Preparing verified response...",
];

const TYPING_PHRASES_HI = [
  "जनसहाया डेटा जांच रहा हूँ...",
  "स्थानीय रिकॉर्ड खोज रहा हूँ...",
  "नागरिक संकेतों का विश्लेषण...",
  "सत्यापित उत्तर तैयार हो रहा है...",
];




export default function AIChatWidget() {
  const { t, language, setLanguage } = useLanguage();
  const isHindi = language === "hi";

  // Language-aware dynamic quick actions
  const QUICK_PROMPTS = isHindi ? [
    { text: "समस्या कैसे दर्ज करें?", emoji: "📝", key: "HOW_TO_REPORT" },
    { text: "मेरी समस्या ट्रैक करें", emoji: "📊", key: "TRACK_MY_REPORT" },
    { text: "जनसहाया क्या है?", emoji: "🏛️", key: "WHAT_IS_JANSAHAYA" },
    { text: "सत्यापन प्रक्रिया क्या है?", emoji: "✅", key: "VERIFICATION_WORKFLOW" },
    { text: "छात्र और शोधकर्ता कैसे जुड़ें?", emoji: "🎓", key: "STUDENT_HELP" },
    { text: "कंपनियां कैसे सहयोग कर सकती हैं?", emoji: "🏢", key: "CSR_SUPPORT" },
    { text: "भाषा बदलें (EN/HI)", emoji: "🌐", key: "CHANGE_LANGUAGE" },
  ] : [
    { text: "How do I report a problem?", emoji: "📝", key: "HOW_TO_REPORT" },
    { text: "Track my problem", emoji: "📊", key: "TRACK_MY_REPORT" },
    { text: "What is JanSahaya?", emoji: "🏛️", key: "WHAT_IS_JANSAHAYA" },
    { text: "How does verification work?", emoji: "✅", key: "VERIFICATION_WORKFLOW" },
    { text: "How can students help?", emoji: "🎓", key: "STUDENT_HELP" },
    { text: "How can companies support problems?", emoji: "🏢", key: "CSR_SUPPORT" },
    { text: "Change language (EN/HI)", emoji: "🌐", key: "CHANGE_LANGUAGE" },
  ];

  const TYPING_PHRASES = isHindi ? TYPING_PHRASES_HI : TYPING_PHRASES_EN;

  // Build welcome message from language-aware translations
  const buildWelcome = useCallback((hi: boolean): Message => ({
    role: "model",
    text: hi
      ? `🙏 **नमस्ते! मैं जनसहाया AI हूँ।**\n\nमैं झारखंड में नागरिक एवं आपदा समस्याओं को दर्ज करने, समझने और ट्रैक करने में आपकी सहायता करता हूँ।\n\n*ध्यान दें: यह प्रणाली स्वचालित विश्लेषण प्रदान करती है; वैधानिक निर्णय सदैव नामित सरकारी प्राधिकरणों द्वारा लिए जाते हैं।*\n\n**पूछ कर देखें:**\n• "मेरे गाँव के पास बाढ़ आ गई है"\n• "रांची में कौन सी सक्रिय समस्याएं हैं?"\n• "मेरी शिकायत कहाँ तक पहुँची?"`
      : `🙏 **Namaste! I'm JanSahaya AI.**\n\nI can help you report, understand and track civic & disaster problems across Jharkhand.\n\n*Note: This system provides automated analysis; statutory decisions are always made by designated Government Authorities.*\n\n**Try asking:**\n• "There is flooding near my village"\n• "Show problems in Ranchi"\n• "Where is my report?"`,
    timestamp: new Date(),
    lang: hi ? "hi" : "en",
    actions: hi ? [
      { label: "📝 समस्या दर्ज करें", url: "/challenges/new", variant: "primary" },
      { label: "📍 स्थानीय समस्याएं", prompt: "रांची में अभी क्या समस्याएं हैं?", variant: "outline" },
      { label: "📊 शिकायत ट्रैक करें", prompt: "मेरी शिकायत कहाँ तक पहुँची?", variant: "outline" },
      { label: "🚨 आपातकालीन सहायता", prompt: "मुझे तत्काल सहायता चाहिए", variant: "danger" },
    ] : [
      { label: "📝 Report Problem", url: "/challenges/new", variant: "primary" },
      { label: "📍 Find Local Problems", prompt: "What problems are active in Ranchi?", variant: "outline" },
      { label: "📊 Track My Report", prompt: "Where is my report?", variant: "outline" },
      { label: "🚨 Emergency Help", prompt: "I need emergency guidance", variant: "danger" },
    ],
  }), []);

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [buildWelcome(false)]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingPhrase, setTypingPhrase] = useState(TYPING_PHRASES_EN[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Conversational memory references
  const [previousIntent, setPreviousIntent] = useState<string | undefined>();
  const [previousEntities, setPreviousEntities] = useState<Record<string, unknown> | undefined>();

  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset welcome message and quick prompts when language changes
  useEffect(() => {
    setMessages([buildWelcome(isHindi)]);
    setPreviousIntent(undefined);
    setPreviousEntities(undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBtn(false);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (open && !minimized) scrollToBottom();
  }, [messages, open, minimized, scrollToBottom]);

  // Typing phrase rotation
  useEffect(() => {
    if (loading) {
      let i = 0;
      typingInterval.current = setInterval(() => {
        i = (i + 1) % TYPING_PHRASES.length;
        setTypingPhrase(TYPING_PHRASES[i]);
      }, 1400);
    } else {
      if (typingInterval.current) clearInterval(typingInterval.current);
    }
    return () => {
      if (typingInterval.current) clearInterval(typingInterval.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, language]);

  // Track scroll for show-more button
  const handleScroll = () => {
    if (!messagesRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };


  // Handle quick prompt chips — CHANGE_LANGUAGE is handled locally; all others are sent to the API
  const handleQuickPrompt = (text: string, key: string) => {
    if (key === "CHANGE_LANGUAGE") {
      const newLang = isHindi ? "en" : "hi";
      setLanguage(newLang);
      // Immediately show a confirmation message in the new language
      const confirmMsg: Message = {
        role: "model",
        text: newLang === "hi"
          ? "🌐 **भाषा परिवर्तित की गई: हिन्दी**\n\nअब आप हिंदी में प्रश्न पूछ सकते हैं। सभी त्वरित क्रियाएं भी हिंदी में बदल गई हैं।"
          : "🌐 **Language changed: English**\n\nYou can now ask questions in English. All quick actions have also switched to English.",
        timestamp: new Date(),
        lang: newLang,
        isDemo: false,
        groundedSource: "JanSahaya Language Engine",
      };
      setMessages(prev => [...prev, { role: "user", text, timestamp: new Date() }, confirmMsg]);
      return;
    }
    sendMessage(text);
  };

  const sendMessage = async (text: string) => {

    if (!text.trim() || loading) return;
    setInput("");
    setLoading(true);

    const userMsg: Message = { role: "user", text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);

    // Get last 8 messages as history (excluding welcome message)
    const history = messages
      .slice(1)
      .slice(-8)
      .map((m) => ({ role: m.role, text: m.text }));

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          previousIntent,
          previousEntities,
        }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();

      if (data.intent) setPreviousIntent(data.intent);
      if (data.entities) setPreviousEntities(data.entities);

      const botMsg: Message = {
        role: "model",
        text: data.reply || "I couldn't process that. Please try again.",
        timestamp: new Date(),
        isDemo: data.isDemo,
        lang: data.detectedLanguage,
        actions: data.actions || [],
        card: data.card,
        groundedSource: data.groundedSource,
      };
      setMessages((prev) => [...prev, botMsg]);

      // If chat is closed, count as unread
      if (!open || minimized) setUnreadCount((c) => c + 1);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "⚠️ Connection error. For emergencies call **112** immediately.\n\nSDMA Jharkhand: **0651-2446900**",
          timestamp: new Date(),
          isDemo: true,
          actions: [
            { label: "🚨 Call 112", url: "tel:112", variant: "danger" },
            { label: "🗺️ Open GIS Map", url: "/map", variant: "outline" },
          ],
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Voice recording
  const toggleVoice = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input requires Chrome browser. You can also type in Hindi or English.");
      return;
    }

    const recognition = new SR();
    recognition.lang = "hi-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map((r) => (r as SpeechRecognitionResult)[0].transcript)
        .join("");
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const copyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const clearChat = () => {
    setMessages([buildWelcome(isHindi)]);
    setPreviousIntent(undefined);
    setPreviousEntities(undefined);
  };


  // Safe React message renderer: avoids dangerouslySetInnerHTML entirely
  // Parses markdown tokens (bold, italic, inline code, line breaks)
  // while treating all text as safe React nodes to completely neutralize XSS.
  const renderSafeContent = (content: string): React.ReactNode => {
    const lines = content.split("\n");
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
      const renderedLine = parts.map((part, partIdx) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
          return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
          return <em key={partIdx}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
          return (
            <code key={partIdx} className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono text-slate-800">
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      });

      return (
        <React.Fragment key={lineIdx}>
          {renderedLine}
          {lineIdx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => {
          setOpen(!open);
          setMinimized(false);
          setUnreadCount(0);
        }}
        className={`fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 group ${
          open ? "bg-red-500 hover:bg-red-600 rotate-90 scale-110" : "bg-[#1a2e5a] hover:bg-[#223878] hover:scale-110"
        }`}
        title="JanSahaya Civic Copilot"
      >
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6 text-white" />
            {/* Live indicator */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-2 -left-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-[9998] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300"
          style={{ width: "390px", height: minimized ? "72px" : "600px" }}
        >
          {/* ── Header ── */}
          <div
            className="bg-gradient-to-r from-[#1a2e5a] to-[#1e40af] px-4 py-3 flex items-center gap-3 shrink-0 cursor-pointer"
            onClick={() => setMinimized(!minimized)}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#1a2e5a]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-sm flex items-center gap-1.5">
                JanSahaya AI
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-blue-200 text-[10px] truncate">
                {loading ? (
                  <span className="animate-pulse text-amber-300 font-medium">{typingPhrase}</span>
                ) : (
                  "Civic Copilot • Jharkhand Disaster & Municipal Care"
                )}
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-1.5 ml-auto" onClick={(e) => e.stopPropagation()}>
              <a
                href="tel:112"
                title="Call Emergency 112"
                className="w-8 h-8 rounded-xl bg-red-500/90 hover:bg-red-500 flex items-center justify-center transition-colors shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="w-3.5 h-3.5 text-white" />
              </a>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearChat();
                }}
                title="Reset conversation"
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* ── Messages Container ── */}
              <div
                ref={messagesRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3.5 bg-gradient-to-b from-slate-50/80 to-white"
              >
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        msg.role === "user"
                          ? "bg-[#1a2e5a]"
                          : "bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200/50"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Bot className="w-3.5 h-3.5 text-blue-700" />
                      )}
                    </div>

                    {/* Bubble + Content */}
                    <div className="flex flex-col max-w-[84%] gap-1.5">
                      <div
                        className={`px-3.5 py-3 rounded-2xl text-xs leading-relaxed relative group ${
                          msg.role === "user"
                            ? "bg-[#1a2e5a] text-white rounded-tr-sm shadow-sm"
                            : "bg-white border border-slate-200/90 text-slate-800 rounded-tl-sm shadow-sm"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{renderSafeContent(msg.text)}</div>

                        {/* Optional Rich Card */}
                        {msg.card && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] bg-slate-50/80 rounded-xl p-2.5 border">
                            <div className="font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Activity className="w-3.5 h-3.5 text-blue-600" />
                                {msg.card.title}
                              </span>
                            </div>
                            {msg.card.items && msg.card.items.length > 0 && (
                              <div className="space-y-1">
                                {msg.card.items.slice(0, 4).map((it, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-[10px]">
                                    <span className="text-slate-500 font-medium">{it.label}</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-slate-800 truncate max-w-[150px]">{it.value}</span>
                                      {it.badge && (
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                            it.badgeColor === "red"
                                              ? "bg-red-100 text-red-700"
                                              : it.badgeColor === "amber"
                                              ? "bg-amber-100 text-amber-700"
                                              : it.badgeColor === "green"
                                              ? "bg-emerald-100 text-emerald-700"
                                              : "bg-blue-100 text-blue-700"
                                          }`}
                                        >
                                          {it.badge}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Copy button */}
                        {msg.role === "model" && (
                          <button
                            onClick={() => copyMessage(msg.text, i)}
                            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 w-5 h-5 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center justify-center transition-all"
                            title="Copy message"
                          >
                            {copiedIdx === i ? (
                              <Check className="w-2.5 h-2.5 text-green-600" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 text-slate-500" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Action buttons under model response */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {msg.actions.map((act, actIdx) => {
                            const isExternal = act.url?.startsWith("tel:") || act.url?.startsWith("http");
                            const baseClasses =
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-semibold transition-all shadow-xs active:scale-95";
                            const colorClasses =
                              act.variant === "danger"
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : act.variant === "primary"
                                ? "bg-[#1a2e5a] hover:bg-[#223878] text-white"
                                : "bg-white hover:bg-blue-50 text-blue-700 border border-blue-200";

                            if (act.url) {
                              return isExternal ? (
                                <a
                                  key={actIdx}
                                  href={act.url}
                                  className={`${baseClasses} ${colorClasses}`}
                                >
                                  <span>{act.label}</span>
                                  <ArrowUpRight className="w-3 h-3 opacity-70" />
                                </a>
                              ) : (
                                <Link
                                  key={actIdx}
                                  href={act.url}
                                  className={`${baseClasses} ${colorClasses}`}
                                >
                                  <span>{act.label}</span>
                                  <ArrowUpRight className="w-3 h-3 opacity-70" />
                                </Link>
                              );
                            }

                            return (
                              <button
                                key={actIdx}
                                onClick={() => act.prompt && sendMessage(act.prompt)}
                                className={`${baseClasses} ${colorClasses}`}
                              >
                                <span>{act.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Timestamp + Grounded source indicator */}
                      <div
                        className={`flex items-center gap-1.5 text-[9px] text-slate-400 ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span>{formatTime(msg.timestamp)}</span>
                        {msg.groundedSource && (
                          <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
                            {msg.groundedSource.includes("Gemini") ? (
                              <>
                                <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                                <span className="text-blue-600 font-semibold">Gemini AI</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                                <span>JanSahaya AI Engine</span>
                              </>
                            )}
                          </span>
                        )}
                        {msg.isDemo && (
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[8px] font-medium">
                            emergency hotline fallback
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200/50 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-blue-700" />
                    </div>
                    <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        <span className="text-[10px] text-slate-400 ml-2 animate-pulse">{typingPhrase}</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Scroll to bottom button */}
              {showScrollBtn && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-28 right-4 w-8 h-8 bg-white border border-slate-200 shadow-md rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors z-10"
                >
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                </button>
              )}

              {/* ── Quick Prompts Strip ── */}
              <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto">
                <div className="flex gap-1.5" style={{ minWidth: "max-content" }}>
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => handleQuickPrompt(p.text, p.key)}
                      disabled={loading}
                      className={`shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 disabled:opacity-50 border rounded-xl transition-colors whitespace-nowrap active:scale-95 ${
                        p.key === "CHANGE_LANGUAGE"
                          ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 hover:border-emerald-300"
                          : "bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-200 hover:border-blue-200"
                      }`}
                    >
                      {p.key === "CHANGE_LANGUAGE" ? (
                        <Globe className="w-3 h-3" />
                      ) : (
                        <span>{p.emoji}</span>
                      )}{" "}{p.text}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Input Area ── */}
              <div className="px-3 pb-3 pt-2 bg-white flex gap-2 items-end">
                {/* Voice button */}
                <button
                  onClick={toggleVoice}
                  title={isRecording ? "Stop recording" : "Speak in Hindi or English"}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                    isRecording
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Text input */}
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                    placeholder={isRecording ? (isHindi ? "🎙️ सुन रहा हूँ..." : "🎙️ Listening...") : t("chatbotInputPlaceholder")}
                    disabled={loading}
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60 bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>

                {/* Send button */}
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 bg-[#1a2e5a] hover:bg-[#223878] disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all shrink-0 hover:scale-105 active:scale-95 shadow-sm"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* ── Footer ── */}
              <div className="px-4 pb-2 text-center">
                <p className="text-[9px] text-slate-400">
                  JanSahaya Civic Copilot • Data Grounded • Emergency Helpline:{" "}
                  <a href="tel:112" className="text-red-500 font-bold hover:underline">
                    112
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
