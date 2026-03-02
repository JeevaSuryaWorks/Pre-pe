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
  HandCoins
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
      className={`flex flex-col items-center gap-2 group relative ${!isApproved || (isOverdue && !isBorrowService) ? 'opacity-50 grayscale cursor-not-allowed hover:bg-transparent' : ''}`}
    >
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all shadow-sm border ${!isApproved || (isOverdue && !isBorrowService)
          ? 'bg-slate-50 border-slate-100'
          : (isBorrowService && isOverdue)
            ? 'bg-red-50/50 group-hover:bg-red-100 border-red-200'
            : 'bg-green-50/50 group-hover:bg-green-100 group-hover:scale-105 active:scale-95 border-green-100/50'
        }`}>
        <Icon className={`w-7 h-7 ${!isApproved || (isOverdue && !isBorrowService)
            ? 'text-slate-400'
            : (isBorrowService && isOverdue)
              ? 'text-red-600'
              : 'text-green-700'
          }`} strokeWidth={1.5} />
      </div>
      <span className="text-[11px] font-medium text-gray-700 text-center leading-tight tracking-tight mt-1">{label}</span>

      {/* Pending Days Badge for Borrow Icon */}
      {isBorrowService && activeLoan && (
        <div className={`absolute -top-2 -right-3 px-2 py-0.5 rounded-full text-[9px] font-bold shadow-sm whitespace-nowrap border ${activeLoan.is_overdue
            ? 'bg-red-500 text-white border-red-600 animate-pulse'
            : 'bg-amber-400 text-amber-950 border-amber-500'
          }`}>
          {activeLoan.is_overdue ? "Overdue" : `${activeLoan.days_remaining}d Left`}
        </div>
      )}
    </Link>
  );
};

export const ServiceGrid = () => {
  const services = [
    { icon: Smartphone, label: "Prepaid", path: "/mobile-recharge" }, // Matches 'Prepaid'
    { icon: HandCoins, label: "Borrow", path: "/dnpl" },
    { icon: Tv, label: "DTH", path: "/dth-recharge" }, // Matches 'DTH'
    { icon: Lightbulb, label: "Electricity", path: "/services/electricity" }, // Matches 'Electricity'
    { icon: Play, label: "Redeem Code", path: "/services/redeem-code" }, // Matches 'Redeem Code' (Google Play icon usually)
    { icon: Car, label: "FastTag", path: "/services/fasttag" }, // Matches 'FasTag'
    { icon: SmartphoneCharging, label: "Postpaid", path: "/postpaid" }, // Matches 'Postpaid'
    { icon: Phone, label: "Landline", path: "/services/landline" }, // Matches 'Landline'
    { icon: Flame, label: "Gas Bill", path: "/services/gas-bill" }, // Matches 'Gas Bill'
    { icon: Droplets, label: "Water Bill", path: "/services/water-bill" }, // Matches 'Water Bill'
    { icon: ShieldCheck, label: "Insurance", path: "/services/insurance" }, // Matches 'Insurance'
    { icon: Wifi, label: "Broadband", path: "/services/broadband" }, // Matches 'Broadband'
    { icon: Receipt, label: "Pay Bills", path: "/services/pay-bills" }, // Matches 'Pay Bills'
  ];

  return (
    <div className="bg-white m-4 rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-900 text-sm mb-5">Recharge And Bills</h3>
      <div className="grid grid-cols-4 gap-y-6 gap-x-2">
        {services.map((service, index) => (
          <ServiceItem key={index} {...service} isBorrowService={service.label === "Borrow"} />
        ))}
      </div>
    </div>
  );
};
