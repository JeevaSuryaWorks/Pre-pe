import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Sparkles, RefreshCcw, ArrowLeft, Star } from "lucide-react";
import { getAIResponse } from "@/services/groqService";
import { getPlans } from "@/services/plans.service";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import remarkGfm from 'remark-gfm';
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  showCarousel?: boolean;
}

const STATIC_FALLBACK_PACKS = [
  {
    amount: 859,
    validity: "84 Days",
    data: "1.5 GB/Day",
    perks: ["12am to 6am free", "1.5 GB/Day data roll-over", "Prepe VIP Club"],
    tag: "Unlimited Pack",
    isRecommended: true
  },
  {
    amount: 979,
    validity: "84 Days",
    data: "2 GB/Day",
    perks: ["12am to 12pm free", "Weekend Data roll-over", "Disney+ Hotstar"],
    tag: "Premium Pack",
    isRecommended: true
  },
  {
    amount: 548,
    validity: "84 Days",
    data: "7 GB total",
    perks: ["Unlimited Voice", "100 SMS/Day", "Basic plan rewards"],
    tag: "Budget Pack",
    isRecommended: false
  },
  {
    amount: 199,
    validity: "28 Days",
    data: "1 GB/Day",
    perks: ["Unlimited Voice", "100 SMS/Day", "Ad-free experience"],
    tag: "Budget Pack",
    isRecommended: false
  },
  {
    amount: 2999,
    validity: "365 Days",
    data: "2.5 GB/Day",
    perks: ["Unlimited Voice & SMS", "Annual VIP pass", "High commission back"],
    tag: "Super Value pack",
    isRecommended: true
  }
];

const AIChat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Jeevasurya";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [realPlans, setRealPlans] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Logical State Machine for Recharge Flow
  const [rechargeStep, setRechargeStep] = useState<'idle' | 'awaiting_phone' | 'awaiting_operator' | 'showing_plans'>('idle');
  const [rechargePhone, setRechargePhone] = useState<string>('');
  const [rechargeOperator, setRechargeOperator] = useState<string>('');

  // Exit Feedback Modal States
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitRating, setExitRating] = useState<number>(0);
  const [selectedPills, setSelectedPills] = useState<string[]>([]);

  // Load Real live packages from plans.service
  useEffect(() => {
    const loadDynamicPlans = async () => {
      try {
        const result = await getPlans("4", "17");
        if (result.status === 'SUCCESS' && result.data && result.data.length > 0) {
          const mapped = result.data.slice(0, 10).map((plan: any) => ({
            amount: plan.amount,
            validity: plan.validity || "28 Days",
            data: plan.data || plan.description?.match(/\d+(\.\d+)?\s?(GB|MB)/i)?.[0] || "1.5 GB/Day",
            perks: [
              plan.description || "Unlimited Voice & Data",
              "PrePe Cashbacks active",
              "VIP Plan Rewards"
            ],
            tag: plan.category === 'unlimited' ? "Unlimited Plan" : "Combo Offer",
            isRecommended: plan.amount > 500
          }));
          setRealPlans(mapped);
        } else {
          setRealPlans(STATIC_FALLBACK_PACKS);
        }
      } catch (error) {
        console.error("Error loading live plans:", error);
        setRealPlans(STATIC_FALLBACK_PACKS);
      }
    };
    loadDynamicPlans();
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const rawText = textToSend || input;
    if (!rawText.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: rawText.trim() };
    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInput("");
    setIsLoading(true);

    setTimeout(async () => {
      const query = rawText.toLowerCase().trim();
      let botText = "";
      let showCarousel = false;

      // Extract 10-digit phone number if present
      const phoneMatch = query.match(/\b\d{10}\b/);
      const matchedPhone = phoneMatch ? phoneMatch[0] : "";

      // ----------------------------------------------------
      // Logical State Machine for Recharge Flow
      // ----------------------------------------------------
      
      // Step A: User initiates a recharge request
      if (query.includes("recharge") || query.includes("topup") || query.includes("pack") || matchedPhone) {
        
        // If phone number is not yet captured
        if (!rechargePhone && !matchedPhone) {
          botText = "I don't recharge directly, due to Money Related issues, as per Prepe Policie.So I can guide you.\n\nPlease enter the **10-digit Mobile Number** you want to check plans for:";
          setRechargeStep('awaiting_phone');
          setMessages(prev => [...prev, { role: 'assistant', content: botText }]);
          setIsLoading(false);
          return;
        }

        // If phone number is extracted or captured in this turn
        const activePhone = matchedPhone || rechargePhone;
        if (activePhone && !rechargeOperator) {
          if (matchedPhone) {
            setRechargePhone(matchedPhone);
          }
          botText = `I don't recharge directly, due to Money Related issues, as per Prepe Policie.So I can guide you.\n\nGreat! I have saved **${activePhone}** as your target number. What operator is this SIM card? (Please type **Jio**, **Airtel**, **Vi**, or **BSNL**):`;
          setRechargeStep('awaiting_operator');
          setMessages(prev => [...prev, { role: 'assistant', content: botText }]);
          setIsLoading(false);
          return;
        }
      }

      // Step B: User is inside awaiting_phone state and inputs a phone number
      if (rechargeStep === 'awaiting_phone') {
        if (matchedPhone) {
          setRechargePhone(matchedPhone);
          botText = `Got it! Target number is set to **${matchedPhone}**.\n\nWhat operator is this SIM card? (Please type **Jio**, **Airtel**, **Vi**, or **BSNL**):`;
          setRechargeStep('awaiting_operator');
          setMessages(prev => [...prev, { role: 'assistant', content: botText }]);
          setIsLoading(false);
          return;
        } else {
          botText = "Please enter a valid **10-digit mobile number** (e.g. 8608412555) to continue:";
          setMessages(prev => [...prev, { role: 'assistant', content: botText }]);
          setIsLoading(false);
          return;
        }
      }

      // Step C: User is inside awaiting_operator state and inputs an operator
      if (rechargeStep === 'awaiting_operator') {
        const foundOp = ["jio", "airtel", "vi", "bsnl"].find(op => query.includes(op));
        if (foundOp) {
          const capitalizedOp = foundOp === "vi" ? "Vi" : foundOp === "bsnl" ? "BSNL" : foundOp.charAt(0).toUpperCase() + foundOp.slice(1);
          setRechargeOperator(capitalizedOp);
          setRechargeStep('showing_plans');

          // Map operator name to database operator ID: Airtel=1, BSNL=2, Jio=3, Vi=4
          const opIdMap: Record<string, string> = { "Airtel": "1", "BSNL": "2", "Jio": "3", "Vi": "4" };
          const operatorId = opIdMap[capitalizedOp] || "4";

          try {
            const result = await getPlans(operatorId, "17");
            if (result.status === 'SUCCESS' && result.data && result.data.length > 0) {
              const mapped = result.data.slice(0, 10).map((plan: any) => ({
                amount: plan.amount,
                validity: plan.validity || "28 Days",
                data: plan.data || plan.description?.match(/\d+(\.\d+)?\s?(GB|MB)/i)?.[0] || "1.5 GB/Day",
                perks: [
                  plan.description || "Unlimited Voice & Data",
                  "PrePe Cashbacks active",
                  "VIP Plan Rewards"
                ],
                tag: plan.category === 'unlimited' ? "Unlimited Plan" : "Special Offer",
                isRecommended: plan.amount > 500
              }));
              setRealPlans(mapped);
            }
          } catch (err) {
            console.error("Live plan fetch error:", err);
          }

          botText = `Perfect! I have fetched the active packs and dynamic offers for **${capitalizedOp}** on **${rechargePhone}**.\n\n*Note: I don't recharge directly due to Money Related issues as per Prepe Policies, but you can select your preferred plan below to complete it securely:*`;
          showCarousel = true;
          
          setMessages(prev => [...prev, { role: 'assistant', content: botText, showCarousel: true }]);
          setIsLoading(false);
          return;
        } else {
          botText = `Please enter a valid operator for **${rechargePhone}** (type **Jio**, **Airtel**, **Vi**, or **BSNL**):`;
          setMessages(prev => [...prev, { role: 'assistant', content: botText }]);
          setIsLoading(false);
          return;
        }
      }

      // If showing plans and they select or restart
      if (query.includes("reset") || query.includes("restart") || query.includes("clear")) {
        setRechargeStep('idle');
        setRechargePhone('');
        setRechargeOperator('');
        botText = "Recharge assistant reset! I can help you with recharge packs, plan searches, commissions, or wallet queries. How can I help you today?";
        setMessages(prev => [...prev, { role: 'assistant', content: botText }]);
        setIsLoading(false);
        return;
      }

      // ----------------------------------------------------
      // Static Contextual Matching for Info / Commission / Wallets
      // ----------------------------------------------------
      if (query.includes("commission") || query.includes("earn") || query.includes("percentage") || query.includes("benefit")) {
        botText = "### PrePe High Commissions Structure 💰\nPrePe offers the best commissions for retailers and distributors:\n\n| Service Type | Basic Member | PrePe VIP Club |\n| :--- | :--- | :--- |\n| **Mobile Recharge** | Up to 3.5% | **Up to 5.0%** |\n| **DTH Recharges** | Up to 3.0% | **Up to 4.5%** |\n| **Electricity Bills** | Flat ₹2.00 | **Flat ₹5.00** |\n| **Fastag & Gas** | Flat ₹1.50 | **Flat ₹3.00** |\n\nUpgrade your account to PrePe VIP to instantly double your earnings! 📈";
      } else if (query.includes("wallet") || query.includes("fund") || query.includes("add") || query.includes("balance")) {
        botText = "To add funds to your wallet:\n1. Tap the **Wallet** icon in the navbar.\n2. Choose **Add Money / Fund Request**.\n3. Enter your amount and complete your payment via UPI intent launcher (GPay/PhonePe).\n4. Enter UTR inside the form and submit. Admins will verify your claim and notify you instantly via Telegram Bot alerts!";
      } else if (query.includes("ceo") || query.includes("cto") || query.includes("founder") || query.includes("who are you") || query.includes("about") || query.includes("prepe")) {
        botText = "### About PrePe India Private Limited 🇮🇳\n- **Established**: 2026\n- **CEO & Founder**: **Mr. P. Boopathi Raja M.B.A**\n- **CTO & Developer**: **Mr. P. Jeevasurya B.Tech**\n- **Mission**: *We take care of your Payments & Bill Dues at Just a Click.*\n- **Developer Office**: PrePe Technologies, India.\n\nPrePe is a premium payment aggregator providing mobile recharges, instant utility bill payments, and bulk services.";
      } 
      // Groq Dynamic API Fallback
      else {
        try {
          const chatHistory = [...messages, { role: 'user', content: rawText }];
          const apiHistory = chatHistory.map(msg => ({ role: msg.role, content: msg.content }));
          const dynamicResponse = await getAIResponse(apiHistory);
          botText = dynamicResponse;
        } catch (err) {
          botText = "I am your Prepe Recharge Assistant. I can assist you with recharge packs, plan searches, commissions, and wallet deposits. Let me know how I can help you today! 🇮🇳";
        }
      }

      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: botText,
          showCarousel: showCarousel
        }
      ]);
      setIsLoading(false);
    }, 850);
  };

  const handlePackSelect = (amount: number) => {
    toast.success(`Pack ₹${amount} selected! Navigating to recharge screen...`);
    navigate(`/services/mobile?amount=${amount}`);
  };

  const handleExplorePacks = () => {
    handleSend("Explore other packs");
  };

  const clearChat = () => {
    setMessages([]);
    setRechargeStep('idle');
    setRechargePhone('');
    setRechargeOperator('');
    toast.info("Chat screen refreshed!");
  };

  // Exit Modal Handlers
  const handleBackClick = () => {
    setShowExitModal(true);
  };

  const handleConfirmExit = async () => {
    try {
      // Save feedback report to DB table user_feedbacks
      const { error } = await supabase
        .from('user_feedbacks')
        .insert({
          user_id: user?.id || null,
          email: user?.email || "Anonymous",
          rating: exitRating,
          feedback_pills: selectedPills
        });

      if (error) {
        console.error("Error inserting feedback:", error);
      }
      toast.success("Thank you for your valuable feedback!");
    } catch (err) {
      console.error("Error saving feedback:", err);
      toast.success("Thank you for your valuable feedback!");
    } finally {
      setShowExitModal(false);
      navigate(-1);
    }
  };

  const toggleFeedbackPill = (pill: string) => {
    setSelectedPills(prev => 
      prev.includes(pill) 
        ? prev.filter(p => p !== pill) 
        : [...prev, pill]
    );
  };

  // Prepe Logo Avatar Component
  const PrepeAvatar = () => (
    <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm shrink-0 overflow-hidden p-0.5">
      <img src="/logo.png" alt="PrePe Logo" className="w-full h-full object-contain rounded-lg" />
    </div>
  );

  return (
    <Layout hideHeader={true} showBottomNav={false} noScroll={true}>
      <div className="flex flex-col h-full bg-[#F5F5F7] relative">
        
        {/* Prepe Green Styled Header */}
        <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-slate-100 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={handleBackClick} className="p-2 -ml-2 rounded-full hover:bg-slate-50 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <PrepeAvatar />
            <h1 className="text-base font-extrabold text-slate-800 tracking-tight lowercase">recharge assistant</h1>
            <span className="bg-[#9B30FF] text-white text-[8px] font-black px-1.5 py-0.5 rounded tracking-wide leading-none uppercase shrink-0">BETA</span>
          </div>
          <Button variant="ghost" size="icon" onClick={clearChat} className="rounded-xl text-slate-400 hover:text-[#046A38] hover:bg-emerald-50 transition-colors">
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Message Area with strict horizontal scroll protection */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 pb-20 custom-scrollbar">
          
          {/* Default Prepe-styled Greetings Welcome Block */}
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <PrepeAvatar />
              <div className="flex-1">
                <h2 className="text-xl font-extrabold text-slate-900 leading-tight">Hey {userName}!</h2>
                <p className="text-sm font-medium text-slate-600 mt-1 leading-snug">
                  I am your Personal Recharge Assistant, here to help you select the best recharge pack offer
                </p>
              </div>
            </div>

            {/* Last Pack Expired Gray Card */}
            <div className="bg-[#EFEFF4] rounded-2xl p-4 text-xs font-semibold text-slate-600">
              Your last pack has expired, time to recharge?
            </div>

            {/* Last Recharge White Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md shadow-slate-100/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-3">Your last recharge:</p>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-[#046A38] leading-none block mb-1">Your pack has expired</span>
                    <span className="text-4xl font-black text-slate-900 tracking-tight leading-none flex items-start">
                      <span className="text-xl font-bold mt-1 mr-0.5">₹</span>380
                    </span>
                  </div>
                  <div className="text-right text-xs font-semibold text-slate-500 space-y-1">
                    <p className="font-bold text-slate-800">Unlimited data</p>
                    <p>28 Days validity</p>
                  </div>
                </div>

                {/* Expired status pill */}
                <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-200/40 rounded-2xl py-2.5 px-4 text-center">
                  <span className="text-xs font-black text-[#046A38] uppercase tracking-wider">Pack expired...</span>
                </div>

                {/* Repeat Recharge Button (Green) */}
                <button 
                  onClick={() => handlePackSelect(380)}
                  className="w-full py-3.5 bg-[#046A38] hover:bg-[#03522b] text-white font-extrabold rounded-full shadow-lg shadow-[#046A38]/20 transition-all active:scale-[0.98]"
                >
                  repeat recharge
                </button>
              </div>
            </div>

            {/* Explore other packs link */}
            <div className="text-center">
              <button 
                onClick={handleExplorePacks}
                className="text-xs font-black text-slate-700 underline underline-offset-4 hover:text-[#046A38] transition-colors uppercase tracking-wider"
              >
                explore other packs
              </button>
            </div>
          </div>

          {/* Quick Suggestion Chips */}
          {messages.length === 0 && (
            <div className="pt-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2.5 px-1">Quick Helpers:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Show 84 Days plans",
                  "Prepe Commission list",
                  "How to add funds?",
                  "About Prepe Services"
                ].map((chip, cIdx) => (
                  <button
                    key={cIdx}
                    onClick={() => handleSend(chip)}
                    className="text-xs font-bold bg-white text-slate-800 border border-slate-200/80 px-3.5 py-2 rounded-2xl hover:border-[#046A38] hover:text-[#046A38] transition-all shadow-sm shadow-slate-100"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Messages Render */}
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <div key={idx} className="w-full flex flex-col gap-3">
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[88%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {msg.role === 'assistant' ? (
                      <PrepeAvatar />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 flex items-center justify-center shadow-sm">
                        <span className="text-[10px] font-black text-slate-600 uppercase">{userName[0]}</span>
                      </div>
                    )}
                    
                    <div className={cn(
                      "p-4 rounded-[24px] text-sm leading-relaxed shadow-sm border",
                      msg.role === 'user' 
                        ? 'bg-slate-900 border-slate-950 text-white rounded-tr-none' 
                        : 'bg-white border-slate-100 text-slate-800 rounded-tl-none'
                    )}>
                      <div className={cn(
                        "prose prose-slate prose-sm max-w-none prose-headings:font-black prose-headings:text-slate-800",
                        "prose-table:border-collapse prose-table:border prose-table:border-slate-200 prose-table:w-full",
                        "prose-th:bg-slate-50 prose-th:p-2.5 prose-th:border prose-th:border-slate-200 prose-th:text-slate-700 prose-th:font-extrabold prose-th:text-[10px] prose-th:uppercase",
                        "prose-td:p-2.5 prose-td:border prose-td:border-slate-100 prose-td:text-slate-600 prose-td:font-semibold",
                        "prose-p:leading-relaxed prose-li:my-1 prose-img:rounded-xl",
                        msg.role === 'user' ? 'prose-invert prose-strong:text-amber-300' : 'prose-strong:text-[#046A38] prose-a:text-[#046A38] prose-a:underline'
                      )}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Standalone full-width Carousel Render outside message bubble to fix squishing / scrolling issue */}
                {msg.role === 'assistant' && msg.showCarousel && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full overflow-hidden shrink-0 mt-1"
                  >
                    <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-4 -mx-4 snap-x scrollbar-none scroll-smooth max-w-full">
                      {(realPlans.length > 0 ? realPlans : STATIC_FALLBACK_PACKS).map((pack, pIdx) => (
                        <div 
                          key={pIdx} 
                          className="snap-center shrink-0 w-[215px] bg-white rounded-3xl border border-slate-100 shadow-md shadow-slate-100/50 p-4 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                                <span className="text-lg font-bold mr-0.5">₹</span>{pack.amount}
                              </span>
                              {pack.isRecommended && (
                                <span className="bg-[#046A38] text-white text-[8px] font-black px-1.5 py-0.5 rounded leading-none shrink-0 uppercase tracking-wider">
                                  VIP
                                </span>
                              )}
                            </div>
                            
                            {/* Yellow plan tag */}
                            <div className="bg-[#FFD100]/25 rounded px-2 py-1 mb-3 text-[10px] font-bold text-slate-800 leading-none">
                              {pack.tag}
                            </div>

                            {/* Perks */}
                            <ul className="space-y-1.5 text-xs font-semibold text-slate-600 mb-4">
                              {pack.perks.slice(0, 3).map((perk, perkIdx) => (
                                <li key={perkIdx} className="flex items-center gap-1.5">
                                  <span className="text-[#046A38] font-bold text-xs shrink-0">⇅</span>
                                  <span className="truncate">{perk}</span>
                                </li>
                              ))}
                              <li className="flex items-center gap-1.5 pt-1 border-t border-slate-50">
                                <span className="text-[#046A38] font-bold text-xs shrink-0">📅</span>
                                <span>{pack.validity}</span>
                              </li>
                            </ul>
                          </div>

                          <button 
                            onClick={() => handlePackSelect(pack.amount)}
                            className="w-full py-2.5 bg-[#046A38] hover:bg-[#03522b] text-white text-xs font-extrabold rounded-full shadow-sm transition-all active:scale-[0.97]"
                          >
                            select plan
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="text-center mt-1">
                      <button 
                        onClick={() => handleSend("explore packs")} 
                        className="text-[10px] font-black text-[#046A38] uppercase tracking-wider hover:underline"
                      >
                        show more packs
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <PrepeAvatar />
                <div className="p-4 bg-white border border-slate-100 rounded-[24px] rounded-tl-none flex items-center gap-2 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#046A38] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#046A38] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#046A38] animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
          
          <div ref={scrollRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100 pb-6 shrink-0 z-30 shadow-lg">
          <div className="flex gap-2 bg-slate-50 border border-slate-200 p-2 rounded-[24px] focus-within:ring-2 focus-within:ring-[#046A38]/20 transition-all shadow-inner">
            <Input 
              placeholder="search recharge packs..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="border-none bg-transparent shadow-none focus-visible:ring-0 placeholder:text-slate-400 font-semibold"
            />
            <Button 
                onClick={() => handleSend()} 
                disabled={!input.trim() || isLoading}
                className="rounded-full w-10 h-10 p-0 bg-[#046A38] hover:bg-[#03522b] shadow-md active:scale-95 transition-all"
            >
              <Send className="w-4 h-4 text-white" />
            </Button>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-3 font-semibold">
            This feature is still in Beta and may make mistakes.
          </p>
        </div>

        {/* Exit Feedback Modal Overlay */}
        <AnimatePresence>
          {showExitModal && (
            <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-end justify-center p-4">
              <motion.div 
                initial={{ y: 150, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 150, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl flex flex-col items-center gap-6 z-50 border border-slate-100"
              >
                {/* Prepe Logo Header */}
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm p-1">
                  <img src="/logo.png" alt="PrePe Logo" className="w-full h-full object-contain" />
                </div>

                {/* Question */}
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    looks like you're leaving,
                  </h3>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    how was your experience?
                  </h3>
                </div>

                {/* 5 Interactive Stars */}
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      onClick={() => setExitRating(star)}
                      className="p-1 transition-transform active:scale-90"
                    >
                      <Star 
                        className={cn(
                          "w-8 h-8 transition-colors stroke-[1.5]", 
                          exitRating >= star 
                            ? "text-[#FFD100] fill-[#FFD100]" 
                            : "text-slate-200 fill-slate-200"
                        )} 
                      />
                    </button>
                  ))}
                </div>

                {/* Additional Feedback Chips Box */}
                <div className="w-full bg-[#F4F4F6] rounded-2xl p-4 flex flex-col gap-3">
                  <span className="text-[10px] font-black text-slate-800 text-center uppercase tracking-wider">
                    any additional feedback:
                  </span>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      "loved it, very useful",
                      "great suggestions",
                      "saved me time",
                      "accurate responses",
                      "smooth overall experience"
                    ].map((pill) => {
                      const isSelected = selectedPills.includes(pill);
                      return (
                        <button
                          key={pill}
                          onClick={() => toggleFeedbackPill(pill)}
                          className={cn(
                            "text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all select-none",
                            isSelected 
                              ? "bg-white border-[#046A38] text-[#046A38] shadow-sm font-extrabold" 
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                          )}
                        >
                          {pill}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Star rating triggered active confirm button */}
                <div className="w-full flex flex-col gap-2">
                  <button
                    onClick={handleConfirmExit}
                    className={cn(
                      "w-full py-3.5 rounded-full font-bold text-sm transition-all shadow-sm active:scale-[0.98]",
                      exitRating > 0
                        ? "bg-slate-900 text-white hover:bg-slate-800"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    )}
                    disabled={exitRating === 0}
                  >
                    confirm
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowExitModal(false);
                      setExitRating(0);
                      setSelectedPills([]);
                    }}
                    className="text-xs font-extrabold text-slate-700 underline underline-offset-4 hover:text-[#046A38] py-2 transition-colors uppercase tracking-wider"
                  >
                    go back
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </Layout>
  );
};

export default AIChat;
