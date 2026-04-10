import { useState, useRef, useEffect } from "react";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Terminal, Trash2, Send, ChevronRight } from "@/components/Icon";
import { toast } from "sonner";

interface LogEntry {
  id: number;
  time: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
}

const INITIAL_LOGS: LogEntry[] = [
  { id: 1, time: new Date().toLocaleTimeString("vi-VN"), level: "success", message: "Admin Console khởi động thành công" },
  { id: 2, time: new Date().toLocaleTimeString("vi-VN"), level: "info", message: "Kết nối database: OK" },
  { id: 3, time: new Date().toLocaleTimeString("vi-VN"), level: "info", message: "Server đang lắng nghe trên port 3000" },
];

const LEVEL_COLORS: Record<string, string> = {
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
  success: "text-green-400",
};

const LEVEL_BADGE: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-600 border-blue-200",
  warn: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  error: "bg-red-500/10 text-red-600 border-red-200",
  success: "bg-green-500/10 text-green-600 border-green-200",
};

const FILTER_OPTIONS = [
  { id: "all", label: "Tất cả" },
  { id: "info", label: "Info" },
  { id: "success", label: "OK" },
  { id: "warn", label: "Warn" },
  { id: "error", label: "Error" },
];

const QUICK_COMMANDS = ["help", "status", "ping", "version"];

export default function AdminConsole() {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [command, setCommand] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const logEndRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(INITIAL_LOGS.length + 1);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (level: LogEntry["level"], message: string) => {
    setLogs(prev => [...prev, {
      id: nextId.current++,
      time: new Date().toLocaleTimeString("vi-VN"),
      level,
      message,
    }]);
  };

  const handleRunCommand = (cmd?: string) => {
    const c = (cmd || command).trim();
    if (!c) return;
    setCommand("");
    setIsRunning(true);
    addLog("info", `> ${c}`);

    setTimeout(() => {
      if (c === "help") {
        addLog("info", "Lệnh có sẵn: help, status, ping, clear, version");
      } else if (c === "status") {
        addLog("success", "System: OK | DB: Connected | Cache: In-Memory");
      } else if (c === "ping") {
        addLog("success", "pong (latency: ~2ms)");
      } else if (c === "version") {
        addLog("info", "PayOS Invoice Tool v1.0.0");
      } else if (c === "clear") {
        setLogs([]);
      } else {
        addLog("warn", `Lệnh không được nhận dạng: "${c}". Gõ "help" để xem danh sách.`);
      }
      setIsRunning(false);
    }, 300);
  };

  const filteredLogs = filter === "all" ? logs : logs.filter(l => l.level === filter);

  return (
    <DashboardLayoutCustom>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="ak-page-title">Console</h1>
            <p className="ak-page-subtitle">Nhật ký hệ thống và thực thi lệnh</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="self-start sm:self-auto"
            onClick={() => setLogs([])}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Xóa log
          </Button>
        </div>

        {/* Filter tabs - scrollable on mobile */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_OPTIONS.map(f => {
            const count = f.id === "all" ? logs.length : logs.filter(l => l.level === f.id).length;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  filter === f.id
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {f.label}
                <span className={`text-[10px] rounded-full px-1.5 ${filter === f.id ? "bg-background/20" : "bg-background"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Console output */}
        <Card className="bg-gray-950 border-gray-800">
          <CardContent className="p-0">
            <div className="h-64 sm:h-80 md:h-96 overflow-y-auto p-3 sm:p-4 font-mono text-xs space-y-1">
              {filteredLogs.length === 0 ? (
                <p className="text-gray-500 italic">Không có log nào...</p>
              ) : (
                filteredLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 min-w-0">
                    <span className="text-gray-500 flex-shrink-0 text-[10px] sm:text-xs">{log.time}</span>
                    <span className={`uppercase font-bold flex-shrink-0 w-7 sm:w-8 text-[10px] sm:text-xs ${LEVEL_COLORS[log.level]}`}>
                      {log.level === "success" ? "OK" : log.level.slice(0, 4).toUpperCase()}
                    </span>
                    <span className={`flex-1 min-w-0 break-all ${log.message.startsWith(">") ? "text-gray-300" : "text-gray-400"}`}>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Command input */}
        <Card className="bg-gray-950 border-gray-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <span className="text-green-400 font-mono text-sm flex-shrink-0">$</span>
              <Input
                className="flex-1 min-w-0 bg-transparent border-0 text-gray-200 font-mono text-sm focus-visible:ring-0 placeholder:text-gray-600"
                placeholder="Nhập lệnh... (gõ 'help')"
                value={command}
                onChange={e => setCommand(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleRunCommand(); }}
                disabled={isRunning}
              />
              <Button
                size="sm"
                onClick={() => handleRunCommand()}
                disabled={!command.trim() || isRunning}
                className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0 w-8 h-8 p-0"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick commands - scrollable on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <p className="text-xs text-muted-foreground flex-shrink-0">Nhanh:</p>
          {QUICK_COMMANDS.map(cmd => (
            <button
              key={cmd}
              onClick={() => handleRunCommand(cmd)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 border border-border"
            >
              <ChevronRight className="w-3 h-3" />
              {cmd}
            </button>
          ))}
        </div>
      </div>
    </DashboardLayoutCustom>
  );
}
