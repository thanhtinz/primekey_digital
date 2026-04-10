import { useState, useRef, useEffect } from "react";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Terminal, Trash2, RefreshCw, Send, AlertCircle, CheckCircle, Clock } from "@/components/Icon";
import { trpc } from "@/lib/trpc";
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

const LEVEL_BADGES: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-600 border-blue-200",
  warn: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  error: "bg-red-500/10 text-red-600 border-red-200",
  success: "bg-green-500/10 text-green-600 border-green-200",
};

export default function AdminConsole() {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [command, setCommand] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const logEndRef = useRef<HTMLDivElement>(null);
  let nextId = useRef(INITIAL_LOGS.length + 1);

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

  const handleRunCommand = () => {
    if (!command.trim()) return;
    const cmd = command.trim();
    setCommand("");
    setIsRunning(true);
    addLog("info", `> ${cmd}`);

    // Simulate command execution
    setTimeout(() => {
      if (cmd === "help") {
        addLog("info", "Lệnh có sẵn: help, status, ping, clear, version");
      } else if (cmd === "status") {
        addLog("success", "System: OK | DB: Connected | Cache: In-Memory");
      } else if (cmd === "ping") {
        addLog("success", "pong (latency: ~2ms)");
      } else if (cmd === "version") {
        addLog("info", "PayOS Invoice Tool v1.0.0");
      } else if (cmd === "clear") {
        setLogs([]);
      } else {
        addLog("warn", `Lệnh không được nhận dạng: "${cmd}". Gõ "help" để xem danh sách lệnh.`);
      }
      setIsRunning(false);
    }, 300);
  };

  const filteredLogs = filter === "all" ? logs : logs.filter(l => l.level === filter);

  return (
    <DashboardLayoutCustom>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="ak-page-header">
            <h1 className="ak-page-title">Console</h1>
            <p className="ak-page-subtitle">Nhật ký hệ thống và thực thi lệnh</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setLogs([])}>
              <Trash2 className="w-4 h-4 mr-1" /> Xóa log
            </Button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {["all", "info", "success", "warn", "error"].map(f => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              className="capitalize text-xs h-7"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Tất cả" : f}
              {f !== "all" && (
                <span className="ml-1 opacity-60">
                  ({logs.filter(l => l.level === f).length})
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Console output */}
        <Card className="bg-gray-950 border-gray-800">
          <CardContent className="p-0">
            <div className="h-96 overflow-y-auto p-4 font-mono text-xs space-y-1">
              {filteredLogs.length === 0 ? (
                <p className="text-gray-500 italic">Không có log nào...</p>
              ) : (
                filteredLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2">
                    <span className="text-gray-500 flex-shrink-0">{log.time}</span>
                    <span className={`uppercase font-bold flex-shrink-0 w-8 ${LEVEL_COLORS[log.level]}`}>
                      {log.level === "success" ? "OK" : log.level.toUpperCase()}
                    </span>
                    <span className={`flex-1 ${log.message.startsWith(">") ? "text-gray-300" : "text-gray-400"}`}>
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
                className="flex-1 bg-transparent border-0 text-gray-200 font-mono text-sm focus-visible:ring-0 placeholder:text-gray-600"
                placeholder="Nhập lệnh... (gõ 'help' để xem danh sách)"
                value={command}
                onChange={e => setCommand(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleRunCommand(); }}
                disabled={isRunning}
              />
              <Button
                size="sm"
                onClick={handleRunCommand}
                disabled={!command.trim() || isRunning}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="flex gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground self-center mr-1">Lệnh nhanh:</p>
          {["help", "status", "ping", "version"].map(cmd => (
            <Button
              key={cmd}
              variant="outline"
              size="sm"
              className="text-xs h-7 font-mono"
              onClick={() => { setCommand(cmd); }}
            >
              {cmd}
            </Button>
          ))}
        </div>
      </div>
    </DashboardLayoutCustom>
  );
}
