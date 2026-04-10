import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, Plus, Trash2, Send, Eye, BarChart2, Users, CheckCircle2, Clock } from "lucide-react";

const TARGET_GROUPS = [
  { value: "all", label: "Tất cả khách hàng" },
  { value: "PAID", label: "Khách đã mua hàng" },
  { value: "UNPAID", label: "Khách chưa mua hàng" },
  { value: "CUSTOM", label: "Tùy chỉnh" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Nháp", color: "bg-gray-100 text-gray-600" },
  SENDING: { label: "Đang gửi", color: "bg-blue-100 text-blue-700" },
  SENT: { label: "Đã gửi", color: "bg-green-100 text-green-700" },
  FAILED: { label: "Thất bại", color: "bg-red-100 text-red-700" },
};

export default function MailCampaigns() {
  const [showCreate, setShowCreate] = useState(false);
  const [showPreview, setShowPreview] = useState<number | null>(null);
  const [form, setForm] = useState<{
    name: string;
    subject: string;
    htmlBody: string;
    targetType: "ALL" | "PAID" | "UNPAID" | "CUSTOM";
  }>({
    name: "",
    subject: "",
    htmlBody: "",
    targetType: "ALL",
  });

  const { data: campaigns, refetch } = trpc.emailCampaign.list.useQuery();
  const createMutation = trpc.emailCampaign.create.useMutation({
    onSuccess: () => { toast.success("Đã tạo chiến dịch"); setShowCreate(false); setForm({ name: "", subject: "", htmlBody: "", targetType: "ALL" }); refetch(); },
    onError: (e: any) => toast.error(e.message || "Lỗi tạo chiến dịch"),
  });
  const sendMutation = trpc.emailCampaign.send.useMutation({
    onSuccess: (r) => { toast.success(`Đã gửi ${r.sent} email`); refetch(); },
    onError: (e: any) => toast.error(e.message || "Lỗi gửi email"),
  });
  const deleteMutation = trpc.emailCampaign.delete.useMutation({
    onSuccess: () => { toast.success("Đã xóa chiến dịch"); refetch(); },
  });

  const previewCampaign = campaigns?.find(c => c.id === showPreview);

  const totalSent = campaigns?.filter(c => c.status === "SENT").reduce((s, c) => s + (c.sentCount ?? 0), 0) ?? 0;
  const totalRecipients = campaigns?.reduce((s, c) => s + (c.totalRecipients ?? 0), 0) ?? 0;

  return (
    <DashboardLayoutCustom>
      <div className="ak-page-header">
        <div>
          <h1 className="ak-page-title">Mail Campaigns</h1>
          <p className="ak-page-subtitle">Quản lý chiến dịch email marketing gửi đến khách hàng</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Tạo Chiến Dịch
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="ak-stat-card">
          <div className="ak-stat-icon bg-blue-50"><Mail className="h-5 w-5 text-blue-600" /></div>
          <div className="ak-stat-value">{campaigns?.length ?? 0}</div>
          <div className="ak-stat-label">Tổng chiến dịch</div>
        </div>
        <div className="ak-stat-card">
          <div className="ak-stat-icon bg-green-50"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
          <div className="ak-stat-value">{campaigns?.filter(c => c.status === "SENT").length ?? 0}</div>
          <div className="ak-stat-label">Đã gửi</div>
        </div>
        <div className="ak-stat-card">
          <div className="ak-stat-icon bg-purple-50"><Send className="h-5 w-5 text-purple-600" /></div>
          <div className="ak-stat-value">{totalSent.toLocaleString()}</div>
          <div className="ak-stat-label">Email đã gửi</div>
        </div>
        <div className="ak-stat-card">
          <div className="ak-stat-icon bg-orange-50"><Users className="h-5 w-5 text-orange-600" /></div>
          <div className="ak-stat-value">{totalRecipients.toLocaleString()}</div>
          <div className="ak-stat-label">Tổng người nhận</div>
        </div>
      </div>

      {/* Campaign list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Danh Sách Chiến Dịch</h2>
        </div>
        {!campaigns || campaigns.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Mail className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Chưa có chiến dịch nào. Nhấn "+ Tạo Chiến Dịch" để bắt đầu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Tên chiến dịch</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Chủ đề</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Đối tượng</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Gửi / Tổng</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Ngày tạo</th>
                  <th className="p-3 w-28"></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => {
                  const statusCfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.DRAFT;
                  const targetLabel = TARGET_GROUPS.find(t => t.value === c.targetType)?.label ?? c.targetType;
                  return (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-medium text-gray-900">{c.name}</td>
                      <td className="p-3 text-sm text-gray-600 max-w-[200px] truncate">{c.subject}</td>
                      <td className="p-3 text-sm text-gray-600">{targetLabel}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {c.sentCount ?? 0} / {c.totalRecipients ?? 0}
                      </td>
                      <td className="p-3 text-sm text-gray-500">
                        {new Date(c.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 w-7 p-0 text-blue-500 hover:bg-blue-50"
                            onClick={() => setShowPreview(c.id)}
                            title="Xem trước"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {c.status === "DRAFT" && (
                            <Button
                              size="sm" variant="ghost"
                              className="h-7 w-7 p-0 text-green-600 hover:bg-green-50"
                              onClick={() => { if (confirm(`Gửi chiến dịch "${c.name}" đến ${targetLabel}?`)) sendMutation.mutate({ id: c.id }); }}
                              title="Gửi ngay"
                            >
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                            onClick={() => { if (confirm("Xóa chiến dịch này?")) deleteMutation.mutate({ id: c.id }); }}
                            title="Xóa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo Chiến Dịch Email Mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tên chiến dịch <span className="text-red-500">(*)</span></Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="vd: Khuyến mãi tháng 4"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Đối tượng gửi</Label>
                <Select value={form.targetType} onValueChange={v => setForm(f => ({ ...f, targetType: v as "ALL" | "PAID" | "UNPAID" | "CUSTOM" }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_GROUPS.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Tiêu đề email <span className="text-red-500">(*)</span></Label>
              <Input
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="vd: 🎉 Ưu đãi đặc biệt dành riêng cho bạn!"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Nội dung email (HTML)</Label>
              <Textarea
                value={form.htmlBody}
                onChange={e => setForm(f => ({ ...f, htmlBody: e.target.value }))}
                placeholder="<h1>Xin chào!</h1><p>Nội dung email của bạn...</p>"
                className="mt-1 font-mono text-sm"
                rows={10}
              />
              <p className="text-xs text-gray-400 mt-1">Hỗ trợ HTML. Dùng {"{{name}}"} để chèn tên khách hàng.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending || !form.name || !form.subject}
              >
                {createMutation.isPending ? "Đang tạo..." : "Lưu Nháp"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview !== null} onOpenChange={() => setShowPreview(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Xem trước: {previewCampaign?.name}</DialogTitle>
          </DialogHeader>
          {previewCampaign && (
            <div className="space-y-3 pt-2">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <span className="font-medium text-gray-700">Tiêu đề: </span>
                <span className="text-gray-900">{previewCampaign.subject}</span>
              </div>
              <div className="border rounded-lg p-4 min-h-[200px]">
                <div dangerouslySetInnerHTML={{ __html: previewCampaign.htmlBody }} />
              </div>
              <div className="flex gap-3 pt-2">
                {previewCampaign.status === "DRAFT" && (
                  <Button
                    className="gap-2 bg-green-600 hover:bg-green-700"
                    onClick={() => { sendMutation.mutate({ id: previewCampaign.id }); setShowPreview(null); }}
                    disabled={sendMutation.isPending}
                  >
                    <Send className="h-4 w-4" /> Gửi Ngay
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowPreview(null)}>Đóng</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayoutCustom>
  );
}
