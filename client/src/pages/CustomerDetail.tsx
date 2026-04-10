import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, Mail, Phone, MapPin, ArrowLeft, Wallet, TrendingUp, ShoppingCart, CreditCard,
  Shield, Settings, Lock, Key, Plus, Minus,
  Ticket, ChevronRight, FileText, Edit, Save, X, CheckCircle, Loader2
} from "@/components/Icon";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function formatCurrency(amount: string | number | null | undefined) {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
  return `${num.toLocaleString("vi-VN")}đ`;
}
function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = new Date(date);
  return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
}
function timeAgo(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff} giây trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

const ROLE_MAP: Record<string, { label: string; color: string }> = {
  customer: { label: "Khách Thường", color: "bg-gray-100 text-gray-700" },
  vip: { label: "VIP", color: "bg-yellow-100 text-yellow-700" },
  wholesale: { label: "Đại Lý", color: "bg-blue-100 text-blue-700" },
  partner: { label: "Đối Tác", color: "bg-purple-100 text-purple-700" },
};

const TX_TYPE_MAP: Record<string, { label: string; color: string; sign: string }> = {
  topup: { label: "Nạp tiền", color: "text-green-600", sign: "+" },
  spend: { label: "Chi tiêu", color: "text-red-600", sign: "-" },
  refund: { label: "Hoàn tiền", color: "text-blue-600", sign: "+" },
  reward: { label: "Thưởng", color: "text-purple-600", sign: "+" },
};

export default function CustomerDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const customerId = parseInt(params.id || "0");
  const [activeTab, setActiveTab] = useState("basic");
  const [editMode, setEditMode] = useState(false);
  const [creditOpen, setCreditOpen] = useState(false);
  const [creditType, setCreditType] = useState<"add" | "subtract">("add");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNote, setCreditNote] = useState("");
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [editForm, setEditForm] = useState({
    name: "", email: "", phone: "", address: "",
    customerRole: "customer" as "customer" | "vip" | "wholesale" | "partner",
    emailVerified: false,
  });

  const { data, isLoading } = trpc.customers.adminGetDetail.useQuery(
    { id: customerId },
    { enabled: !!customerId }
  );
  const utils = trpc.useUtils();
  const refetch = () => utils.customers.adminGetDetail.invalidate({ id: customerId });

  const adminUpdateMutation = trpc.customers.adminUpdate.useMutation({
    onSuccess: () => { toast.success("Đã cập nhật thông tin!"); setEditMode(false); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const adminCreditMutation = trpc.wallet.adminCredit.useMutation({
    onSuccess: () => { toast.success("Đã điều chỉnh số dư!"); setCreditOpen(false); setCreditAmount(""); setCreditNote(""); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const resetPasswordMutation = trpc.customers.adminResetPassword.useMutation({
    onSuccess: () => { toast.success("Đã đặt lại mật khẩu!"); setResetPwOpen(false); setNewPassword(""); },
    onError: (e: any) => toast.error(e.message),
  });
  const toggleLockMutation = trpc.customers.adminToggleLock.useMutation({
    onSuccess: () => { toast.success("Đã cập nhật trạng thái!"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  // Sync editForm when data loads
  const customerData = (data as any)?.customer;
  const [formSynced, setFormSynced] = useState(false);
  if (customerData && !formSynced) {
    setFormSynced(true);
    setEditForm({
      name: customerData.name || "",
      email: customerData.email || "",
      phone: customerData.phone || "",
      address: customerData.address || "",
      customerRole: customerData.customerRole || "customer",
      emailVerified: customerData.emailVerified || false,
    });
  }

  const customer = customerData;
  const recentTransactions = (data as any)?.recentTransactions || [];
  const sessions = (data as any)?.sessions || [];
  const recentInvoices = (data as any)?.recentInvoices || [];

  const isLocked = customer?.lockedUntil && new Date(customer.lockedUntil) > new Date();
  const walletBalance = parseFloat(customer?.walletBalance || "0");
  const totalPaid = parseFloat(customer?.totalPaid || "0");
  const totalSpent = parseFloat(customer?.totalSpent || "0");

  const handleSaveEdit = () => {
    adminUpdateMutation.mutate({ id: customerId, ...editForm });
  };

  const handleCredit = () => {
    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("Số tiền không hợp lệ"); return; }
    const finalAmount = creditType === "subtract" ? -amount : amount;
    adminCreditMutation.mutate({
      customerEmail: customer?.email || "",
      amount: finalAmount,
      description: creditNote || (creditType === "add" ? "Admin cộng tiền" : "Admin trừ tiền"),
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <User className="h-12 w-12 mb-3 opacity-30" />
          <p>Không tìm thấy khách hàng</p>
          <Button variant="outline" className="mt-4" onClick={() => setLocation("/customers")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const roleInfo = ROLE_MAP[customer.customerRole || "customer"] || ROLE_MAP.customer;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <Button variant="ghost" size="sm" className="gap-1.5 text-gray-500 hover:text-gray-700 -ml-2" onClick={() => setLocation("/customers")}>
          <ArrowLeft className="h-4 w-4" /> Danh sách khách hàng
        </Button>

        {/* Header Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              {customer.avatarUrl ? (
                <img src={customer.avatarUrl} alt={customer.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                  {customer.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              {customer.emailVerified && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
                  <CheckCircle className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleInfo.color}`}>{roleInfo.label}</span>
                {isLocked ? (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">Bị khóa</span>
                ) : (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Hoạt động</span>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <span className="font-mono">ID: #{customer.id}</span>
                <span className="mx-1">·</span>
                <span>Tham gia: {formatDate(customer.createdAt)}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-0.5">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{customer.email}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            <Button size="sm" className="gap-1.5 bg-green-500 hover:bg-green-600 text-white" onClick={() => { setCreditType("add"); setCreditOpen(true); }}>
              <Plus className="h-4 w-4" /> Cộng tiền
            </Button>
            <Button size="sm" className="gap-1.5 bg-red-500 hover:bg-red-600 text-white" onClick={() => { setCreditType("subtract"); setCreditOpen(true); }}>
              <Minus className="h-4 w-4" /> Trừ tiền
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setLocation("/admin/tickets")}>
              <Ticket className="h-4 w-4" /> Tạo ticket
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toggleLockMutation.mutate({ id: customerId, lock: !isLocked })}>
              {isLocked ? <Lock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {isLocked ? "Mở khóa" : "Khóa TK"}
            </Button>
          </div>
        </div>

        {/* Wallet Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Wallet, label: "Ví chính", value: formatCurrency(walletBalance), color: "text-purple-600", bg: "bg-purple-50" },
            { icon: TrendingUp, label: "Tổng tiền nạp", value: formatCurrency(totalPaid), color: "text-green-600", bg: "bg-green-50" },
            { icon: ShoppingCart, label: "Đã sử dụng", value: formatCurrency(totalSpent), color: "text-orange-600", bg: "bg-orange-50" },
            { icon: CreditCard, label: "Số tiền nợ", value: formatCurrency(Math.max(0, totalSpent - totalPaid)), color: "text-red-600", bg: "bg-red-50" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{stat.label}</p>
                <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-100 px-2 pt-2 overflow-x-auto">
              <TabsList className="bg-transparent p-0 h-auto gap-0 border-0 flex min-w-max">
                {[
                  { value: "basic", label: "Thông tin cơ bản", icon: User },
                  { value: "security", label: "Bảo mật", icon: Shield },
                  { value: "permissions", label: "Quyền hạn", icon: Settings },
                  { value: "system", label: "Thông tin hệ thống", icon: Settings },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5 text-sm font-medium text-gray-500 gap-1.5 h-auto whitespace-nowrap"
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="basic" className="p-5 mt-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Thông tin cơ bản</h3>
                {!editMode ? (
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditMode(true)}>
                    <Edit className="h-4 w-4" /> Chỉnh sửa
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>
                      <X className="h-4 w-4 mr-1" /> Hủy
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5" onClick={handleSaveEdit} disabled={adminUpdateMutation.isPending}>
                      {adminUpdateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Lưu thay đổi
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "name", label: "Username", icon: User, type: "text" },
                  { key: "email", label: "Email", icon: Mail, type: "email" },
                  { key: "phone", label: "Phone", icon: Phone, type: "text" },
                  { key: "address", label: "Địa chỉ", icon: MapPin, type: "text" },
                ].map((field) => (
                  <div key={field.key}>
                    <Label className="text-sm font-medium text-gray-700">{field.label}</Label>
                    {editMode ? (
                      <Input type={field.type} value={(editForm as any)[field.key]} onChange={(e) => setEditForm(f => ({ ...f, [field.key]: e.target.value }))} className="mt-1" />
                    ) : (
                      <div className="mt-1 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        <field.icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-900 text-sm">{(customer as any)[field.key] || "—"}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {recentInvoices.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                      <FileText className="h-4 w-4" /> Đơn hàng gần đây
                    </h4>
                    <Button variant="ghost" size="sm" className="text-blue-600 gap-1">
                      Xem tất cả <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {recentInvoices.map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => setLocation(`/invoices/${inv.id}`)}>
                        <div>
                          <span className="font-mono text-xs text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded">{inv.invoiceNumber}</span>
                          <span className="text-xs text-gray-500 ml-2">{formatDate(inv.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{formatCurrency(inv.totalAmount)}</span>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="security" className="p-5 mt-0">
              <h3 className="font-semibold text-gray-900 mb-4">Bảo mật</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center"><Key className="h-4 w-4 text-blue-600" /></div>
                    <div><p className="text-sm font-medium text-gray-900">Mật khẩu</p><p className="text-xs text-gray-500">Đặt lại mật khẩu cho tài khoản này</p></div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setResetPwOpen(true)}>Đặt lại</Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${isLocked ? "bg-red-100" : "bg-green-100"} flex items-center justify-center`}>
                      {isLocked ? <Lock className="h-4 w-4 text-red-600" /> : <Lock className="h-4 w-4 text-green-600" />}
                    </div>
                    <div><p className="text-sm font-medium text-gray-900">Trạng thái tài khoản</p><p className="text-xs text-gray-500">{isLocked ? "Tài khoản đang bị khóa" : "Tài khoản đang hoạt động"}</p></div>
                  </div>
                  <Button size="sm" variant={isLocked ? "default" : "outline"} className={isLocked ? "bg-green-600 hover:bg-green-700 text-white" : ""} onClick={() => toggleLockMutation.mutate({ id: customerId, lock: !isLocked })}>
                    {isLocked ? "Mở khóa" : "Khóa TK"}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center"><Shield className="h-4 w-4 text-purple-600" /></div>
                    <div><p className="text-sm font-medium text-gray-900">Xác thực 2 lớp (2FA)</p><p className="text-xs text-gray-500">{customer.totpEnabled ? "Đã bật" : "Chưa bật"}</p></div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${customer.totpEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{customer.totpEnabled ? "Bật" : "Tắt"}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center"><Mail className="h-4 w-4 text-orange-600" /></div>
                    <div><p className="text-sm font-medium text-gray-900">Email đã xác minh</p><p className="text-xs text-gray-500">{customer.email}</p></div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${customer.emailVerified ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{customer.emailVerified ? "Đã xác minh" : "Chưa xác minh"}</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="p-5 mt-0">
              <h3 className="font-semibold text-gray-900 mb-4">Quyền hạn</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Phân loại khách hàng</Label>
                  <Select value={editForm.customerRole} onValueChange={(v: any) => { setEditForm(f => ({ ...f, customerRole: v })); adminUpdateMutation.mutate({ id: customerId, customerRole: v }); }}>
                    <SelectTrigger className="mt-1 w-full max-w-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Khách Thường</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="wholesale">Đại Lý</SelectItem>
                      <SelectItem value="partner">Đối Tác</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">Phân loại ảnh hưởng đến giá ưu đãi và quyền lợi</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${roleInfo.color}`}><Shield className="h-4 w-4" /></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{roleInfo.label}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {editForm.customerRole === "customer" && "Khách hàng thông thường, giá mặc định"}
                        {editForm.customerRole === "vip" && "Khách VIP, được ưu đãi đặc biệt và hỗ trợ ưu tiên"}
                        {editForm.customerRole === "wholesale" && "Đại lý, được giá sỉ và hoa hồng"}
                        {editForm.customerRole === "partner" && "Đối tác chiến lược, quyền lợi cao nhất"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="system" className="p-5 mt-0">
              <h3 className="font-semibold text-gray-900 mb-4">Thông tin hệ thống</h3>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Wallet className="h-4 w-4" /> Biến động số dư gần nhất
                  </h4>
                  <Button variant="ghost" size="sm" className="text-blue-600 gap-1" onClick={() => setLocation("/admin/topup-history")}>
                    Xem tất cả <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl">
                    <Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Chưa có giao dịch nào</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Thay đổi</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Số dư sau</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Thời gian</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Lý do</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTransactions.map((tx: any) => {
                          const txInfo = TX_TYPE_MAP[tx.type] || { label: tx.type, color: "text-gray-600", sign: "" };
                          return (
                            <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="py-2.5 px-3"><span className={`font-semibold ${txInfo.color}`}>{txInfo.sign}{formatCurrency(tx.amount)}</span></td>
                              <td className="py-2.5 px-3 text-gray-700">{formatCurrency(tx.balanceAfter)}</td>
                              <td className="py-2.5 px-3 text-gray-500 text-xs">{formatDateTime(tx.createdAt)}</td>
                              <td className="py-2.5 px-3 text-gray-500 text-xs truncate max-w-[140px]">{tx.description || txInfo.label}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                  <Settings className="h-4 w-4" /> Phiên đăng nhập
                </h4>
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl">
                    <Settings className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Chưa có phiên đăng nhập</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session: any) => {
                      const isExpired = new Date(session.expiresAt) < new Date();
                      return (
                        <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center"><Settings className="h-4 w-4 text-blue-600" /></div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{session.isAdminSession ? "Phiên Admin" : "Trình duyệt"}</p>
                              <p className="text-xs text-gray-500">Tạo lúc {timeAgo(session.createdAt)}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${isExpired ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                            {isExpired ? "Hết hạn" : "Đang hoạt động"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Ngày tạo", value: formatDateTime(customer.createdAt) },
                  { label: "Cập nhật lần cuối", value: formatDateTime(customer.updatedAt) },
                  { label: "Đăng nhập lần cuối", value: customer.lastLoginAt ? formatDateTime(customer.lastLoginAt) : "Chưa đăng nhập" },
                  { label: "Số lần đăng nhập sai", value: `${customer.loginAttempts || 0} lần` },
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="font-medium text-gray-900 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={creditOpen} onOpenChange={setCreditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {creditType === "add" ? <><Plus className="h-5 w-5 text-green-500" /> Cộng tiền vào ví</> : <><Minus className="h-5 w-5 text-red-500" /> Trừ tiền từ ví</>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <span className="text-gray-500">Số dư hiện tại: </span>
              <span className="font-bold text-gray-900">{formatCurrency(walletBalance)}</span>
            </div>
            <div>
              <Label>Số tiền (VNĐ)</Label>
              <Input type="number" placeholder="Nhập số tiền..." value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Ghi chú</Label>
              <Input placeholder="Lý do điều chỉnh..." value={creditNote} onChange={(e) => setCreditNote(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditOpen(false)}>Hủy</Button>
            <Button className={creditType === "add" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"} onClick={handleCredit} disabled={adminCreditMutation.isPending}>
              {adminCreditMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {creditType === "add" ? "Cộng tiền" : "Trừ tiền"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetPwOpen} onOpenChange={setResetPwOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-500" /> Đặt lại mật khẩu
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Mật khẩu mới</Label>
              <Input type="password" placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..." value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPwOpen(false)}>Hủy</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => resetPasswordMutation.mutate({ id: customerId, newPassword })} disabled={resetPasswordMutation.isPending || newPassword.length < 6}>
              {resetPasswordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Đặt lại mật khẩu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
