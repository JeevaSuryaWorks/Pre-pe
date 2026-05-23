import { useState, useEffect } from "react";
import {
  Smartphone,
  Tv,
  Play,
  Car,
  Lightbulb,
  SmartphoneCharging,
  Phone,
  Flame,
  Droplets,
  ShieldCheck,
  Wifi,
  Receipt,
  HandCoins,
  ChevronRight,
  Gift
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useKYC } from "@/hooks/useKYC";
import { useToast } from "@/hooks/use-toast";
import { useActiveLoan } from "@/hooks/useActiveLoan";
import { motion, AnimatePresence } from "framer-motion";

const OPERATOR_LOGOS = [
  { name: 'Jio', path: '/logos/jio_new.svg', color: 'bg-white' },
  { name: 'Airtel', path: '/logos/airtel_new.svg', color: 'bg-white' },
  { name: 'Vi', path: '/logos/vi_new.svg', color: 'bg-white' },
  { name: 'BSNL', path: '/logos/bsnl_new.png', color: 'bg-white' }
];

interface ServiceItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  isBorrowService?: boolean;
}

const ServiceItem = ({ icon: Icon, label, path, isBorrowService, index = 0 }: ServiceItemProps & { index?: number }) => {
  const { isApproved } = useKYC();
  const { data: activeLoan } = useActiveLoan();
  const { toast } = useToast();

  const isOverdue = activeLoan?.is_overdue;

  // Tricolor pattern logic
  const colors = [
    { bg: "bg-[#FF671F]/10", text: "text-[#FF671F]", border: "border-[#FF671F]/20" }, // Saffron
    { bg: "bg-[#046A38]/10", text: "text-[#046A38]", border: "border-[#046A38]/20" }, // Green
  ];
  const theme = colors[index % 2];
  const [logoIndex, setLogoIndex] = useState(0);

  useEffect(() => {
    if (label === "Mobile Recharge") {
      const timer = setInterval(() => {
        setLogoIndex((prev) => (prev + 1) % OPERATOR_LOGOS.length);
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [label]);

  const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4 }
    }
  };

  return (
    <motion.div variants={itemVariants}>
      <Link
        to={(isApproved && (!isOverdue || isBorrowService)) ? path : "#"}
        onClick={(e) => {
          if (!isApproved) {
            e.preventDefault();
            toast({
              title: "Verification Required",
              description: "Please complete your KYC to unlock this premium service.",
              variant: "destructive"
            });
            return;
          }
          if (isOverdue && !isBorrowService) {
            e.preventDefault();
            toast({
              title: "Plan Restricted",
              description: "Account access restricted due to pending dues.",
              variant: "destructive"
            });
          }
        }}
        className="flex flex-col items-center group relative transition-all active:scale-90"
      >
        <motion.div
          whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 overflow-hidden",
            !isApproved || (isOverdue && !isBorrowService)
              ? "bg-slate-50 opacity-40"
              : label === "Mobile Recharge"
                ? `${OPERATOR_LOGOS[logoIndex].color} shadow-lg`
                : `${theme.bg} ${theme.border} border shadow-sm group-hover:shadow-md group-hover:bg-white`
          )}
        >
          <AnimatePresence mode="wait">
            {label === "Mobile Recharge" ? (
              <motion.div
                key={OPERATOR_LOGOS[logoIndex].name}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full flex items-center justify-center p-2"
              >
                <img
                  src={OPERATOR_LOGOS[logoIndex].path}
                  alt={OPERATOR_LOGOS[logoIndex].name}
                  className="w-full h-full object-contain"
                />
              </motion.div>
            ) : (
              <Icon className={cn(
                "w-6 h-6 transition-colors",
                !isApproved || (isOverdue && !isBorrowService)
                  ? "text-slate-300"
                  : theme.text
              )} strokeWidth={2.5} />
            )}
          </AnimatePresence>
        </motion.div>
        <span className="text-[10px] font-black text-slate-500 text-center leading-[1.1] tracking-widest mt-3 px-1 uppercase opacity-80 group-hover:opacity-100 transition-opacity">
          {label}
        </span>
      </Link>
    </motion.div>
  );
};

export const ServiceGrid = () => {
  const primaryServices = [
    { icon: Smartphone, label: "Mobile Recharge", path: "/mobile-recharge" },
    { icon: Tv, label: "DTH Recharge", path: "/dth-recharge" },
    { icon: Lightbulb, label: "Electricity Payment", path: "/services/electricity" },
    { icon: Play, label: "Google Play", path: "/services/redeem-code" },
    { icon: SmartphoneCharging, label: "Postpaid", path: "/services/postpaid" }
  ];

  const secondaryServices = [
    { icon: Wifi, label: "Broadband", path: "/services/broadband" },
    { icon: Flame, label: "LPG Booking", path: "/services/gas-bill" },
    { icon: Droplets, label: "Water", path: "/services/water-bill" },
    { icon: HandCoins, label: "Pay EMI", path: "/services/pay-bills" },
    { icon: ShieldCheck, label: "Insurance", path: "/services/insurance" },
    { icon: Car, label: "FasTag", path: "/services/fasttag" },
    { icon: Gift, label: "Gift Voucher", path: "/services/gift-cards" },
  ];

  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  return (
    <motion.div
      variants={gridVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-4 gap-y-8 gap-x-2"
    >
      {[...primaryServices, ...secondaryServices].filter(s => s.label !== "See All").map((service, index) => (
        <ServiceItem key={index} {...service} index={index} />
      ))}
    </motion.div>
  );
};
