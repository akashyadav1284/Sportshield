/** SportShield AI — Shield AI Chatbot Page */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Sparkles, Shield, TrendingUp, AlertTriangle, Lightbulb, Copy, Check, Zap } from 'lucide-react';
import { PageTransition } from '../components/shared/PageTransition';
import { mockAssets, mockViolations, platformStats } from '../lib/mockDataset';

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

// --- NLP Engine ---
function generateDynamicResponse(query: string, history: Message[]): string {
  const q = query.toLowerCase();

  // Entity Extraction
  const hasYouTube = q.includes('youtube');
  const hasTwitter = q.includes('twitter');
  const hasTikTok = q.includes('tiktok');
  
  // 1. Violation Queries
  if (q.includes('violation') || q.includes('how many')) {
    let filtered = mockViolations;
    let context = "all platforms";
    
    if (hasYouTube) { filtered = filtered.filter(v => v.platform === 'YouTube'); context = "YouTube"; }
    else if (hasTwitter) { filtered = filtered.filter(v => v.platform === 'Twitter'); context = "Twitter"; }
    else if (hasTikTok) { filtered = filtered.filter(v => v.platform === 'TikTok'); context = "TikTok"; }

    const highSeverity = filtered.filter(v => v.severity === 'High').length;
    const totalViews = filtered.reduce((acc, v) => acc + v.views, 0);
    const totalImpact = filtered.reduce((acc, v) => acc + v.revenueImpact, 0);

    return `📊 **Violation Analysis — ${context}**
    
Based on my real-time scan of the dataset:
- **Total Violations Detected**: ${filtered.length}
- **High Severity**: ${highSeverity}
- **Total Exposure (Views)**: ${totalViews.toLocaleString()}
- **Est. Revenue Impact**: $${totalImpact.toLocaleString()}

**Insight**: ${highSeverity > 0 ? 'You have high-severity violations that need immediate attention.' : 'Threat levels are currently manageable.'}
${hasYouTube ? '\nWant me to generate a batch takedown for these YouTube links?\n[ACTION:TAKEDOWN_YOUTUBE]' : ''}`;
  }

  // 2. Targeted Asset Analysis
  if (q.includes('most targeted') || q.includes('vulnerable') || q.includes('asset')) {
    const sortedAssets = [...mockAssets].sort((a, b) => b.totalViolations - a.totalViolations);
    const topAsset = sortedAssets[0];
    const relatedViolations = mockViolations.filter(v => v.assetId === topAsset.id);
    const topPlatform = relatedViolations.length > 0 ? relatedViolations[0].platform : 'Unknown';

    return `🎯 **Asset Threat Intelligence**

Your most targeted asset right now is **"${topAsset.name}"**.

**Key Metrics:**
- **Threat Score**: ${topAsset.threatScore}/100 ${topAsset.threatScore > 80 ? '🔴' : '🟡'}
- **Total Violations**: ${topAsset.totalViolations}
- **Current Scan Frequency**: ${topAsset.scanFrequency}
- **Primary Leaking Platform**: ${topPlatform}

**Recommended Action**: Switch this asset to Real-Time scanning to catch re-uploads instantly.
[ACTION:UPGRADE_SCAN]`;
  }

  // 3. Takedown Strategy
  if (q.includes('takedown') || q.includes('strategy') || q.includes('action')) {
    const pendingYouTube = mockViolations.filter(v => v.platform === 'YouTube' && v.status === 'Pending');
    
    return `📋 **Automated Takedown Strategy**

I have analyzed the current threat landscape. Here is the optimal strategy:

**Step 1: High-Impact Strikes**
- You have ${pendingYouTube.length} pending High-Severity violations on YouTube.
- Filing DMCA notices for these will protect approximately $${pendingYouTube.reduce((acc, v) => acc + v.revenueImpact, 0).toLocaleString()} in revenue.

**Step 2: Automated Content ID**
- I recommend registering the top 2 vulnerable assets with YouTube Content ID for auto-blocking.

Would you like me to execute the batch DMCA takedowns now?
[ACTION:EXECUTE_BATCH]`;
  }

  // 4. Protection Summary
  if (q.includes('summary') || q.includes('status') || q.includes('overview')) {
    const vulnerableCount = mockAssets.filter(a => a.status === 'vulnerable').length;

    return `🛡️ **Platform Protection Summary**

Here is your live intelligence brief based on the SportShield dataset:

**Asset Health**
- Total Protected: ${platformStats.totalProtected}
- Currently Vulnerable: ${vulnerableCount} ⚠️
- Active Scans: ${platformStats.activeScans}

**Financial Security**
- Estimated Saved Revenue: **$${platformStats.estimatedSavedRevenue.toLocaleString()}**
- Resolution Rate: ${platformStats.resolutionRate}%

**Next Steps**: I noticed ${vulnerableCount} assets are marked as vulnerable. We should address these immediately.`;
  }

  // 5. General / Contextual Chat memory check
  const lastMessage = history.length > 0 ? history[history.length - 1].content.toLowerCase() : '';
  if ((q.includes('yes') || q.includes('do it')) && (lastMessage.includes('takedown') || lastMessage.includes('youtube'))) {
    return `✅ **Executing...**\n\nI have initialized the takedown sequence for the requested platforms. You will see updates in your Alerts dashboard shortly.`;
  }

  return `I am Shield AI, your IP Protection Analyst. I am connected to the SportShield dataset.

I can help you:
1. Analyze violations by platform or asset.
2. Calculate estimated revenue impacts.
3. Generate automated takedown strategies.
4. Adjust scan frequencies.

How can I assist you today?`;
}


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
      content: `👋 Welcome to **Shield AI** — your intelligent IP protection assistant.

I am connected to the SportShield mock dataset and can provide highly accurate, data-driven intelligence. 

Try asking me to analyze specific platforms, check vulnerable assets, or calculate revenue impact!`,
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
    const currentHistory = [...messages, userMsg];
    setMessages(currentHistory);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking delay and dataset processing
    await new Promise(r => setTimeout(r, 600 + Math.random() * 800));

    const responseContent = generateDynamicResponse(text, messages); // pass previous messages for context
    
    // Typewriter effect stream implementation
    setIsTyping(false);
    
    const aiMsgId = `a-${Date.now()}`;
    setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', timestamp: new Date() }]);
    
    // Stream characters
    let currentText = '';
    const speed = 10; // ms per char
    
    for (let i = 0; i < responseContent.length; i++) {
      await new Promise(r => setTimeout(r, speed));
      currentText += responseContent[i];
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: currentText } : m));
    }
  };

  const handleAction = async (action: string) => {
    // Send a message acting as the user triggering the action
    await sendMessage(`Execute action: ${action}`);
  };

  const copyMessage = (id: string, content: string) => {
    // Strip action tags before copying
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
          <p className="text-xs text-zinc-400">Advanced NLP Engine & Dataset Integration</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Dataset Connected
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
            placeholder="Ask Shield AI to analyze data, calculate impacts, or generate strategies..."
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
        <p className="text-[10px] text-zinc-600 text-center mt-2">Shield AI is using a simulated Local NLP Engine connected to platform mock datasets.</p>
      </div>
    </PageTransition>
  );
}
