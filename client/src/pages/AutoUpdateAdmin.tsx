import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Github, RefreshCw, CheckCircle2, AlertCircle, Clock, Download,
  ArrowLeft, Info, Copy, ExternalLink, Loader2, Terminal, Zap, Settings
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AutoUpdateAdmin() {
  const [showConfig, setShowConfig] = useState(false);
  const [githubRepo, setGithubRepo] = useState("");
  const [githubBranch, setGithubBranch] = useState("main");
  const [githubToken, setGithubToken] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  const utils = trpc.useUtils();

  const { data: status, isLoading, refetch } = trpc.update.getStatus.useQuery(undefined, {
    refetchInterval: 5000, // Poll every 5s when updating
  });

  const { data: webhookInfo } = trpc.update.getWebhookInfo.useQuery();

  const configureMutation = trpc.update.configure.useMutation({
    onSuccess: () => {
      toast.success("Đã lưu cấu hình GitHub");
      setShowConfig(false);
      utils.update.getStatus.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const checkNowMutation = trpc.update.checkNow.useMutation({
    onSuccess: (data) => {
      if (data.hasUpdate) {
        toast.success(`Có phiên bản mới: v${data.latestVersion}`);
      } else {
        toast.info("Hệ thống đang ở phiên bản mới nhất");
      }
      utils.update.getStatus.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateNowMutation = trpc.update.updateNow.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
      utils.update.getStatus.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleAutoUpdateMutation = trpc.update.configure.useMutation({
    onSuccess: () => {
      utils.update.getStatus.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSaveConfig = () => {
    if (!githubRepo.trim()) {
      toast.error("Vui lòng nhập GitHub repository (owner/repo)");
      return;
    }
    configureMutation.mutate({
      githubRepo: githubRepo.trim(),
      githubBranch: githubBranch || "main",
      githubToken: githubToken || undefined,
      githubWebhookSecret: webhookSecret || undefined,
    });
  };

  const handleToggleAutoUpdate = (enabled: boolean) => {
    if (!status?.githubRepo) {
      toast.error("Vui lòng cấu hình GitHub repository trước");
      return;
    }
    toggleAutoUpdateMutation.mutate({
      githubRepo: status.githubRepo,
      githubBranch: status.githubBranch,
      autoUpdate: enabled,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Đã sao chép!"));
  };

  const getStatusBadge = () => {
    if (status?.isUpdating) return <Badge className="bg-blue-500 text-white animate-pulse">Đang cập nhật...</Badge>;
    if (status?.updateAvailable) return <Badge className="bg-amber-500 text-white">Có phiên bản mới</Badge>;
    return <Badge className="bg-green-500 text-white">Mới nhất</Badge>;
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
      case "error": return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
      case "warning": return <AlertCircle className="w-3.5 h-3.5 text-amber-500" />;
      default: return <Info className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case "success": return "text-green-700 bg-green-50 border-green-100";
      case "error": return "text-red-700 bg-red-50 border-red-100";
      case "warning": return "text-amber-700 bg-amber-50 border-amber-100";
      default: return "text-blue-700 bg-blue-50 border-blue-100";
    }
  };

  // Initialize form when config opens
  const handleOpenConfig = () => {
    setGithubRepo(status?.githubRepo || "");
    setGithubBranch(status?.githubBranch || "main");
    setGithubToken("");
    setWebhookSecret("");
    setShowConfig(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Github className="w-6 h-6" />
            Cập nhật tự động
          </h1>
          <p className="text-sm text-muted-foreground">Khi push code lên GitHub, hệ thống sẽ tự động cập nhật</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Làm mới</span>
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="col-span-1">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground mb-1">Phiên bản hiện tại</p>
            <p className="text-lg font-bold text-blue-600">v{status?.currentVersion || "1.0.0"}</p>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground mb-1">Phiên bản mới nhất</p>
            <p className="text-lg font-bold text-purple-600">
              {status?.latestVersion ? `v${status.latestVersion}` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground mb-1">Trạng thái</p>
            <div className="mt-1">{getStatusBadge()}</div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground mb-1">Tự động cập nhật</p>
            <div className="flex items-center gap-2 mt-1">
              <Switch
                checked={status?.autoUpdate ?? false}
                onCheckedChange={handleToggleAutoUpdate}
                disabled={!status?.githubRepo || toggleAutoUpdateMutation.isPending}
              />
              <span className="text-sm font-medium">
                {status?.autoUpdate ? "Bật" : "Tắt"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GitHub Config */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Github className="w-4 h-4" />
                Cấu hình GitHub
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {status?.githubRepo ? `Đang theo dõi: ${status.githubRepo} (branch: ${status.githubBranch})` : "Chưa cấu hình repository"}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleOpenConfig} className="gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              Cấu hình
            </Button>
          </div>
        </CardHeader>

        {showConfig && (
          <CardContent className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">GitHub Repository <span className="text-red-500">*</span></Label>
                <Input
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  placeholder="owner/repository-name"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Ví dụ: username/invoice-prime</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Branch</Label>
                <Input
                  value={githubBranch}
                  onChange={(e) => setGithubBranch(e.target.value)}
                  placeholder="main"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">GitHub Token (tùy chọn)</Label>
                <Input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Cần thiết cho private repo. {status?.hasToken && <span className="text-green-600">✓ Đã cấu hình</span>}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Webhook Secret (tùy chọn)</Label>
                <Input
                  type="password"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="my-secret-key"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Dùng để xác thực webhook từ GitHub. {status?.hasWebhookSecret && <span className="text-green-600">✓ Đã cấu hình</span>}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSaveConfig}
                disabled={configureMutation.isPending}
                size="sm"
                className="gap-1.5"
              >
                {configureMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Lưu cấu hình
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowConfig(false)}>Hủy</Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Webhook Setup Instructions */}
      {status?.githubRepo && webhookInfo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Cài đặt GitHub Webhook
            </CardTitle>
            <CardDescription className="text-xs">
              Cấu hình webhook trong GitHub để cập nhật tự động khi push code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Webhook URL */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Webhook URL</Label>
              <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg border">
                <code className="text-xs flex-1 font-mono text-blue-600 break-all">
                  {window.location.origin}{webhookInfo.webhookUrl}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 flex-shrink-0"
                  onClick={() => copyToClipboard(`${window.location.origin}${webhookInfo.webhookUrl}`)}
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hướng dẫn cài đặt</Label>
              <ol className="space-y-1.5">
                {webhookInfo.instructions.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 font-medium text-[10px]">
                      {i + 1}
                    </span>
                    {step.replace(/^\d+\.\s/, "")}
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Sau khi cài webhook, mỗi lần bạn push code lên branch <strong>{status.githubBranch}</strong>, hệ thống sẽ tự động pull code mới, build và restart.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Thao tác thủ công</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => checkNowMutation.mutate()}
            disabled={checkNowMutation.isPending || !status?.githubRepo}
            className="gap-1.5"
          >
            {checkNowMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Kiểm tra phiên bản mới
          </Button>

          {status?.updateAvailable && (
            <Button
              size="sm"
              onClick={() => updateNowMutation.mutate()}
              disabled={updateNowMutation.isPending || status?.isUpdating}
              className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
            >
              {(updateNowMutation.isPending || status?.isUpdating) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Cập nhật lên v{status?.latestVersion}
            </Button>
          )}

          {status?.lastUpdateCheck && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
              <Clock className="w-3.5 h-3.5" />
              Kiểm tra lần cuối: {new Date(status.lastUpdateCheck).toLocaleString("vi-VN")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Logs */}
      {status?.logs && status.logs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Nhật ký cập nhật
              <Badge variant="secondary" className="text-xs">{status.logs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {status.logs.map((log: any, i: number) => (
                <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${getLogColor(log.type)}`}>
                  <div className="flex-shrink-0 mt-0.5">{getLogIcon(log.type)}</div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{log.message}</span>
                  </div>
                  <span className="text-[10px] opacity-60 flex-shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString("vi-VN")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How it works */}
      <Card className="bg-gradient-to-br from-slate-50 to-blue-50/30 border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            Cách hoạt động
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: <Github className="w-5 h-5 text-slate-700" />,
                title: "1. Push code lên GitHub",
                desc: "Bạn push code mới lên repository đã cấu hình",
              },
              {
                icon: <Zap className="w-5 h-5 text-amber-500" />,
                title: "2. Webhook kích hoạt",
                desc: "GitHub gửi webhook đến server của bạn, server nhận và xác thực",
              },
              {
                icon: <RefreshCw className="w-5 h-5 text-green-500" />,
                title: "3. Tự động cập nhật",
                desc: "Server chạy git pull → pnpm install → pnpm build → restart",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-9 h-9 bg-white rounded-lg border flex items-center justify-center flex-shrink-0 shadow-sm">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
