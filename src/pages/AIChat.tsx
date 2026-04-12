import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2, Sparkles, RefreshCcw } from "lucide-react";
import { getAIResponse, Message } from "@/services/groqService";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
    <Layout title="Ask Shashtika" showBack showBottomNav>
      <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-50/50">
        {/* Header Info */}
        <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-sm tracking-tight leading-none">Shashtika</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Always Online</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={clearChat} className="rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50">
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-md ${
                    msg.role === 'user' ? 'bg-slate-800' : 'bg-blue-600'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
                  </div>
                  <div className={`p-4 rounded-[24px] text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-slate-800 text-slate-100 rounded-tr-none' 
                      : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                  }`}>
                    <div className="prose prose-slate prose-sm max-w-none prose-headings:font-black prose-headings:text-slate-800 prose-strong:text-blue-600">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
                <div className="p-4 bg-white rounded-[24px] rounded-tl-none border border-slate-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shashtika is thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={scrollRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100 pb-8">
          <div className="flex gap-2 bg-slate-50 border border-slate-200 p-2 rounded-[24px] focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <Input 
              placeholder="Ask Shashtika about your payments..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="border-none bg-transparent shadow-none focus-visible:ring-0 placeholder:text-slate-400"
            />
            <Button 
                onClick={handleSend} 
                disabled={!input.trim() || isLoading}
                className="rounded-full w-10 h-10 p-0 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-3 font-medium uppercase tracking-wider">
            Powered by Shashtika Innovations • Established 2026
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AIChat;
