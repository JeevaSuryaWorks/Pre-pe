import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2, Sparkles, RefreshCcw } from "lucide-react";
import { getAIResponse, Message } from "@/services/groqService";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import remarkGfm from 'remark-gfm';

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I am **Shashtika**, your AI assistant for PrePe India. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMessage];
      const response = await getAIResponse(chatHistory);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: "Hello! I am **Shashtika**, your AI assistant for PrePe India. How can I help you today?" }]);
  };

  return (
    <Layout title="Ask Shashtika" showBack showBottomNav={false} noScroll={true}>
      <div className="flex flex-col h-full bg-slate-50/50">
        {/* Header Info */}
        <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF671F] to-orange-400 flex items-center justify-center shadow-lg shadow-orange-600/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-sm tracking-tight leading-none">Shashtika AI</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#046A38] animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital India Assistant</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={clearChat} className="rounded-xl text-slate-400 hover:text-[#FF671F] hover:bg-orange-50">
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-10">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              // Calculate AI message index for tricolor pattern
              const aiIndex = messages.filter((m, i) => m.role === 'assistant' && i <= idx).length - 1;
              const aiColors = [
                { border: "border-[#FF671F]", bg: "bg-orange-50/30", text: "text-slate-800", strong: "text-[#FF671F]" },
                { border: "border-slate-200", bg: "bg-white", text: "text-slate-700", strong: "text-[#000080]" },
                { border: "border-[#046A38]", bg: "bg-emerald-50/30", text: "text-slate-800", strong: "text-[#046A38]" }
              ];
              const theme = aiColors[aiIndex % 3];

              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-md ${
                      msg.role === 'user' ? 'bg-[#000080]' : 'bg-[#046A38]'
                    }`}>
                      {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
                    </div>
                    <div className={cn(
                      "p-4 rounded-[24px] text-sm leading-relaxed shadow-sm",
                      msg.role === 'user' 
                        ? 'bg-[#000080] text-white rounded-tr-none' 
                        : `${theme.bg} ${theme.text} rounded-tl-none border-l-4 ${theme.border} border-t border-r border-b`
                    )}>
                      <div className={cn(
                        "prose prose-slate prose-sm max-w-none prose-headings:font-black prose-headings:text-slate-800",
                        "prose-table:border-collapse prose-table:border prose-table:border-slate-200 prose-table:w-full",
                        "prose-th:bg-slate-50/50 prose-th:p-2 prose-th:border prose-th:border-slate-100 prose-th:text-slate-600 prose-th:font-black prose-th:uppercase prose-th:text-[10px]",
                        "prose-td:p-2 prose-td:border prose-td:border-slate-100 prose-td:text-slate-600",
                        "prose-p:leading-relaxed prose-li:my-1 prose-img:rounded-xl",
                        msg.role === 'user' ? 'prose-invert prose-strong:text-orange-300' : `prose-strong:${theme.strong}`
                      )}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-xl bg-[#046A38] flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
                <div className="p-4 bg-white rounded-[24px] rounded-tl-none border border-slate-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#046A38] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#046A38] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#046A38] animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-[#046A38]">Shashtika is typing...</span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={scrollRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100 pb-6 shrink-0">
          <div className="flex gap-2 bg-slate-50 border border-slate-200 p-2 rounded-[24px] focus-within:ring-2 focus-within:ring-[#FF671F]/20 transition-all shadow-inner">
            <Input 
              placeholder="Ask Shashtika about your payments..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="border-none bg-transparent shadow-none focus-visible:ring-0 placeholder:text-slate-400 font-medium"
            />
            <Button 
                onClick={handleSend} 
                disabled={!input.trim() || isLoading}
                className="rounded-full w-12 h-12 p-0 bg-[#FF671F] hover:bg-orange-600 shadow-xl shadow-orange-600/30 active:scale-95 transition-all"
            >
              <Send className="w-5 h-5 text-white" />
            </Button>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-3 font-black uppercase tracking-[0.2em]">
            Powered by PrePe Technologies • 🇮🇳
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AIChat;
