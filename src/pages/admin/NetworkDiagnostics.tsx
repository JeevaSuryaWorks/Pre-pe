import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Loader2, 
    Globe, 
    Shield, 
    Info, 
    RefreshCw, 
    ExternalLink,
    Server,
    MapPin,
    AlertTriangle,
    CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

interface IPData {
    message: string;
    outbound_ip: string;
    proxy_configured: boolean;
    proxy_active: boolean;
    your_browser_ip: string;
    vercel_region: string;
    instruction: string;
}

const NetworkDiagnostics = () => {
    const [data, setData] = useState<IPData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchIPData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/kwik-ip');
            
            if (!response.ok) {
                throw new Error(`API returned status ${response.status}`);
            }
            
            const result = await response.json();
            setData(result);
            if (result.proxy_active) {
                toast.success("Static IP Proxy is Active");
            }
        } catch (e) {
            console.warn('[NetworkDiagnostics] Backend API unavailable, checking environment...');
            
            // Check if we are running locally (Development Fix)
            const isLocal = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1' || 
                            window.location.port === '8080';

            if (isLocal) {
                try {
                    // Fallback to client-side IP detection to keep UI functional
                    const fallbackRes = await fetch('https://api.ipify.org?format=json');
                    const fallbackData = await fallbackRes.json();
                    
                    setData({
                        message: "LOCAL PREVIEW: Serverless functions are not available under 'npm run dev'.",
                        outbound_ip: fallbackData.ip,
                        proxy_configured: false,
                        proxy_active: false,
                        your_browser_ip: fallbackData.ip,
                        vercel_region: "Local Mode",
                        instruction: "In local development, the 'Outbound IP' is your own internet IP. Use 'vercel dev' to test serverless functions."
                    });
                    toast.info("Switched to Local Preview Mode");
                } catch (err) {
                    toast.error("Could not detect IP address");
                }
            } else {
                toast.error("Failed to fetch server network diagnostics");
                console.error(e);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIPData();
    }, []);

    if (loading && !data) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <p className="text-slate-500 font-medium animate-pulse">Analyzing network configuration...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Network Diagnostics</h2>
                    <p className="text-slate-500 mt-1">Verify outbound connectivity and IP whitelisting status for KwikAPI.</p>
                </div>
                <Button 
                    onClick={fetchIPData} 
                    disabled={loading}
                    variant="outline"
                    className="rounded-xl border-slate-200 hover:bg-white hover:text-blue-600 hover:border-blue-200 transition-all font-bold"
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Refresh Status
                </Button>
            </div>

            {data?.vercel_region === "Local Mode" && (
                <div className="p-4 rounded-3xl bg-blue-50 border border-blue-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-blue-900">Local Development Environment Detected</p>
                        <p className="text-xs text-blue-700 leading-relaxed font-medium">
                            The system is currently running on <strong>localhost</strong>. True server-side IP detection and outbound proxies (Fixie) only work when deployed to Vercel or when using the <code>vercel dev</code> command.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Outbound IP Card */}
                <Card className="md:col-span-2 overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className={`h-1.5 w-full ${data?.proxy_active ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Globe className="h-5 w-5 text-blue-600" />
                                Outbound Public IP
                            </CardTitle>
                            <Badge variant={data?.proxy_active ? "default" : "secondary"} className={data?.proxy_active ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"}>
                                {data?.proxy_active ? "STATIC PROXY ACTIVE" : "DIRECT OUTBOUND"}
                            </Badge>
                        </div>
                        <CardDescription>This is the IP that external services (like KwikAPI) will see.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-slate-900 rounded-3xl p-8 text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="text-4xl md:text-5xl font-black text-white tracking-tight font-mono">
                                {data?.outbound_ip || "0.0.0.0"}
                            </span>
                            <div className="mt-4 flex justify-center">
                                <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="rounded-xl font-bold text-xs h-8"
                                    onClick={() => {
                                        if (data?.outbound_ip) {
                                            navigator.clipboard.writeText(data.outbound_ip);
                                            toast.success("IP copied to clipboard");
                                        }
                                    }}
                                >
                                    Copy IP Address
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <Server className="h-4 w-4 text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Vercel Region</span>
                                </div>
                                <p className="font-bold text-slate-700 capitalize">{data?.vercel_region || "Localhost"}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <Shield className="h-4 w-4 text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Proxy Config</span>
                                </div>
                                <p className="font-bold text-slate-700">
                                    {data?.proxy_configured ? (
                                        <span className="text-emerald-600 flex items-center gap-1">
                                            <CheckCircle2 className="h-3.5 w-3.5" /> Configured
                                        </span>
                                    ) : (
                                        <span className="text-amber-600 flex items-center gap-1">
                                            <AlertTriangle className="h-3.5 w-3.5" /> Not Configured
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar Card: Instructions */}
                <Card className="border-slate-200 bg-slate-50 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Info className="h-4 w-4 text-blue-600" />
                            Whitelisting Guide
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-sm text-slate-600 space-y-4">
                            <p>To enable recharge services, follow these steps:</p>
                            <ol className="space-y-3 list-decimal list-inside font-medium">
                                <li className="pl-1">Copy the <strong>Outbound IP</strong> shown on the left.</li>
                                <li className="pl-1">Login to your <a href="https://www.kwikapi.com/member/ip_whitelist.php" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">KwikAPI Portal <ExternalLink className="h-3 w-3" /></a></li>
                                <li className="pl-1">Add the IP to your <strong>Whitelist</strong>.</li>
                                <li className="pl-1">Wait 2-5 minutes for changes to propagate.</li>
                            </ol>
                        </div>

                        {!data?.proxy_active && (
                            <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-black text-amber-900 uppercase">Warning</p>
                                        <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                            We are currently using direct outbound connections. Vercel IPs change frequently! 
                                            <strong> Static Proxy (Fixie) is recommended</strong> for production.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200 shadow-sm border-dashed bg-transparent">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-white shadow-sm border border-slate-100">
                                <MapPin className="h-5 w-5 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Your Connection</p>
                                <p className="font-bold text-slate-900">Your Browser IP: <span className="text-blue-600">{data?.your_browser_ip}</span></p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium italic">
                            This tool helps diagnostic connectivity between Vercel and KwikAPI. Only whitelisted IPs can perform recharges.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default NetworkDiagnostics;
