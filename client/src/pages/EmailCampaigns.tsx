import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Mail, Plus, Send, Trash2, Edit2, Eye, Users, CheckCircle2,
  XCircle, Clock, Loader2, ChevronRight, AlertCircle, Megaphone
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";

type TargetType = "ALL" | "PAID" | "UNPAID" | "CUSTOM";
type CampaignStatus = "DRAFT" | "SENDING" | "SENT" | "FAILED";

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; icon: any }> = {
  DRAFT: { label: "Nháp", color: "bg-gray-100 text-gray-600", icon: Clock },
  SENDING: { label: "Đang Gửi", color: "bg-blue-100 text-blue-700", icon: Loader2 },
  SENT: { label: "Đã Gửi", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  FAILED: { label: "Thất Bại", color: "bg-red-100 text-red-600", icon: XCircle },
};

const TARGET_LABELS: Record<TargetType, string> = {
  ALL: "Tất cả khách hàng",
  PAID: "Đã thanh toán",
  UNPAID: "Chưa thanh toán",
  CUSTOM: "Tùy chỉnh",
};

const DEFAULT_TEMPLATE = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #4f46e5;">Xin chào {{name}},</h2>
  <p style="color: #374151; line-height: 1.6;">
    Chúng tôi có thông báo quan trọng muốn chia sẻ với bạn.
  </p>
  <p style="color: #374151; line-height: 1.6;">
    [Nội dung email của bạn ở đây]
  </p>
  <div style="margin-top: 24px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
    <p style="margin: 0; color: #6b7280; font-size: 14px;">
      Trân trọng,<br/>
      Đội ngũ hỗ trợ
    </p>
  </div>
</div>`;

export default function EmailCampaigns() {
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState<number | null>(null);
  const [showRecipients, setShowRecipients] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [sendId, setSendId] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Form state
  const [form, setForm] = useState({ name: "", subject: "", htmlBody: DEFAULT_TEMPLATE, targetType: "ALL" as TargetType });

  const utils = trpc.useUtils();
  const { data: campaigns = [], isLoading } = trpc.campaigns.list.useQuery();
  const { data: previewData } = trpc.campaigns.previewRecipients.useQuery({ targetType: form.targetType }, { enabled: showCreate || showEdit !== null });
  const { data: recipients = [] } = trpc.campaigns.getRecipients.useQuery({ id: showRecipients! }, { enabled: showRecipients !== null });

  const createMutation = trpc.campaigns.create.useMutation({
    onSuccess: () => { utils.campaigns.list.invalidate(); setShowCreate(false); resetForm(); toast.success("Đã tạo chiến dịch!"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.campaigns.update.useMutation({
    onSuccess: () => { utils.campaigns.list.invalidate(); setShowEdit(null); toast.success("Đã cập nhật!"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.campaigns.delete.useMutation({
    onSuccess: () => { utils.campaigns.list.invalidate(); setDeleteId(null); toast.success("Đã xóa chiến dịch"); },
    onError: (e) => toast.error(e.message),
  });
  const sendMutation = trpc.campaigns.send.useMutation({
    onSuccess: (data) => {
      utils.campaigns.list.invalidate();
      setSendId(null);
      setIsSending(false);
      toast.success(`Gửi thành công ${data.sentCount}/${data.total} email!`);
    },
    onError: (e) => { setSendId(null); setIsSending(false); toast.error(e.message); },
  });

  const resetForm = () => setForm({ name: "", subject: "", htmlBody: DEFAULT_TEMPLATE, targetType: "ALL" });

  const handleCreate = () => {
    if (!form.name.trim() || !form.subject.trim() || !form.htmlBody.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    createMutation.mutate(form);
  };

  const handleEdit = (campaign: any) => {
    setForm({ name: campaign.name, subject: campaign.subject, htmlBody: campaign.htmlBody, targetType: campaign.targetType });
    setShowEdit(campaign.id);
  };

  const handleUpdate = () => {
    if (!showEdit) return;
    updateMutation.mutate({ id: showEdit, ...form });
  };

  const handleSend = async () => {
    if (!sendId) return;
    setIsSending(true);
    sendMutation.mutate({ id: sendId });
  };

  const editingCampaign = campaigns.find(c => c.id === showEdit);
  const previewCampaign = campaigns.find(c => c.id === showPreview);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-indigo-500" />
              Email Campaigns
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Gửi email quảng cáo và thông báo đến khách hàng</p>
          </div>
          <Button onClick={() => { resetForm(); setShowCreate(true); }} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Tạo Chiến Dịch
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Tổng Chiến Dịch", value: campaigns.length, color: "#6366f1" },
            { label: "Đã Gửi", value: campaigns.filter(c => c.status === "SENT").length, color: "#10b981" },
            { label: "Đang Nháp", value: campaigns.filter(c => c.status === "DRAFT").length, color: "#f59e0b" },
            { label: "Email Đã Gửi", value: campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0), color: "#8b5cf6" },
          ].map((stat, i) => (
            <Card key={i} className="shadow-sm border-0">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Campaigns List */}
        <Card className="shadow-sm border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-indigo-500" />
              Danh Sách Chiến Dịch
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            ) : campaigns.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-gray-400">
                <Megaphone className="h-14 w-14 mb-3 opacity-20" />
                <p className="text-base font-medium text-gray-500">Chưa có chiến dịch nào</p>
                <p className="text-sm mt-1">Tạo chiến dịch đầu tiên để bắt đầu gửi email marketing</p>
                <Button onClick={() => { resetForm(); setShowCreate(true); }} className="mt-4 gap-2 bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-4 w-4" /> Tạo Chiến Dịch
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((campaign) => {
                  const statusCfg = STATUS_CONFIG[campaign.status as CampaignStatus] || STATUS_CONFIG.DRAFT;
                  const StatusIcon = statusCfg.icon;
                  const successRate = campaign.totalRecipients && campaign.totalRecipients > 0
                    ? Math.round((campaign.sentCount || 0) / campaign.totalRecipients * 100) : 0;
                  return (
                    <div key={campaign.id} className="p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <Mail className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 truncate">{campaign.name}</h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                              <StatusIcon className={`h-3 w-3 ${campaign.status === "SENDING" ? "animate-spin" : ""}`} />
                              {statusCfg.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5 truncate">{campaign.subject}</p>
                          <div className="flex items-center gap-4 mt-2 flex-wrap">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {TARGET_LABELS[campaign.targetType as TargetType]}
                            </span>
                            {campaign.status === "SENT" && (
                              <>
                                <span className="text-xs text-emerald-600 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {campaign.sentCount}/{campaign.totalRecipients} gửi thành công ({successRate}%)
                                </span>
                                {(campaign.failedCount || 0) > 0 && (
                                  <span className="text-xs text-red-500 flex items-center gap-1">
                                    <XCircle className="h-3 w-3" />
                                    {campaign.failedCount} thất bại
                                  </span>
                                )}
                              </>
                            )}
                            <span className="text-xs text-gray-400">
                              {new Date(campaign.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-indigo-600"
                            onClick={() => setShowPreview(campaign.id)} title="Xem trước">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {campaign.status === "SENT" && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-indigo-600"
                              onClick={() => setShowRecipients(campaign.id)} title="Xem người nhận">
                              <Users className="h-4 w-4" />
                            </Button>
                          )}
                          {(campaign.status === "DRAFT" || campaign.status === "FAILED") && (
                            <>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
                                onClick={() => handleEdit(campaign)} title="Chỉnh sửa">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg gap-1"
                                onClick={() => setSendId(campaign.id)}>
                                <Send className="h-3 w-3" /> Gửi
                              </Button>
                            </>
                          )}
                          {campaign.status !== "SENDING" && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                              onClick={() => setDeleteId(campaign.id)} title="Xóa">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate || showEdit !== null} onOpenChange={(open) => { if (!open) { setShowCreate(false); setShowEdit(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showCreate ? "Tạo Chiến Dịch Email" : "Chỉnh Sửa Chiến Dịch"}</DialogTitle>
            <DialogDescription>
              {showCreate ? "Tạo chiến dịch email mới để gửi đến khách hàng" : "Cập nhật nội dung chiến dịch email"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Tên Chiến Dịch</Label>
                <Input className="mt-1" placeholder="VD: Khuyến mãi tháng 4" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Tiêu Đề Email (Subject)</Label>
                <Input className="mt-1" placeholder="VD: 🎉 Ưu đãi đặc biệt dành riêng cho bạn!" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Đối Tượng Nhận</Label>
                <Select value={form.targetType} onValueChange={v => setForm(f => ({ ...f, targetType: v as TargetType }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả khách hàng có email</SelectItem>
                    <SelectItem value="PAID">Khách đã thanh toán ít nhất 1 đơn</SelectItem>
                    <SelectItem value="UNPAID">Khách có đơn chưa thanh toán</SelectItem>
                  </SelectContent>
                </Select>
                {previewData && (
                  <p className="text-xs text-indigo-600 mt-1.5 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Ước tính: <strong>{previewData.count}</strong> người nhận
                    {previewData.samples.length > 0 && (
                      <span className="text-gray-400 ml-1">
                        ({previewData.samples.map(s => s.name).join(", ")}{previewData.count > 5 ? "..." : ""})
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Nội Dung Email (HTML)</Label>
                <span className="text-xs text-gray-400">Dùng {"{{name}}"} để cá nhân hóa</span>
              </div>
              <Textarea
                className="font-mono text-xs min-h-[200px]"
                value={form.htmlBody}
                onChange={e => setForm(f => ({ ...f, htmlBody: e.target.value }))}
                placeholder="Nhập HTML nội dung email..."
              />
            </div>

            {/* Preview */}
            {form.htmlBody && (
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Xem Trước</Label>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <iframe
                    srcDoc={form.htmlBody.replace(/\{\{name\}\}/g, "Nguyễn Văn A").replace(/\{\{email\}\}/g, "example@email.com")}
                    className="w-full h-48"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => { setShowCreate(false); setShowEdit(null); }}>Hủy</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                onClick={showCreate ? handleCreate : handleUpdate}
                disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                {showCreate ? "Tạo Chiến Dịch" : "Lưu Thay Đổi"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview !== null} onOpenChange={(open) => { if (!open) setShowPreview(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Xem Trước: {previewCampaign?.name}</DialogTitle>
            <DialogDescription>Tiêu đề: {previewCampaign?.subject}</DialogDescription>
          </DialogHeader>
          {previewCampaign && (
            <div className="border border-gray-200 rounded-xl overflow-hidden mt-2">
              <iframe
                srcDoc={previewCampaign.htmlBody.replace(/\{\{name\}\}/g, "Nguyễn Văn A").replace(/\{\{email\}\}/g, "example@email.com")}
                className="w-full h-96"
                sandbox="allow-same-origin"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recipients Dialog */}
      <Dialog open={showRecipients !== null} onOpenChange={(open) => { if (!open) setShowRecipients(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Danh Sách Người Nhận</DialogTitle>
            <DialogDescription>Chi tiết trạng thái gửi email từng người nhận</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {recipients.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Không có dữ liệu</p>
            ) : (
              recipients.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    r.status === "SENT" ? "bg-emerald-100" : r.status === "FAILED" ? "bg-red-100" : "bg-gray-100"
                  }`}>
                    {r.status === "SENT" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> :
                     r.status === "FAILED" ? <XCircle className="h-3.5 w-3.5 text-red-500" /> :
                     <Clock className="h-3.5 w-3.5 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.name || "Không tên"}</p>
                    <p className="text-xs text-gray-400 truncate">{r.email}</p>
                    {r.errorMessage && <p className="text-xs text-red-500 truncate">{r.errorMessage}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    r.status === "SENT" ? "bg-emerald-100 text-emerald-700" :
                    r.status === "FAILED" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
                  }`}>
                    {r.status === "SENT" ? "Đã gửi" : r.status === "FAILED" ? "Thất bại" : "Chờ"}
                  </span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Send Dialog */}
      <AlertDialog open={sendId !== null} onOpenChange={(open) => { if (!open && !isSending) setSendId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Xác Nhận Gửi Chiến Dịch
            </AlertDialogTitle>
            <AlertDialogDescription>
              Email sẽ được gửi ngay đến tất cả khách hàng trong danh sách mục tiêu. Hành động này không thể hoàn tác.
              <br /><br />
              <strong>Lưu ý:</strong> Cần cấu hình SMTP trong Cài Đặt để gửi email thực tế.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend} disabled={isSending}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              {isSending ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang Gửi...</> : <><Send className="h-4 w-4" /> Gửi Ngay</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa Chiến Dịch?</AlertDialogTitle>
            <AlertDialogDescription>Chiến dịch và toàn bộ dữ liệu người nhận sẽ bị xóa vĩnh viễn.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-red-600 hover:bg-red-700">Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
