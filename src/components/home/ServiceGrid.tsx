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

const ServiceItem = ({ icon: Icon, label, path, isBorrowService }: ServiceItemProps) => {
  const { isApproved } = useKYC();
  const { data: activeLoan } = useActiveLoan();
  const { toast } = useToast();

  const isOverdue = activeLoan?.is_overdue;

  return (
    <Link
      to={(isApproved && (!isOverdue || isBorrowService)) ? path : "#"}
      onClick={(e) => {
        if (!isApproved) {
          e.preventDefault();
          toast({
            title: "KYC Required",
            description: "Please wait for your KYC to be approved to use this service.",
            variant: "destructive"
          });
          return;
        }
        if (isOverdue && !isBorrowService) {
          e.preventDefault();
          toast({
            title: "Account Restricted",
            description: "Please clear your pending loan dues to continue using services.",
            variant: "destructive"
          });
        }
      }}
      className={`flex flex-col items-center gap-1.5 group relative`}
    >
      <div className={`w-[52px] h-[52px] rounded-[18px] flex items-center justify-center transition-all ${
        !isApproved || (isOverdue && !isBorrowService)
          ? "bg-slate-50 opacity-60"
          : "bg-blue-50/70 hover:bg-blue-100/70"
      }`}>
        <Icon className={`w-6 h-6 ${
          !isApproved || (isOverdue && !isBorrowService)
            ? "text-slate-400"
            : "text-[#0046BE]"
        }`} strokeWidth={1.5} />
      </div>
      <span className="text-[11px] font-bold text-slate-700 text-center leading-[1.1] tracking-tight mt-1 px-1 h-8 flex items-start justify-center">
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
    { icon: ShieldCheck, label: "LIC/Insurance", path: "/services/insurance" },
    { icon: Wifi, label: "Broadband", path: "/services/broadband" }, 
    { icon: ChevronRight, label: "See All", path: "/services" },
  ];

  return (
    <div className="flex flex-col w-full">
      {/* Primary Row */}
      <div className="px-4 py-2 mt-2 mb-1">
        <div className="grid grid-cols-4 gap-2">
          {primaryServices.map((service, index) => (
            <ServiceItem key={index} {...service} />
          ))}
        </div>
      </div>

      {/* Secondary Card Layout */}
      <div className="mx-4 mt-2 mb-6">
        <div className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-extrabold text-slate-900 text-[15px] tracking-tight">Recharge & Bills</h3>
            <Link to="/services" className="bg-blue-50/80 text-blue-600 px-3 py-1 rounded-full text-[11px] font-bold hover:bg-blue-100 transition-colors">
              View All
            </Link>
          </div>
          
          <div className="grid grid-cols-4 gap-y-5 gap-x-2">
            {secondaryServices.map((service, index) => (
              <ServiceItem key={index} {...service} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
