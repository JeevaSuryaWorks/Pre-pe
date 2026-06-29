import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { API_BASE_URL } from "@/utils/api-config";
import { 
    MessageSquare, 
    RefreshCw, 
    Send, 
    CheckCircle2, 
    XCircle, 
    AlertCircle, 
    Loader2, 
    QrCode, 
    Activity, 
    Clock, 
    Check, 
    HelpCircle,
    Unplug
} from "lucide-react";

interface AutomationLog {
    id: string;
    transaction_id: string | null;
    customer_phone: string;
    message_type: string;
    message_content: string;
    status: 'PENDING' | 'SENT' | 'FAILED';
    error_message: string | null;
    created_at: string;
}

export const Automation = () => {
    const { toast } = useToast();
    const [status, setStatus] = useState<'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'>('DISCONNECTED');
    const [linkedPhone, setLinkedPhone] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [loadingQr, setLoadingQr] = useState(false);
    const [logs, setLogs] = useState<AutomationLog[]>([]);
    const [totalLogs, setTotalLogs] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingLogs, setLoadingLogs] = useState(false);
    
    // Test Tool State
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('PrePe Automation test: Your recharge of ₹239 for Jio Mobile is successful. Ref: TXN-TEST');
    const [sendingTest, setSendingTest] = useState(false);

    useEffect(() => {
        loadStatus();
        loadLogs();
        
        // Auto-refresh status and logs every 10 seconds
        const interval = setInterval(() => {
            loadStatus();
            loadLogs();
        }, 10000);

        return () => clearInterval(interval);
    }, [page]);

    const getHeaders = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`
        };
    };

    const loadStatus = async () => {
        try {
            const headers = await getHeaders();
            const res = await fetch(`${API_BASE_URL}/automation/status`, { headers });
            if (res.ok) {
                const data = await res.json();
                setStatus(data.status);
                setLinkedPhone(data.phone);
                
                // If disconnected and no QR loaded, fetch QR
                if (data.status === 'DISCONNECTED' && !qrCode && !loadingQr) {
                    loadQr();
                }
            }
        } catch (error) {
            console.error("Failed to load automation status:", error);
        } finally {
            setLoadingStatus(false);
        }
    };

    const loadQr = async () => {
        setLoadingQr(true);
        try {
            const headers = await getHeaders();
            const res = await fetch(`${API_BASE_URL}/automation/qr`, { headers });
            if (res.ok) {
                const data = await res.json();
                setQrCode(data.qr);
            }
        } catch (error) {
            console.error("Failed to load QR code:", error);
        } finally {
            setLoadingQr(false);
        }
    };

    const handleReconnect = async () => {
        setLoadingStatus(true);
        setQrCode(null);
        try {
            const headers = await getHeaders();
            const res = await fetch(`${API_BASE_URL}/automation/reconnect`, {
                method: 'POST',
                headers
            });
            if (res.ok) {
                toast({
                    title: "Authentication Restarted",
                    description: "Generating new session QR code...",
                });
                setTimeout(() => {
                    loadStatus();
                    loadQr();
                }, 2000);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to restart session.",
                variant: "destructive"
            });
        } finally {
            setLoadingStatus(false);
        }
    };

    const loadLogs = async () => {
        setLoadingLogs(true);
        try {
            const headers = await getHeaders();
            const res = await fetch(`${API_BASE_URL}/automation/logs?page=${page}&limit=8`, { headers });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setLogs(data.logs);
                    setTotalLogs(data.pagination.total);
                    setTotalPages(data.pagination.pages);
                }
            }
        } catch (error) {
            console.error("Failed to load logs:", error);
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleSendTest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testPhone || !testMessage) {
            toast({
                title: "Invalid Input",
                description: "Please fill in all test fields.",
                variant: "destructive"
            });
            return;
        }

        setSendingTest(true);
        try {
            const headers = await getHeaders();
            const res = await fetch(`${API_BASE_URL}/automation/test-message`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ phone: testPhone, message: testMessage })
            });

            if (res.ok) {
                toast({
                    title: "Success",
                    description: "Test WhatsApp alert sent successfully!",
                });
                setTestPhone('');
                loadLogs();
            } else {
                const errData = await res.json();
                toast({
                    title: "Delivery Failed",
                    description: errData.message || "Failed to send message.",
                    variant: "destructive"
                });
            }
        } catch (error: any) {
            toast({
                title: "Connection Error",
                description: "Failed to contact the backend automation server.",
                variant: "destructive"
            });
        } finally {
            setSendingTest(false);
        }
    };

    const totalSent = totalLogs;
    const successfulSent = logs.filter(l => l.status === 'SENT').length;
    const successRate = totalLogs > 0 ? ((logs.filter(l => l.status === 'SENT').length / Math.max(1, logs.length)) * 100).toFixed(0) : "100";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-800 flex items-center gap-2.5">
                    <MessageSquare className="w-8 h-8 text-indigo-600" />
                    Notification Automation
                </h1>
                <p className="text-slate-500 mt-1.5 font-medium text-sm">
                    Configure and monitor automated customer success alerts triggered on completed recharges.
                </p>
            </div>

            {/* Stats Panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-slate-100 shadow-sm rounded-2xl bg-white p-6 flex items-center justify-between">
                    <div>
                        <span className="text-slate-400 text-xs font-black uppercase tracking-wider block">Connection</span>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                                status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' :
                                status === 'CONNECTING' ? 'bg-amber-500 animate-bounce' : 'bg-rose-500'
                            }`} />
                            <span className="font-extrabold text-slate-800 text-lg">
                                {status === 'CONNECTED' ? 'Online' : status === 'CONNECTING' ? 'Connecting' : 'Offline'}
                            </span>
                        </div>
                    </div>
                    <Activity className={`w-8 h-8 ${status === 'CONNECTED' ? 'text-emerald-500' : 'text-slate-300'}`} />
                </Card>

                <Card className="border-slate-100 shadow-sm rounded-2xl bg-white p-6 flex items-center justify-between">
                    <div>
                        <span className="text-slate-400 text-xs font-black uppercase tracking-wider block">Linked WhatsApp</span>
                        <span className="font-black text-slate-800 text-lg mt-1 block">
                            {linkedPhone ? `+${linkedPhone}` : 'No phone linked'}
                        </span>
                    </div>
                    <QrCode className="w-8 h-8 text-indigo-500" />
                </Card>

                <Card className="border-slate-100 shadow-sm rounded-2xl bg-white p-6 flex items-center justify-between">
                    <div>
                        <span className="text-slate-400 text-xs font-black uppercase tracking-wider block">Total Alerts Logged</span>
                        <span className="font-black text-slate-800 text-2xl mt-1 block">{totalLogs}</span>
                    </div>
                    <Clock className="w-8 h-8 text-sky-500" />
                </Card>

                <Card className="border-slate-100 shadow-sm rounded-2xl bg-white p-6 flex items-center justify-between">
                    <div>
                        <span className="text-slate-400 text-xs font-black uppercase tracking-wider block">Success Rate</span>
                        <span className="font-black text-slate-800 text-2xl mt-1 block">{successRate}%</span>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* QR Code and Connection Management */}
                <Card className="border-slate-100 shadow-sm rounded-2.5xl bg-white lg:col-span-1 flex flex-col justify-between overflow-hidden">
                    <CardHeader className="p-6 pb-4 border-b border-slate-50">
                        <CardTitle className="text-lg font-bold text-slate-800">WhatsApp Device Link</CardTitle>
                        <CardDescription className="text-slate-400">Scan QR from WhatsApp Linked Devices to link this server gateway.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 flex-1 flex flex-col items-center justify-center min-h-[350px]">
                        {loadingStatus ? (
                            <div className="flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                                <span className="text-slate-400 text-sm font-medium">Checking connection state...</span>
                            </div>
                        ) : status === 'CONNECTED' ? (
                            <div className="text-center space-y-4">
                                <div className="w-24 h-24 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto shadow-sm">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-800 text-lg">Gateway Connected</h3>
                                    <p className="text-slate-400 text-xs mt-1">Prepe is listening and will automatically notify clients via WhatsApp on recharge events.</p>
                                </div>
                                <Button 
                                    onClick={handleReconnect}
                                    variant="destructive"
                                    className="rounded-xl font-bold h-11 shadow-sm px-6"
                                >
                                    <Unplug className="w-4 h-4 mr-2" />
                                    Unlink WhatsApp Account
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center space-y-5 w-full flex flex-col items-center">
                                {loadingQr ? (
                                    <div className="w-56 h-56 border-2 border-slate-100 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                        <span className="text-slate-400 text-xs">Fetching QR...</span>
                                    </div>
                                ) : qrCode ? (
                                    <div className="p-3 bg-white border border-slate-100 rounded-2.5xl shadow-sm">
                                        <img 
                                            src={qrCode} 
                                            alt="WhatsApp Web QR Code" 
                                            className="w-52 h-52 object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-52 h-52 bg-slate-50 border border-slate-100 rounded-2.5xl flex flex-col items-center justify-center text-slate-400 gap-2">
                                        <AlertCircle className="w-10 h-10 text-slate-300" />
                                        <span className="text-xs font-semibold">QR Code Unavailable</span>
                                        <Button variant="ghost" onClick={loadQr} size="sm" className="text-indigo-600">Retry</Button>
                                    </div>
                                )}
                                <div className="space-y-1 px-4">
                                    <p className="text-xs text-slate-500 font-extrabold leading-relaxed">
                                        1. Open WhatsApp on your phone.<br/>
                                        2. Tap Menu or Settings &gt; Linked Devices.<br/>
                                        3. Tap Link a Device and point to this screen.
                                    </p>
                                </div>
                                <Button 
                                    onClick={loadQr}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs border-slate-200 text-slate-600 h-9 rounded-lg"
                                >
                                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                    Refresh QR Code
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Automation test tool */}
                <Card className="border-slate-100 shadow-sm rounded-2.5xl bg-white lg:col-span-2 flex flex-col justify-between overflow-hidden">
                    <CardHeader className="p-6 pb-4 border-b border-slate-50">
                        <CardTitle className="text-lg font-bold text-slate-800">Alert Test Tool</CardTitle>
                        <CardDescription className="text-slate-400">Trigger a manual WhatsApp message to verify the delivery socket connection.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleSendTest} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Test Target Mobile Number</label>
                                <Input 
                                    placeholder="Enter 10-digit number (e.g. 9876543210)"
                                    type="tel"
                                    value={testPhone}
                                    onChange={(e) => setTestPhone(e.target.value)}
                                    className="h-12 border-slate-200 focus-visible:ring-indigo-600 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Message Content</label>
                                <textarea
                                    value={testMessage}
                                    onChange={(e) => setTestMessage(e.target.value)}
                                    rows={4}
                                    className="w-full border border-slate-200 p-3 text-sm focus-visible:ring-indigo-600 rounded-xl focus:outline-none focus:border-indigo-600"
                                />
                            </div>
                            <Button 
                                type="submit"
                                disabled={sendingTest || status !== 'CONNECTED'}
                                className="w-full h-12 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm flex items-center justify-center gap-2"
                            >
                                {sendingTest ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending Alert...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Send Test WhatsApp Notification
                                    </>
                                )}
                            </Button>
                            {status !== 'CONNECTED' && (
                                <p className="text-[10px] text-rose-500 font-bold text-center mt-1 flex items-center justify-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Test sender is disabled. Link your WhatsApp device first to make it active.
                                </p>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Automation Activity Log */}
            <Card className="border-slate-100 shadow-sm rounded-2.5xl bg-white overflow-hidden">
                <CardHeader className="p-6 pb-4 border-b border-slate-50 flex flex-row items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg font-bold text-slate-800">Automation Trigger Logs</CardTitle>
                        <CardDescription className="text-slate-400">Historical logs of automated alerts pushed to clients.</CardDescription>
                    </div>
                    <Button 
                        size="icon" 
                        variant="outline" 
                        className="rounded-xl border-slate-200"
                        onClick={loadLogs}
                        disabled={loadingLogs}
                    >
                        <RefreshCw className={`w-4 h-4 text-slate-600 ${loadingLogs ? 'animate-spin' : ''}`} />
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                            <TableRow>
                                <TableHead className="font-extrabold text-slate-700 text-xs px-6 py-4 uppercase">Recipient</TableHead>
                                <TableHead className="font-extrabold text-slate-700 text-xs px-6 py-4 uppercase">Alert Message</TableHead>
                                <TableHead className="font-extrabold text-slate-700 text-xs px-6 py-4 uppercase">Ref ID</TableHead>
                                <TableHead className="font-extrabold text-slate-700 text-xs px-6 py-4 uppercase">Status</TableHead>
                                <TableHead className="font-extrabold text-slate-700 text-xs px-6 py-4 uppercase">Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingLogs && logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                                        <span className="text-xs text-slate-400 mt-2 block font-medium">Loading automation history...</span>
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12">
                                        <div className="text-slate-300 font-extrabold text-sm">No Automation Alerts Pushed Yet</div>
                                        <div className="text-slate-400 text-xs mt-1">Logs will appear automatically here as recharges complete.</div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-slate-50/50 border-b border-slate-100">
                                        <TableCell className="px-6 py-4 font-bold text-slate-700">
                                            {log.customer_phone}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 max-w-sm text-slate-600 text-xs leading-relaxed truncate" title={log.message_content}>
                                            {log.message_content}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 font-mono text-slate-500 text-xs">
                                            {log.transaction_id ? log.transaction_id.substring(0, 8) + '...' : 'Test Msg'}
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            {log.status === 'SENT' ? (
                                                <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-black rounded-lg text-[10px]">
                                                    Delivered
                                                </Badge>
                                            ) : log.status === 'FAILED' ? (
                                                <div className="flex flex-col gap-0.5">
                                                    <Badge className="bg-rose-50 text-rose-600 border border-rose-100 font-black rounded-lg text-[10px] w-fit">
                                                        Failed
                                                    </Badge>
                                                    {log.error_message && (
                                                        <span className="text-[9px] text-rose-500 font-medium max-w-[120px] truncate" title={log.error_message}>
                                                            {log.error_message}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <Badge className="bg-slate-100 text-slate-600 border border-slate-200 font-black rounded-lg text-[10px]">
                                                    Queued
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-slate-400 text-xs">
                                            {new Date(log.created_at).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination Footer */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-slate-50 flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-semibold">
                                Page {page} of {totalPages} ({totalLogs} logs)
                            </span>
                            <div className="flex gap-2">
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="rounded-lg text-xs"
                                >
                                    Previous
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="rounded-lg text-xs"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
