import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

interface Provider {
    id: string;
    name: string;
    logo?: string;
}

interface SelectProviderPageProps {
    type: 'dth' | 'electricity' | 'broadband' | 'gas' | 'water';
    title?: string;
}

export const SelectProviderPage = ({ type, title = "Select Provider" }: SelectProviderPageProps) => {
    const [searchQuery, setSearchQuery] = useState("");

    const getProviders = (type: string): { recent: Provider[], all: Provider[] } => {
        // Mock Data based on type
        if (type === 'dth') {
            return {
                recent: [
                    { id: 'd2h', name: 'Videocon D2H', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/D2h_logo.jpg' },
                    { id: 'tatasky', name: 'Tata Play', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Tata_Play_2022_logo.svg' },
                    { id: 'sundirect', name: 'Sun Direct TV', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/SD-HD-Logo.svg' },
                ],
                all: [
                    { id: 'airtel', name: 'Airtel DTH', logo: 'https://s3-ap-southeast-1.amazonaws.com/bsy/iportal/images/airtel-logo-red-text-horizontal.jpg' },
                    { id: 'dishtv', name: 'Dish TV', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/DishTV_logo_%282025%29.svg/250px-DishTV_logo_%282025%29.svg.png?_=20251024063354' },
                    { id: 'sundirect', name: 'Sun Direct TV', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/SD-HD-Logo.svg' },
                    { id: 'tatasky', name: 'Tata Play', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Tata_Play_2022_logo.svg' },
                    { id: 'd2h', name: 'Videocon D2H', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/D2h_logo.jpg' },
                ]
            };
        }
        if (type === 'broadband') {
            return {
                recent: [
                    { id: 'airtel_broadband', name: 'Airtel Broadband', logo: 'https://companieslogo.com/img/orig/BHARTIARTL.NS-40393f9b.png' },
                    { id: 'jio_fiber', name: 'Jio Fiber', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Reliance_Jio_Logo.svg' }
                ],
                all: [
                    { id: 'act_corp', name: 'ACT Fibernet', logo: '' },
                    { id: 'airtel_broadband', name: 'Airtel Broadband', logo: 'https://companieslogo.com/img/orig/BHARTIARTL.NS-40393f9b.png' },
                    { id: 'all_broadband', name: 'Alliance Broadband Services Pvt. Ltd.', logo: '' },
                    { id: 'bsnl_broadband', name: 'BSNL Broadband', logo: '' },
                    { id: 'gtpl', name: 'GTPL Broadband', logo: '' },
                    { id: 'hathway', name: 'Hathway Broadband', logo: '' },
                    { id: 'jio_fiber', name: 'Jio Fiber', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Reliance_Jio_Logo.svg' },
                    { id: 'tata_play_fiber', name: 'Tata Play Fiber', logo: '' },
                ]
            };
        }

        if (type === 'gas') {
            return {
                recent: [],
                all: [
                    { id: 'indane', name: 'Indane Gas', logo: '' },
                    { id: 'hp', name: 'HP Gas', logo: '' },
                    { id: 'bharat', name: 'Bharat Gas', logo: '' },
                ]
            };
        }

        if (type === 'water') {
            return {
                recent: [],
                all: [
                    { id: 'bwssb', name: 'Bangalore Water Supply and Sewerage Board', logo: '' },
                    { id: 'djb', name: 'Delhi Jal Board', logo: '' },
                    { id: 'mcgm', name: 'Municipal Corporation of Greater Mumbai', logo: '' },
                ]
            };
        }

        // Default / Electricity
        return {
            recent: [
                { id: 'tneb', name: 'Tamil Nadu Electricity Board (TNEB)', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/90/TANGEDCO_Logo.png/220px-TANGEDCO_Logo.png' }
            ],
            all: [
                { id: 'adani', name: 'Adani Electricity - MUMBAI', logo: '' },
                { id: 'ajmer', name: 'Ajmer Vidyut Vitran Nigam Limited (AVVNL)', logo: '' },
                { id: 'puducherry', name: 'Government of Puducherry Electricity Department', logo: '' },
                { id: 'apdcl', name: 'Assam Power Distribution Company Limited (APDCL)', logo: '' },
                { id: 'bescom', name: 'Bangalore Electricity Supply Co. Ltd (BESCOM)', logo: '' },
                { id: 'besl', name: 'Bharatpur Electricity Services Ltd. (BESL)', logo: '' },
                { id: 'bkesl', name: 'Bikaner Electricity Supply Limited (BkESL)', logo: '' },
                { id: 'bses', name: 'BSES Rajdhani Power Limited', logo: '' },
            ]
        };
    };

    const { recent, all } = getProviders(type);
    const filteredAll = all.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const navigate = useNavigate();

    const handleProviderClick = (provider: Provider) => {
        if (type === 'dth') {
            navigate(`/dth-recharge/enter-details?operator=${provider.id}`);
        } else if (type === 'electricity') {
            navigate(`/services/electricity/details?operator=${provider.id}`);
        } else {
            // For other services, navigate to the bill fetch details entry page
            navigate(`/bills/fetch?operatorId=${provider.id}`);
        }
    };

    return (
        <Layout title={title} showBack>
            <div className="bg-blue-50/30 min-h-screen">
                {/* Custom Header Extension for Branding - if standard header doesn't have it */}
                <div className="absolute top-3 right-4 z-50">
                    <img
                        src="/bharat-connect.svg"
                        alt="Bharat Connect"
                        className="h-8 w-auto object-contain"
                    />
                </div>

                <div className="p-4 space-y-6">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by Provider's Name"
                            className="pl-9 h-12 bg-white border-gray-200 rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Recent Providers */}
                    {!searchQuery && recent.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-slate-700">Recent Providers</h3>
                            <div className="space-y-3">
                                {recent.map(provider => (
                                    <div
                                        key={provider.id}
                                        className="flex items-center gap-4 bg-blue-100/50 p-3 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
                                        onClick={() => handleProviderClick(provider)}
                                    >
                                        <Avatar className="h-10 w-10 bg-white p-1">
                                            <AvatarImage src={provider.logo} className="object-contain" />
                                            <AvatarFallback>{provider.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium text-slate-700">{provider.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All Providers */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-slate-700">All Provider</h3>
                        <div className="space-y-3">
                            {filteredAll.map(provider => (
                                <div
                                    key={provider.id}
                                    className="flex items-center gap-4 bg-blue-100/50 p-3 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
                                    onClick={() => handleProviderClick(provider)}
                                >
                                    <Avatar className="h-10 w-10 bg-white p-1">
                                        <AvatarImage src={provider.logo} className="object-contain" />
                                        <AvatarFallback className="text-xs bg-slate-100">{provider.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium text-slate-700">{provider.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
};
