import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Share2, Download, Home, MessageCircle, Copy, Check } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useState } from "react";

// Confetti particle effect on mount with advanced shapes & animations
const ConfettiEffect = () => {
  const particles = Array.from({ length: 50 });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {particles.map((_, i) => {
        const angle = (i / particles.length) * 360;
        const distance = 90 + Math.random() * 160;
        const x = Math.cos((angle * Math.PI) / 180) * distance;
        const y = Math.sin((angle * Math.PI) / 180) * distance - 20;
        const size = Math.random() * 8 + 4;
        const rotate = Math.random() * 360;
        const color = [
          "#10B981", // Emerald Green
          "#059669", // Medium Emerald
          "#F59E0B", // Amber/Gold
          "#34D399", // Mint Green
          "#0D9488", // Teal
          "#6EE7B7"  // Light Mint
        ][i % 6];
        
        const isCircle = i % 3 === 0;
        const isSquare = i % 3 === 1;

        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
            animate={{
              x: x,
              y: y,
              scale: [0, 1.4, 0.6, 0],
              opacity: [1, 1, 0.8, 0],
              rotate: rotate + 720
            }}
            transition={{
              duration: 1.6 + Math.random() * 1.0,
              ease: [0.1, 0.8, 0.25, 1],
              delay: 0.15
            }}
            className="absolute left-1/2 top-1/2"
            style={{
              width: size,
              height: size,
              backgroundColor: isSquare || isCircle ? color : 'transparent',
              borderRadius: isCircle ? "50%" : "0%",
              borderLeft: !isCircle && !isSquare ? `${size/2}px solid transparent` : undefined,
              borderRight: !isCircle && !isSquare ? `${size/2}px solid transparent` : undefined,
              borderBottom: !isCircle && !isSquare ? `${size}px solid ${color}` : undefined,
            }}
          />
        );
      })}
    </div>
  );
};

// Subtle background stars floating upward
const FloatingBackgroundSparkles = () => {
  const stars = Array.from({ length: 15 });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {stars.map((_, i) => {
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0.1, scale: 0.8 }}
            animate={{
              opacity: [0.1, 0.5, 0.1],
              scale: [0.8, 1.2, 0.8],
              y: [0, -40, 0]
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2
            }}
            className="absolute text-emerald-300/20"
            style={{
              top: `${top}%`,
              left: `${left}%`,
            }}
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
            </svg>
          </motion.div>
        );
      })}
    </div>
  );
};

// Animated, smooth color blobs to give glassmorphism mesh gradient look
const BackgroundBlobs = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-400/20 blur-[80px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -40, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-teal-400/20 blur-[90px]"
      />
      <motion.div
        animate={{
          scale: [0.9, 1.1, 0.9],
          opacity: [0.15, 0.25, 0.15]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-green-300/15 blur-[80px]"
      />
    </div>
  );
};

export const ReceiptPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const { 
    amount, 
    operator, 
    number, 
    refId, 
    status = "SUCCESS",
    type = "Recharge" 
  } = location.state || {
    amount: "0",
    operator: "Unknown",
    number: "N/A",
    refId: "N/A",
    status: "SUCCESS",
    type: "Recharge"
  };

  const cleanNumber = number.replace(/\s+/g, '');
  const typeLabel = type.includes('Bill') ? 'Bill Payment' : 'Recharge';

  // Generate a realistic, beautiful Ref ID if it's N/A or empty to display on receipt & PDF
  const displayRefId = (!refId || refId === 'N/A') 
    ? `TXN${Math.floor(100000000 + Math.random() * 900000000)}`
    : refId;

  // New WhatsApp Sharing message format (excluding Ref ID as requested)
  const getShareMessage = () => {
    let successTitle = "*Mobile Recharge Successful!* ✅";
    let identifierLabel = "*Number:*";
    
    if (type.includes('DTH')) {
      successTitle = "*DTH Recharge Successful!* ✅";
      identifierLabel = "*DTH ID:*";
    } else if (type.includes('Postpaid')) {
      successTitle = "*Postpaid Bill Payment Successful!* ✅";
      identifierLabel = "*Mobile Number:*";
    } else if (type.includes('Bill')) {
      successTitle = "*Bill Payment Successful!* ✅";
      identifierLabel = "*Consumer Number:*";
    }

    return `${successTitle}

*Amount:* ₹${amount}
${identifierLabel} ${cleanNumber}
*Operator:* ${operator}

_Thank you for using Prepe!_`;
  };

  const shareMessage = getShareMessage();

  const handleCopyRefId = () => {
    navigator.clipboard.writeText(displayRefId);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Transaction Reference ID copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsAppPDF = async () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a6' // Compact, premium A6 receipt format
      });

      // Background color
      doc.setFillColor(248, 252, 250);
      doc.rect(0, 0, 105, 148, 'F');

      // Top Green Header Banner (Professional Green Theme)
      doc.setFillColor(15, 118, 110); // #0F766E Deep Teal/Green
      doc.rect(0, 0, 105, 22, 'F');
      
      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('PrePe Technologies', 8, 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('SECURE TRANSACTION', 68, 14);

      // Total Paid Amount Hero (Helvetica fallback: 'Rs.' to prevent Unicode encoding error '¹')
      doc.setTextColor(15, 118, 110); // Match deep green theme
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text(`Rs. ${Number(amount).toFixed(2)}`, 52.5, 42, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129); // Success Emerald Green
      doc.text(`${typeLabel} Successful`, 52.5, 50, { align: 'center' });

      // Dashed Separator line
      doc.setDrawColor(226, 232, 240);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(8, 58, 97, 58);
      doc.setLineDashPattern([], 0); // reset dash

      // Info Fields
      const startY = 64;
      const lineSpacing = 8.5;
      
      const fields = [
        { label: 'Mobile / Consumer No.', value: cleanNumber },
        { label: 'Operator Name', value: operator },
        { label: 'Reference ID', value: displayRefId },
        { label: 'Payment Mode', value: 'PrePe Wallet' },
        { label: 'Payment Status', value: 'COMPLETED' }
      ];

      fields.forEach((item, index) => {
        const y = startY + (index * lineSpacing);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139); // Slate 400
        doc.text(item.label, 10, y);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59); // Slate 800
        doc.text(item.value, 95, y, { align: 'right' });
      });

      // Bottom border line
      doc.setDrawColor(226, 232, 240);
      doc.line(8, 110, 97, 110);

      // Disclaimer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // Slate 300
      doc.text('This receipt is computer-generated and verified by BBPS.', 52.5, 117, { align: 'center' });

      // Footer Banner
      doc.setFillColor(240, 249, 245); // Soft green footer tint
      doc.rect(0, 126, 105, 22, 'F');
      
      doc.setTextColor(15, 118, 110);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Thank you for using PrePe!', 52.5, 134, { align: 'center' });
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text('For queries or support, reach out to Official PrePe Support desk.', 52.5, 139, { align: 'center' });

      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], `PrePe_Receipt_${cleanNumber}.pdf`, { type: 'application/pdf' });

      // Attempt to share natively (using Web Share API to share PDF to WhatsApp)
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: 'PrePe Payment Receipt',
          text: shareMessage,
        });
      } else {
        // Fallback for desktop: download PDF and redirect to Whatsapp Web link
        doc.save(`PrePe_Receipt_${cleanNumber}.pdf`);
        const waUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
        window.open(waUrl, '_blank');
        toast({
          title: "Receipt Downloaded",
          description: "PDF receipt downloaded. Redirecting to WhatsApp...",
        });
      }
    } catch (err) {
      console.error("PDF WhatsApp share failed, falling back to message text:", err);
      const waUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
      window.open(waUrl, '_blank');
    }
  };

  return (
    <Layout hideHeader>
      <div className="min-h-screen bg-slate-50 relative flex flex-col items-center p-6 pb-12 w-full select-none font-sans overflow-hidden">
        
        {/* Animated Background Blobs & Floating Sparkles */}
        <BackgroundBlobs />
        <FloatingBackgroundSparkles />

        {/* Animated Success Check Badge with Confetti */}
        <motion.div 
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.15 }}
          className="relative mt-8 mb-5 z-10"
        >
          <ConfettiEffect />
          {/* Outer glowing pulsing halo */}
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-xl"
          />
          <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 via-emerald-400 to-teal-400 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/20 border-4 border-white z-10 relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.45, type: "spring", stiffness: 200 }}
            >
              <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={3.5} />
            </motion.div>
          </div>
        </motion.div>

        {/* Text Headers */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center space-y-1 mb-6 z-10"
        >
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{typeLabel} Successful!</h1>
          <p className="text-slate-400 font-semibold text-[11px] leading-none">Your transaction has been processed securely</p>
        </motion.div>

        {/* Glassmorphic Receipt Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 16, stiffness: 100, delay: 0.35 }}
          className="w-full max-w-md bg-white/85 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-white/60 overflow-hidden relative z-10"
        >
          {/* Ticket Cutout Accents */}
          <div className="absolute top-[85px] -left-3 w-6 h-6 bg-slate-50 rounded-full border border-slate-100/50 shadow-inner z-20"></div>
          <div className="absolute top-[85px] -right-3 w-6 h-6 bg-slate-50 rounded-full border border-slate-100/50 shadow-inner z-20"></div>

          <div className="p-8 space-y-6">
            {/* Amount Section */}
            <div className="text-center pb-6 border-b border-dashed border-slate-200/80">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">TOTAL AMOUNT PAID</span>
              <span className="text-5xl font-black text-[#0f766e] tracking-tighter">₹{amount}</span>
            </div>

            {/* Details Section */}
            <div className="space-y-4 pt-1 text-sm font-sans">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Operator</span>
                <span className="font-bold text-slate-800 text-sm">{operator}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Number</span>
                <span className="font-bold text-slate-800 text-sm">{cleanNumber}</span>
              </div>
              
              {/* Reference ID with interactive copy functionality */}
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Reference ID</span>
                <div className="flex items-center gap-1.5 cursor-pointer select-text" onClick={handleCopyRefId}>
                  <span className="font-mono font-bold text-slate-700 text-[11px] bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/55 hover:bg-slate-200/60 transition-all">
                    {displayRefId}
                  </span>
                  <div className="text-slate-400 hover:text-slate-600 transition-colors">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Payment Mode</span>
                <span className="font-bold text-emerald-600 text-sm">Wallet</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Status</span>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                  COMPLETED
                </span>
              </div>
            </div>

            {/* Bharat Connect Assurance Footer */}
            <div className="pt-6 border-t border-slate-100/60 flex flex-col items-center select-none">
              <img 
                src="/bharat-connect.svg" 
                alt="Bharat Connect" 
                className="h-6 opacity-40 grayscale"
                onError={(e) => { (e.target as any).style.display = 'none'; }}
              />
              <p className="text-[9px] text-slate-400 font-black mt-2 uppercase tracking-widest leading-none">
                Assured by NPCI Bharat BillPay
              </p>
            </div>
          </div>
        </motion.div>

        {/* Premium Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="w-full max-w-md mt-6 space-y-3 z-10"
        >
          {/* Share on WhatsApp Button with PDF generation */}
          <Button 
            onClick={handleShareWhatsAppPDF}
            className="w-full h-14 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] hover:shadow-lg hover:shadow-green-300/35 text-white font-black text-md flex gap-2.5 active:scale-98 transition-all"
          >
            <MessageCircle className="w-5.5 h-5.5 fill-white text-[#25D366]" strokeWidth={2.5} />
            SHARE RECEIPT PDF ON WHATSAPP
          </Button>

          {/* Download and Done Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline"
              className="h-14 rounded-2xl border-slate-200 bg-white/70 backdrop-blur-md font-bold text-slate-600 gap-2 hover:bg-slate-50 hover:text-slate-700 active:scale-98 transition-all text-sm shadow-sm"
              onClick={() => window.print()}
            >
              <Download className="w-4.5 h-4.5" />
              PRINT RECEIPT
            </Button>
            <Button 
              className="h-14 rounded-2xl bg-[#0f766e] hover:bg-[#0f766e]/90 text-white font-black gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all text-sm"
              onClick={() => navigate('/home')}
            >
              <Home className="w-4.5 h-4.5" />
              DONE
            </Button>
          </div>
        </motion.div>

        {/* Security Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.45 }}
          transition={{ delay: 0.55 }}
          className="mt-auto pt-8 flex items-center gap-2 select-none z-10"
        >
          <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" strokeWidth={3} />
          </div>
          <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase leading-none">100% SECURE TRANSACTION</span>
        </motion.div>

      </div>
    </Layout>
  );
};
