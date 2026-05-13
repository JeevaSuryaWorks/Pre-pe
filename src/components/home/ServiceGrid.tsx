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
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useKYC } from "@/hooks/useKYC";
import { useToast } from "@/hooks/use-toast";
import { useActiveLoan } from "@/hooks/useActiveLoan";

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
    { bg: "bg-[#000080]/5", text: "text-[#000080]", border: "border-[#000080]/10" },  // Navy
    { bg: "bg-[#046A38]/10", text: "text-[#046A38]", border: "border-[#046A38]/20" }, // Green
  ];
  const theme = colors[index % 3];

  return (
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
      className="flex flex-col items-center group relative transition-transform active:scale-95"
    >
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
        !isApproved || (isOverdue && !isBorrowService)
          ? "bg-slate-50 opacity-40"
          : `${theme.bg} ${theme.border} border shadow-sm group-hover:scale-110`
      )}>
        <Icon className={cn(
          "w-6 h-6 transition-colors",
          !isApproved || (isOverdue && !isBorrowService)
            ? "text-slate-300"
            : theme.text
        )} strokeWidth={2.5} />
      </div>
      <span className="text-[10px] font-black text-slate-500 text-center leading-[1.1] tracking-widest mt-3 px-1 uppercase opacity-80 group-hover:opacity-100 transition-opacity">
        {label}
      </span>
    </Link>
  );
};

export const ServiceGrid = () => {
  const primaryServices = [
    { icon: Smartphone, label: "Mobile Recharge", path: "/mobile-recharge" },
    { icon: Tv, label: "DTH/TV Recharge", path: "/dth-recharge" },
    { icon: Lightbulb, label: "Electricity Payment", path: "/services/electricity" },
    { icon: Play, label: "Google Play Voucher", path: "/services/redeem-code" }
  ];

  const secondaryServices = [
    { icon: Car, label: "FasTag", path: "/services/fasttag" },
    { icon: Flame, label: "LPG Booking", path: "/services/gas-bill" },
    { icon: Droplets, label: "Water", path: "/services/water-bill" },
    { icon: SmartphoneCharging, label: "Postpaid", path: "/postpaid" },
    { icon: HandCoins, label: "Pay EMI", path: "/services/pay-bills" },
    { icon: ShieldCheck, label: "Insurance", path: "/services/insurance" },
    { icon: Wifi, label: "Broadband", path: "/services/broadband" },
    { icon: ChevronRight, label: "See All", path: "/services" },
  ];

  return (
    <div className="grid grid-cols-4 gap-y-8 gap-x-2">
      {[...primaryServices, ...secondaryServices].filter(s => s.label !== "See All").map((service, index) => (
        <ServiceItem key={index} {...service} index={index} />
      ))}
    </div>
  );
};
