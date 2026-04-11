import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Terminal, Trash2, Search, Filter, AlertCircle, Info, AlertTriangle, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  url: string;
  userId?: string;
  stack?: string;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [search, setSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe to live broadcast
    const channel = supabase.channel('admin_logs')
      .on('broadcast', { event: 'new_log' }, ({ payload }) => {
        setLogs(prev => [...prev.slice(-199), payload]); // Keep last 200 logs
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.level === filter;
    const matchesSearch = log.message.toLowerCase().includes(search.toLowerCase()) || 
                         log.url.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const clearLogs = () => setLogs([]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle className="w-3 h-3 text-rose-500" />;
      case 'warn': return <AlertTriangle className="w-3 h-3 text-amber-500" />;
      default: return <Info className="w-3 h-3 text-blue-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-rose-500/10 text-rose-600 border-rose-200';
      case 'warn': return 'bg-amber-500/10 text-amber-600 border-amber-200';
      default: return 'bg-blue-500/10 text-blue-600 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Terminal className="w-8 h-8 text-emerald-600" />
            System Logs
          </h1>
          <p className="text-slate-500 font-medium mt-1">Real-time platform activity monitoring</p>
        </div>
        <div className="flex items-center gap-2">
            <Button 
                variant="outline" 
                size="sm" 
                onClick={clearLogs}
                className="rounded-xl border-slate-200 font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-all"
            >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
            </Button>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1 animate-pulse">
                LIVE
            </Badge>
        </div>
      </div>

      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/50 backdrop-blur-sm overflow-hidden rounded-3xl">
        <CardHeader className="border-b border-slate-100 bg-white/80 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <Input 
                placeholder="Search logs or URLs..." 
                className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {(['all', 'info', 'warn', 'error'] as const).map(l => (
                <Button
                  key={l}
                  variant={filter === l ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(l)}
                  className={`rounded-xl px-4 h-11 font-bold capitalize transition-all ${
                    filter === l 
                    ? (l === 'error' ? 'bg-rose-600 hover:bg-rose-700' : l === 'warn' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-900')
                    : 'text-slate-500'
                  }`}
                >
                  {l}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div 
            ref={scrollRef}
            className="h-[600px] overflow-y-auto bg-slate-950 p-4 font-mono text-sm space-y-2 custom-scrollbar selection:bg-emerald-500/30"
            onScroll={(e) => {
                const target = e.currentTarget;
                const isAtBottom = target.scrollHeight - target.scrollTop === target.clientHeight;
                setAutoScroll(isAtBottom);
            }}
          >
            {filteredLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                <Terminal className="w-12 h-12 opacity-20" />
                <p className="font-bold tracking-widest uppercase text-xs">Awaiting platform events...</p>
              </div>
            ) : (
              filteredLogs.map((log, i) => (
                <div key={i} className="group border-b border-white/[0.03] pb-2 last:border-0 hover:bg-white/[0.02] -mx-2 px-2 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-[10px] text-slate-600 pt-1 shrink-0">
                      {format(new Date(log.timestamp), 'HH:mm:ss.SS')}
                    </span>
                    <Badge className={`uppercase text-[10px] px-1.5 h-4 font-bold border ${getLevelColor(log.level)}`}>
                        {log.level}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className={`break-words leading-relaxed ${
                        log.level === 'error' ? 'text-rose-400 font-medium' : 
                        log.level === 'warn' ? 'text-amber-400' : 'text-slate-300'
                      }`}>
                        {log.message}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px]">
                        <span className="text-emerald-500/60 font-medium truncate max-w-xs">{log.url}</span>
                        {log.userId && <span className="text-blue-400 opacity-60">UID: {log.userId.slice(0, 8)}</span>}
                      </div>
                      {log.stack && (
                        <pre className="mt-2 text-[10px] text-slate-500 overflow-x-auto p-3 bg-white/[0.03] rounded-lg border border-white/[0.05]">
                          {log.stack}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {!autoScroll && logs.length > 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <Button 
                    size="sm" 
                    onClick={() => setAutoScroll(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg gap-2 font-bold px-4 h-9 animate-bounce"
                >
                    <ChevronDown className="w-4 h-4" />
                    Resume Multi-log
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
