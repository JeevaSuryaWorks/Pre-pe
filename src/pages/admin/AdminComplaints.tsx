import { useEffect, useState, useRef } from "react";
import { supportService } from "@/services/support.service";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { 
  Loader2, 
  HelpCircle, 
  Phone, 
  User, 
  Clock, 
  Coins, 
  MessageSquare, 
  Play, 
  CheckCircle, 
  AlertCircle,
  Hash,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";

export default function AdminComplaints() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>("");
  const ticketsCountRef = useRef<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
    
    // Set up Supabase Real-Time subscription for zero-latency sync of support complaints
    const channel = supabase
      .channel("support_tickets_realtime_sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_tickets"
        },
        (payload) => {
          console.log("Real-time support ticket sync triggered:", payload);
          fetchTicketsSilently();
        }
      )
      .subscribe();

    const interval = setInterval(fetchTicketsSilently, 15000); // 15s fallback heartbeat
    
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const playPingSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High ping pitch
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3); // sweep down
      
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35); // short decay
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.warn("Web Audio ping failed:", e);
    }
  };

  const playChimeSound = (success = true) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      
      if (success) {
        // Celestial rising C-Major arpeggio chime (C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, index) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + index * 0.08);
          gain.gain.setValueAtTime(0.15, now + index * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.35);
          
          osc.start(now + index * 0.08);
          osc.stop(now + index * 0.08 + 0.35);
        });
      } else {
        // Detuned error buzz
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc1.type = "sawtooth";
        osc2.type = "sawtooth";
        osc1.frequency.setValueAtTime(140, now);
        osc2.frequency.setValueAtTime(143, now); // Detuned for friction
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        
        osc1.start();
        osc2.start();
        osc1.stop(now + 0.4);
        osc2.stop(now + 0.4);
      }
    } catch (e) {
      console.warn("Web Audio chime failed:", e);
    }
  };

  const fetchTickets = async () => {
    try {
      const data = await supportService.getAdminTickets();
      setTickets(data);
      ticketsCountRef.current = data.filter((t: any) => t.status === "PENDING").length;
    } catch (error: any) {
      console.error("Failed to load tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketsSilently = async () => {
    try {
      const data = await supportService.getAdminTickets();
      const currentPendingCount = data.filter((t: any) => t.status === "PENDING").length;
      
      // Play high-contrast ping when pending complaints increase
      if (currentPendingCount > ticketsCountRef.current) {
        playPingSound();
        toast({
          title: "🚨 Support Ticket Alert",
          description: "A new user complaint has arrived in real-time!",
        });
      }
      
      setTickets(data);
      ticketsCountRef.current = currentPendingCount;
    } catch (e) {
      console.error("Silent sync failed:", e);
    }
  };

  const handleReprocess = async (ticketId: string) => {
    setReprocessingId(ticketId);
    try {
      const result = await supportService.reprocessRecharge(ticketId);
      if (result.success && result.status === "SUCCESS") {
        playChimeSound(true);
        toast({
          title: "Recharge Reprocessed! 🎉",
          description: "The recharge was processed successfully and status set to SUCCESS.",
        });
      } else if (result.status === "PENDING") {
        playPingSound();
        toast({
          title: "Operator Response Pending ⏳",
          description: "Reprocess triggered. Operator reports transaction is still pending.",
        });
      } else {
        playChimeSound(false);
        toast({
          title: "Reprocess Failed ❌",
          description: result.message || "The operator failed to process the recharge. User refunded.",
          variant: "destructive"
        });
      }
      fetchTickets();
    } catch (error: any) {
      playChimeSound(false);
      toast({
        title: "Reprocessing Error",
        description: error.message || "Failed to trigger reprocessing.",
        variant: "destructive"
      });
    } finally {
      setReprocessingId(null);
    }
  };

  const handleResolve = async (ticketId: string) => {
    if (!adminNotes.trim()) {
      toast({
        title: "Validation Error",
        description: "Please write some admin resolution notes first.",
        variant: "destructive"
      });
      return;
    }

    setResolvingId(ticketId);
    try {
      await supportService.resolveTicket(ticketId, "RESOLVED", adminNotes);
      playChimeSound(true);
      toast({
        title: "Ticket Resolved ✅",
        description: "Ticket has been successfully marked as resolved.",
      });
      setAdminNotes("");
      fetchTickets();
    } catch (error: any) {
      toast({
        title: "Resolution Failed",
        description: error.message || "Failed to resolve ticket.",
        variant: "destructive"
      });
    } finally {
      setResolvingId(null);
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "recharge_failed":
        return "Failed recharge / Deducted";
      case "wrong_amount":
        return "Incorrect amount credited";
      case "service_not_active":
        return "Service deactivated / Inert";
      default:
        return "General complaints";
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] w-full flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  const pendingCount = tickets.filter(t => t.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Header Desk Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl shadow-xl text-white border border-slate-700/50">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-purple-300 to-teal-200 bg-clip-text text-transparent">
            Live Support Complaints Desk
          </h2>
          <p className="text-slate-300 text-sm mt-1">
            Real-time user feedback ticketing and direct API reprocessing controls
          </p>
        </div>
        <div className="flex gap-3">
          <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-4 py-2 text-sm rounded-lg flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
            {pendingCount} Pending Tickets
          </Badge>
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-4 py-2 text-sm rounded-lg flex items-center gap-2">
            {tickets.length - pendingCount} Resolved
          </Badge>
        </div>
      </div>

      {tickets.length === 0 ? (
        <Card className="border border-dashed border-slate-300 bg-slate-50/50 rounded-2xl flex flex-col items-center justify-center p-12 text-center">
          <HelpCircle className="h-16 w-16 text-slate-400 mb-4 stroke-[1.25]" />
          <CardTitle className="text-slate-700 font-bold text-xl">No Complaints Logged</CardTitle>
          <CardDescription className="text-slate-500 max-w-sm mt-1">
            Everything is quiet! There are currently no active support complaints in the system.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
          {tickets.map((ticket) => {
            const tx = ticket.transaction;
            const isPending = ticket.status === "PENDING";
            
            return (
              <Card 
                key={ticket.id} 
                className={`flex flex-col transition-all duration-300 rounded-2xl border ${
                  isPending 
                    ? "border-amber-400/40 shadow-md bg-white hover:shadow-lg" 
                    : "border-slate-200 shadow-sm bg-slate-50/70 opacity-90"
                }`}
              >
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold flex items-center gap-1 border border-slate-200">
                          <Hash className="h-3 w-3 text-slate-400" />
                          {ticket.id.substring(0, 8).toUpperCase()}
                        </span>
                        <Badge className={
                          isPending 
                            ? "bg-amber-100 text-amber-700 border border-amber-300/40 hover:bg-amber-100" 
                            : "bg-emerald-100 text-emerald-700 border border-emerald-300/40 hover:bg-emerald-100"
                        }>
                          {ticket.status}
                        </Badge>
                      </div>
                      <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2 pt-1">
                        <MessageSquare className="h-4.5 w-4.5 text-blue-500 stroke-[2]" />
                        {getReasonLabel(ticket.reason)}
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium bg-slate-50 px-2 py-1 rounded-md border">
                      <Clock className="h-3 w-3" />
                      {format(new Date(ticket.created_at), "dd MMM, hh:mm a")}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="py-4 space-y-4 flex-1">
                  {/* User Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-slate-400 font-medium leading-none">Customer</p>
                        <p className="font-bold text-slate-700 mt-0.5">{ticket.profile?.full_name || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-slate-400 font-medium leading-none">Mobile No.</p>
                        <p className="font-bold text-slate-700 mt-0.5">{ticket.profile?.phone || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Panel */}
                  {tx && (
                    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-4 shadow-sm border border-slate-800 space-y-3 relative overflow-hidden">
                      <div className="absolute right-3 top-3 opacity-15">
                        <Coins className="h-16 w-16" />
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-slate-800">
                        <span className="font-semibold tracking-wider uppercase">Receipt Details</span>
                        <span className="font-mono text-[10px] bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">{tx.reference_id}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                        <div>
                          <p className="text-slate-400 text-xs font-medium">Operator / Provider</p>
                          <p className="font-bold tracking-wide mt-0.5">{tx.operator_id || tx.operator_name || "DTH / Recharge"}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs font-medium">Recharge Target</p>
                          <p className="font-mono font-bold tracking-wide mt-0.5">{tx.mobile_number || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs font-medium">Amount Due</p>
                          <p className="text-teal-300 font-extrabold tracking-wide mt-0.5 flex items-center gap-0.5">
                            ₹{Number(tx.amount).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs font-medium">Current Status</p>
                          <div className="mt-1 flex items-center">
                            {tx.status === "SUCCESS" ? (
                              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/20 py-0 text-[10px]">SUCCESS</Badge>
                            ) : tx.status === "FAILED" ? (
                              <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/20 py-0 text-[10px]">FAILED</Badge>
                            ) : (
                              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/20 py-0 text-[10px] animate-pulse">PENDING</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Complaint user message */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">User Complaint Details</p>
                    <div className="bg-slate-100/80 rounded-xl p-3 text-sm text-slate-700 border border-slate-200/50 italic leading-relaxed">
                      "{ticket.details || "No additional remarks left by the customer."}"
                    </div>
                  </div>

                  {/* Admin notes display */}
                  {ticket.admin_notes && (
                    <div className="space-y-1.5 bg-emerald-50/50 border border-emerald-200/50 p-3 rounded-xl">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Admin Resolution Notes
                      </p>
                      <p className="text-sm text-slate-700 mt-1 leading-relaxed font-medium">{ticket.admin_notes}</p>
                    </div>
                  )}
                </CardContent>

                {isPending && (
                  <CardFooter className="bg-slate-50 border-t border-slate-100 p-4 rounded-b-2xl flex flex-col gap-3">
                    <div className="w-full space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Write Resolution Notes</label>
                      <Textarea 
                        placeholder="Detail how this issue was resolved, e.g., 'API retry successful' or 'Called operator support and credited manual refund'."
                        className="bg-white border-slate-300/80 rounded-xl text-slate-800 placeholder-slate-400 text-sm shadow-sm"
                        value={resolvingId === ticket.id ? adminNotes : (resolvingId ? "" : adminNotes)}
                        onChange={(e) => {
                          setResolvingId(ticket.id);
                          setAdminNotes(e.target.value);
                        }}
                      />
                    </div>
                    <div className="flex gap-2 w-full mt-1">
                      {tx && tx.status !== "SUCCESS" && (
                        <Button 
                          className="flex-1 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 py-2"
                          onClick={() => handleReprocess(ticket.id)}
                          disabled={reprocessingId !== null || resolvingId === ticket.id && resolvingId !== null}
                        >
                          {reprocessingId === ticket.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin text-white" />
                              Processing API...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 text-white fill-white" />
                              Process Recharge
                            </>
                          )}
                        </Button>
                      )}
                      
                      <Button 
                        className="flex-1 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 py-2"
                        onClick={() => handleResolve(ticket.id)}
                        disabled={reprocessingId !== null || resolvingId !== ticket.id && resolvingId !== null}
                      >
                        {resolvingId === ticket.id && resolvingId !== null ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                            Resolving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 text-white" />
                            Mark Resolved
                          </>
                        )}
                      </Button>
                    </div>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
