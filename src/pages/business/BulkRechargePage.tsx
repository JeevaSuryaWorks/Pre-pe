import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUp, Users, History, Download, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BulkRechargePage = () => {
    const navigate = useNavigate();

    return (
        <Layout title="Bulk Recharge" showBack showBottomNav>
            <div className="container max-w-md mx-auto py-6 px-4 space-y-6">
                {/* Hero section */}
                <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full w-fit mb-2">BUSINESS ONLY</div>
                        <h1 className="text-2xl font-black italic tracking-tight mb-2">FOR MERCHANTS</h1>
                        <p className="text-sm text-slate-300">Recharge 100+ numbers in seconds using Excel upload.</p>
                    </div>
                    <FileUp className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 rotate-12" />
                </div>

                {/* Main tools */}
                <div className="grid grid-cols-1 gap-4">
                    <Card className="border-slate-100 shadow-sm hover:border-indigo-200 transition-colors cursor-pointer group">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="bg-indigo-50 p-3 rounded-2xl group-hover:bg-indigo-100 transition-colors">
                                <FileUp className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-800">Excel Upload</h3>
                                <p className="text-xs text-slate-400">Download template & upload</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-100 shadow-sm hover:border-emerald-200 transition-colors cursor-pointer group">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="bg-emerald-50 p-3 rounded-2xl group-hover:bg-emerald-100 transition-colors">
                                <Users className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-800">Phone Directory</h3>
                                <p className="text-xs text-slate-400">Manage business groups</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-100 shadow-sm hover:border-blue-200 transition-colors cursor-pointer group">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="bg-blue-50 p-3 rounded-2xl group-hover:bg-blue-100 transition-colors">
                                <History className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-800">Bulk History</h3>
                                <p className="text-xs text-slate-400">Download GST invoices</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Info Card */}
                <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 flex items-start gap-4">
                    <ShieldCheck className="w-6 h-6 text-blue-500 shrink-0" />
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-blue-900">Enterprise Grade</h4>
                        <p className="text-xs text-blue-800/70 leading-relaxed">
                            Bulk tools are currently in semi-private beta for our Business Plan partners. Need custom API access? Contact our sales team.
                        </p>
                    </div>
                </div>

                <div className="pt-4">
                    <Button 
                        variant="secondary" 
                        onClick={() => navigate('/home')}
                        className="w-full h-12 rounded-xl font-bold text-slate-500 border-2 border-slate-100"
                    >
                        Back to Home
                    </Button>
                </div>
            </div>
        </Layout>
    );
};

export default BulkRechargePage;
