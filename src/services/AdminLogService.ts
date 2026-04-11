import { supabase } from '@/integrations/supabase/client';

/**
 * AdminLogService - Global Log Interceptor & Real-time Broadcaster
 * Redirects all console.log, console.error, and console.warn calls
 * to a Supabase Broadcast Channel for real-time monitoring in the Admin Panel.
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  url: string;
  userId?: string;
  stack?: string;
}

class AdminLogService {
  private originalConsole: Partial<Console> = {};
  private channel: any = null;
  private userId: string | null = null;

  constructor() {
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
    };
    
    // Initialize channel
    this.channel = supabase.channel('admin_logs', {
      config: {
        broadcast: { self: true },
      },
    });
    
    this.channel.subscribe();
  }

  public setUserId(userId: string | null) {
    this.userId = userId;
  }

  public init() {
    // Override console methods
    console.log = (...args: any[]) => {
      this.originalConsole.log!(...args);
      this.broadcast('info', args);
    };

    console.warn = (...args: any[]) => {
      this.originalConsole.warn!(...args);
      this.broadcast('warn', args);
    };

    console.error = (...args: any[]) => {
      this.originalConsole.error!(...args);
      this.broadcast('error', args);
    };
  }

  private broadcast(level: LogLevel, args: any[]) {
    try {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      // AVOID INFINITE RECURSION: 
      // Supabase logs a warning when Realtime falls back to REST.
      // If we intercept that warning and try to broadcast it via Supabase, it triggers the warning again.
      if (message.includes('Realtime send()') || message.includes('httpSend()')) {
        return;
      }

      // Security Check: Mask potentially sensitive patterns (Basic)
      const maskedMessage = message.replace(/(password|token|secret)="[^"]+"/gi, '$1="***"');

      const payload: LogEntry = {
        level,
        message: maskedMessage,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userId: this.userId || undefined,
        stack: level === 'error' ? new Error().stack : undefined,
      };

      this.channel.send({
        type: 'broadcast',
        event: 'new_log',
        payload,
      });
    } catch (err) {
       // Silent fail during log broadcast to avoid recursion
    }
  }
}

export const adminLogService = new AdminLogService();
