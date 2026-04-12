/** SportShield AI — Shield AI Chatbot Page */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Sparkles, Shield, TrendingUp, AlertTriangle, Lightbulb, Copy, Check } from 'lucide-react';
import { PageTransition } from '../components/shared/PageTransition';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  { text: 'How many violations were detected this week?', icon: TrendingUp },
  { text: 'Which asset is most targeted?', icon: AlertTriangle },
  { text: 'Generate a takedown strategy for YouTube', icon: Lightbulb },
  { text: 'Show me a summary of my IP protection status', icon: Shield },
];

// Smart response engine — generates contextual responses
function generateResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes('violation') && (q.includes('week') || q.includes('today') || q.includes('recent'))) {
    return `📊 **Violation Summary — Last 7 Days**

Based on my analysis of your protection network:

- **Total Violations Detected**: 8
- **High Severity**: 3 (YouTube: 2, Twitter: 1)
- **Medium Severity**: 3 (Web: 2, Instagram: 1)
- **Low Severity**: 2 (TikTok fan reposts)

**Key Insight**: YouTube remains your primary threat vector, accounting for 37.5% of all violations. I recommend increasing scan frequency for your Champions League highlights to **real-time** monitoring.

Your resolved rate this week is **50%** — above industry average of 35%. Good work! 🛡️`;
  }

  if (q.includes('most targeted') || q.includes('most pirated') || q.includes('which asset')) {
    return `🎯 **Most Targeted Asset Analysis**

Your most vulnerable asset is:

**Champions League Final Highlights**
- Violations detected: 12 (all-time)
- Recent spike: 5 new violations in last 48 hours
- Primary platforms: YouTube (58%), Twitter (25%), Web (17%)
- Threat Score: **87/100** 🔴

**Why it's targeted**: High-value content from a recent major event with massive search volume. Fan accounts and unauthorized sports aggregators are the main infringers.

**Recommended Actions**:
1. ⚡ Switch to real-time scanning (currently set to hourly)
2. 📝 Batch-generate takedown notices for the 5 pending violations
3. 🔒 Add invisible watermarking before next distribution
4. 📢 File Content ID claim on YouTube for proactive blocking`;
  }

  if (q.includes('takedown') && (q.includes('strategy') || q.includes('youtube'))) {
    return `📋 **YouTube Takedown Strategy**

Based on your violation history, here's an optimized enforcement workflow:

**Step 1: Prioritize by Impact**
- Focus on channels with >1,000 subscribers first (higher reach = more damage)
- Current high-priority targets: 3 channels with combined 45K subscribers

**Step 2: Use Content ID (Recommended)**
- You have 4 eligible assets for YouTube's Content ID system
- Expected result: Auto-block or monetize future uploads within 24 hours

**Step 3: DMCA Batch Filing**
- I can generate 5 DMCA notices right now — ready for one-click submission
- Average YouTube response time: 48–72 hours

**Step 4: Monitor Repeat Offenders**
- 2 accounts have multiple violations — consider escalation to YouTube's Trust & Safety team

**Expected Recovery**: Based on similar cases, you should see a **78% takedown rate** within 5 business days.

Want me to generate the batch DMCA notices now?`;
  }

  if (q.includes('summary') || q.includes('status') || q.includes('overview')) {
    return `🛡️ **SportShield AI — Protection Status Summary**

**Organization**: SportShield Enterprise
**Plan**: Pro (Active)

---

**Assets Under Protection**: 15
- Images: 8 | Videos: 5 | Logos: 2

**Scan Coverage**:
- Real-time: 3 assets
- Hourly: 4 assets  
- Daily: 5 assets
- Weekly: 3 assets

**Threat Level**: 🟡 **MODERATE**
- 4 active unresolved violations
- 8 total violations detected (last 30 days)
- 50% resolution rate

**Financial Impact** (Estimated):
- Unauthorized views this month: ~125,000
- Estimated revenue loss: ~$2,400
- Recovered through takedowns: ~$1,100

**Top Recommendation**: Your Champions League content needs immediate attention. Switching to real-time monitoring and filing pending takedowns could reduce your exposure by 60%.`;
  }

  if (q.includes('predict') || q.includes('forecast') || q.includes('future')) {
    return `🔮 **Violation Forecast — Next 7 Days**

Based on historical patterns and upcoming events:

| Day | Predicted Violations | Confidence |
|-----|---------------------|------------|
| Mon | 2-3 | 85% |
| Tue | 1-2 | 78% |
| Wed | 3-5 | 72% |
| Thu | 1-2 | 80% |
| Fri | 2-3 | 75% |
| Sat | 5-8 ⚠️ | 90% |
| Sun | 4-6 ⚠️ | 88% |

**Weekend spike predicted**: A major Premier League match on Saturday is likely to generate a surge in unauthorized highlight sharing.

**Proactive measures**:
1. Pre-upload all official highlights to trigger Content ID claims
2. Set all match-related assets to real-time scanning by Friday
3. Prepare batch takedown templates in advance`;
  }

  // Default response
  return `I'd be happy to help with that! Here's what I can assist you with:

🔍 **Detection & Analysis**
- "How many violations this week?"
- "Which asset is most targeted?"
- "Predict next week's violations"

📋 **Enforcement**
- "Generate takedown strategy for YouTube"
- "How to file a DMCA notice?"

📊 **Reporting**
- "Show protection status summary"
- "What's my threat score?"

💡 **Strategy**
- "How to prevent future violations?"
- "Best practices for IP protection"

Try asking one of these questions, or describe what you'd like to know!`;
}

export default function ShieldAI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Welcome to **Shield AI** — your intelligent IP protection assistant.

I can help you analyze violations, generate takedown strategies, provide threat insights, and answer questions about your assets.

What would you like to know?`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking delay
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));

    const response = generateResponse(text);
    const aiMsg: Message = { id: `a-${Date.now()}`, role: 'assistant', content: response, timestamp: new Date() };
    setIsTyping(false);
    setMessages(prev => [...prev, aiMsg]);
  };

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
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
          <p className="text-xs text-zinc-400">AI-powered IP protection intelligence</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
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
                <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                      .replace(/\n/g, '<br/>')
                  }}
                />
                {msg.role === 'assistant' && msg.id !== 'welcome' && (
                  <button
                    onClick={() => copyMessage(msg.id, msg.content)}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-[#0B0F19] border border-[#1F2937] text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                  >
                    {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
                <p className="text-[10px] text-zinc-600 mt-2">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
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
            placeholder="Ask Shield AI anything about your IP protection..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-100 placeholder-zinc-500"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            className={`p-2 rounded-lg transition-all ${
              input.trim()
                ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-[#1F2937] text-zinc-600 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-zinc-600 text-center mt-2">Shield AI provides insights based on your platform data. Responses are generated locally.</p>
      </div>
    </PageTransition>
  );
}
