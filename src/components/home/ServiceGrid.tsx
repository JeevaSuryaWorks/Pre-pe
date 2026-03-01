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

interface ServiceItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
}

const ServiceItem = ({ icon: Icon, label, path }: ServiceItemProps) => {
  const { isApproved } = useKYC();
  const { toast } = useToast();

  return (
    <Link
      to={isApproved ? path : "#"}
      onClick={(e) => {
        if (!isApproved) {
          e.preventDefault();
          toast({
            title: "KYC Required",
            description: "Please wait for your KYC to be approved to use this service.",
            variant: "destructive"
          });
        }
      }}
      className={`flex flex-col items-center gap-2 group ${!isApproved ? 'opacity-50 grayscale cursor-not-allowed hover:bg-transparent' : ''}`}
    >
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all shadow-sm border ${!isApproved ? 'bg-slate-50 border-slate-100' : 'bg-green-50/50 group-hover:bg-green-100 group-hover:scale-105 active:scale-95 border-green-100/50'}`}>
        <Icon className={`w-7 h-7 ${!isApproved ? 'text-slate-400' : 'text-green-700'}`} strokeWidth={1.5} />
      </div>
      <span className="text-[11px] font-medium text-gray-700 text-center leading-tight tracking-tight mt-1">{label}</span>
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
          <ServiceItem key={index} {...service} />
        ))}
      </div>
    </div>
  );
};
