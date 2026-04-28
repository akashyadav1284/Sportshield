/** SportShield AI — Shield AI Chatbot Page (Gemini-Powered) */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Sparkles, Shield, TrendingUp, AlertTriangle, Lightbulb, Copy, Check, Zap, Wifi, WifiOff } from 'lucide-react';
import { PageTransition } from '../components/shared/PageTransition';
import api from '../lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: 'gemini' | 'fallback';
}

const SUGGESTED_PROMPTS = [
  { text: 'How many violations were detected this week?', icon: TrendingUp },
  { text: 'Which asset is most targeted?', icon: AlertTriangle },
  { text: 'Generate a takedown strategy for YouTube', icon: Lightbulb },
  { text: 'Show me a summary of my IP protection status', icon: Shield },
];


// --- UI Components ---

// Renders markdown text and replaces [ACTION:X] with real interactive buttons
const MessageRenderer = ({ content, onAction }: { content: string, onAction: (action: string) => void }) => {
  const parts = content.split(/(\[ACTION:[A-Z_]+\])/g);

  return (
    <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
      {parts.map((part, index) => {
        if (part.startsWith('[ACTION:')) {
          const action = part.replace('[ACTION:', '').replace(']', '');
          let buttonText = 'Execute Action';
          let icon = <Zap className="w-3 h-3" />;
          
          if (action === 'TAKEDOWN_YOUTUBE') { buttonText = 'Draft YouTube Takedowns'; icon = <AlertTriangle className="w-3 h-3" />; }
          if (action === 'UPGRADE_SCAN') { buttonText = 'Enable Real-Time Scanning'; icon = <Shield className="w-3 h-3" />; }
          if (action === 'EXECUTE_BATCH') { buttonText = 'Execute Batch DMCA'; icon = <Lightbulb className="w-3 h-3" />; }

          return (
            <div key={index} className="mt-3 mb-1">
              <button
                onClick={() => onAction(action)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors text-xs font-semibold"
              >
                {icon}
                {buttonText}
              </button>
            </div>
          );
        }

        // Basic markdown formatting for bold and lists
        let formatted = part
          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
          .replace(/- (.*?)\n/g, '<li class="ml-4 list-disc marker:text-cyan-500">$1</li>\n');

        return <span key={index} dangerouslySetInnerHTML={{ __html: formatted }} />;
      })}
    </div>
  );
};


export default function ShieldAI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Welcome to **Shield AI** — your intelligent IP protection assistant, powered by **Google Gemini**.

I have access to your live SportShield platform data and can provide real-time, data-driven intelligence. 

Try asking me to analyze violations, check vulnerable assets, or generate takedown strategies!`,
      timestamp: new Date(),
      source: 'gemini',
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<'gemini' | 'fallback'>('gemini');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text, timestamp: new Date() };
    const currentHistory = [...messages, userMsg];
    setMessages(currentHistory);
    setInput('');
    setIsTyping(true);

    try {
      // Build conversation history for the API (exclude welcome message)
      const historyForApi = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const { data } = await api.post('/ai/chat', {
        message: text,
        history: historyForApi,
      });

      const responseContent: string = data.response;
      setAiSource(data.source);

      // Typewriter effect stream
      setIsTyping(false);
      const aiMsgId = `a-${Date.now()}`;
      setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', timestamp: new Date(), source: data.source }]);

      // Stream characters
      let currentText = '';
      const speed = 8;

      for (let i = 0; i < responseContent.length; i++) {
        await new Promise(r => setTimeout(r, speed));
        currentText += responseContent[i];
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: currentText } : m));
      }
    } catch (error) {
      console.error('Shield AI error:', error);
      setIsTyping(false);
      setAiSource('fallback');
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ I encountered an error connecting to the AI engine. Please try again in a moment.',
        timestamp: new Date(),
        source: 'fallback',
      }]);
    }
  };

  const handleAction = async (action: string) => {
    await sendMessage(`Execute action: ${action}`);
  };

  const copyMessage = (id: string, content: string) => {
    const cleanContent = content.replace(/\[ACTION:[A-Z_]+\]/g, '');
    navigator.clipboard.writeText(cleanContent);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <PageTransition className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Shield AI
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </h1>
          <p className="text-xs text-zinc-400">Powered by Google Gemini · Live Data Intelligence</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${
            aiSource === 'gemini' 
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
          }`}>
            {aiSource === 'gemini' ? (
              <><Wifi className="w-3 h-3" /> Gemini Connected</>
            ) : (
              <><WifiOff className="w-3 h-3" /> Fallback Mode</>
            )}
          </span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0B0F19] rounded-2xl border border-[#1F2937] p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] relative group ${
                msg.role === 'user'
                  ? 'bg-cyan-500/10 border border-cyan-500/20 rounded-2xl rounded-tr-md px-4 py-3'
                  : 'bg-[#111827] border border-[#1F2937] rounded-2xl rounded-tl-md px-4 py-3'
              }`}>
                
                {msg.role === 'assistant' ? (
                  <MessageRenderer content={msg.content} onAction={handleAction} />
                ) : (
                  <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                )}
                
                {msg.role === 'assistant' && msg.id !== 'welcome' && (
                  <button
                    onClick={() => copyMessage(msg.id, msg.content)}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-[#0B0F19] border border-[#1F2937] text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                  >
                    {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-[10px] text-zinc-600">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {msg.role === 'assistant' && msg.source && msg.id !== 'welcome' && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      msg.source === 'gemini' 
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {msg.source === 'gemini' ? '✨ Gemini' : '⚙️ Fallback'}
                    </span>
                  )}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-[#1F2937] border border-[#374151] flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-zinc-300" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-[#111827] border border-[#1F2937] rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Suggested Prompts (only when no user messages) */}
        {messages.length === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4">
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt.text)}
                className="flex items-center gap-3 px-4 py-3 bg-[#111827] border border-[#1F2937] rounded-xl hover:border-cyan-500/30 hover:bg-[#1F2937] transition-all text-left group"
              >
                <prompt.icon className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">{prompt.text}</span>
              </button>
            ))}
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="mt-4 relative">
        <div className="flex items-center gap-3 bg-[#111827] border border-[#1F2937] rounded-2xl px-4 py-3 focus-within:border-cyan-500/30 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all">
          <Sparkles className="w-4 h-4 text-zinc-600 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask Shield AI anything — powered by Google Gemini..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-100 placeholder-zinc-500"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className={`p-2 rounded-lg transition-all ${
              input.trim() && !isTyping
                ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-[#1F2937] text-zinc-600 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-zinc-600 text-center mt-2">Shield AI is powered by Google Gemini with live platform data integration.</p>
      </div>
    </PageTransition>
  );
}
