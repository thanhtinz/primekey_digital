import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Search, Users, Loader2, Mail, Phone, MapPin, Eye, UserPlus, TrendingUp, Shield, User, Key } from "@/components/Icon";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";

export default function Customers() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("customers");
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "" });

  // Staff state
  const [staffSearchTerm, setStaffSearchTerm] = useState("");
  const [createStaffOpen, setCreateStaffOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState<number | null>(null);
  const [staffForm, setStaffForm] = useState({ username: "", password: "", name: "", role: "user" as "user" | "admin" });
  const [newPassword, setNewPassword] = useState("");

  const { data: customers = [], isLoading } = trpc.customers.list.useQuery();
  const { data: staffList = [], refetch: refetchStaff } = trpc.staff.list.useQuery();
  const utils = trpc.useUtils();

  // Customer mutations
  const createCustomer = trpc.customers.create.useMutation({
    onSuccess: () => { toast.success("Thêm khách hàng thành công!"); utils.customers.list.invalidate(); resetForm(); },
    onError: (err) => toast.error(err.message || "Lỗi khi thêm khách hàng"),
  });
  const updateCustomer = trpc.customers.update.useMutation({
    onSuccess: () => { toast.success("Cập nhật thành công!"); utils.customers.list.invalidate(); resetForm(); },
    onError: (err) => toast.error(err.message || "Lỗi khi cập nhật"),
  });
  const deleteCustomer = trpc.customers.delete.useMutation({
    onSuccess: () => { toast.success("Đã xóa khách hàng"); utils.customers.list.invalidate(); },
    onError: (err) => toast.error(err.message || "Lỗi khi xóa"),
  });
  const updateCustomerRole = trpc.customers.updateRole.useMutation({
    onSuccess: () => { toast.success("Đã cập nhật phân loại!"); utils.customers.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  // Staff mutations
  const createStaffMutation = trpc.staff.create.useMutation({
    onSuccess: () => { toast.success("Tạo tài khoản thành công!"); setCreateStaffOpen(false); setStaffForm({ username: "", password: "", name: "", role: "user" }); refetchStaff(); },
    onError: (e) => toast.error(e.message),
  });
  const updateRoleMutation = trpc.staff.updateRole.useMutation({
    onSuccess: () => { toast.success("Đã cập nhật quyền!"); refetchStaff(); },
    onError: (e) => toast.error(e.message),
  });
  const resetPasswordMutation = trpc.staff.resetPassword.useMutation({
    onSuccess: () => { toast.success("Đã đổi mật khẩu!"); setResetPasswordOpen(null); setNewPassword(""); refetchStaff(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteStaffMutation = trpc.staff.delete.useMutation({
    onSuccess: () => { toast.success("Đã xóa tài khoản!"); refetchStaff(); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => { setFormData({ name: "", email: "", phone: "", address: "" }); setEditingId(null); setIsOpen(false); };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  const filteredStaff = (staffList as any[]).filter(s =>
    s.name?.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(staffSearchTerm.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast.error("Vui lòng nhập tên khách hàng"); return; }
    if (!formData.email.trim()) { toast.error("Vui lòng nhập email"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { toast.error("Email không hợp lệ"); return; }
    if (editingId) { await updateCustomer.mutateAsync({ id: editingId, ...formData }); }
    else { await createCustomer.mutateAsync({ name: formData.name, email: formData.email, phone: formData.phone || undefined, address: formData.address || undefined }); }
  };

  const handleEdit = (customer: typeof customers[0]) => {
    setFormData({ name: customer.name, email: customer.email || "", phone: customer.phone || "", address: customer.address || "" });
    setEditingId(customer.id); setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa khách hàng này?")) return;
    setDeletingId(id);
    try { await deleteCustomer.mutateAsync({ id }); } finally { setDeletingId(null); }
  };

  const handleCreateStaff = () => {
    if (!staffForm.username || !staffForm.password || !staffForm.name) { toast.error("Vui lòng điền đầy đủ thông tin"); return; }
    createStaffMutation.mutate(staffForm);
  };

  const isPending = createCustomer.isPending || updateCustomer.isPending;
  const withEmail = customers.filter(c => c.email).length;
  const withPhone = customers.filter(c => c.phone).length;
  const adminCount = (staffList as any[]).filter(s => s.role === "admin").length;

  const avatarColor = (name: string) => {
    const colors = ["bg-blue-500","bg-purple-500","bg-teal-500","bg-orange-500","bg-pink-500","bg-indigo-500","bg-green-500","bg-red-500"];
    let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) & 0xffff;
    return colors[h % colors.length];
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* ── Page Header ── */}
        <div className="ak-page-header">
          <div>
            <h1 className="ak-page-title">Khách Hàng & Nhân Viên</h1>
            <p className="ak-page-subtitle">Quản lý khách hàng và tài khoản nhân viên</p>
          </div>
          {activeTab === "customers" ? (
            <Button onClick={() => { resetForm(); setIsOpen(true); }} className="gap-1.5 bg-blue-600 hover:bg-blue-700" size="sm">
              <Plus className="h-4 w-4" /> Thêm Khách Hàng
            </Button>
          ) : (
            <Button onClick={() => setCreateStaffOpen(true)} className="gap-1.5 bg-blue-600 hover:bg-blue-700" size="sm">
              <UserPlus className="h-4 w-4" /> Thêm Tài Khoản
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-gray-200 shadow-sm">
            <TabsTrigger value="customers" className="gap-1.5">
              <Users className="h-4 w-4" /> Khách Hàng ({customers.length})
            </TabsTrigger>
            <TabsTrigger value="staff" className="gap-1.5">
              <Shield className="h-4 w-4" /> Nhân Viên ({(staffList as any[]).length})
            </TabsTrigger>
          </TabsList>

          {/* ── Customers Tab ── */}
          <TabsContent value="customers" className="mt-4 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="ak-stat-card">
                <div className="ak-stat-icon bg-blue-100"><Users className="h-5 w-5 text-blue-600" /></div>
                <div><div className="ak-stat-value">{customers.length}</div><div className="ak-stat-label">Tổng khách hàng</div></div>
              </div>
              <div className="ak-stat-card">
                <div className="ak-stat-icon bg-green-100"><Mail className="h-5 w-5 text-green-600" /></div>
                <div><div className="ak-stat-value">{withEmail}</div><div className="ak-stat-label">Có email</div></div>
              </div>
              <div className="ak-stat-card hidden sm:flex">
                <div className="ak-stat-icon bg-purple-100"><Phone className="h-5 w-5 text-purple-600" /></div>
                <div><div className="ak-stat-value">{withPhone}</div><div className="ak-stat-label">Có số điện thoại</div></div>
              </div>
            </div>

            {/* Search + Table */}
            <div className="ak-card">
              <div className="ak-card-header">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm theo tên, email, SĐT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                <span className="text-sm text-gray-500">{filteredCustomers.length} kết quả</span>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="ak-empty">
                  <div className="ak-empty-icon"><Users className="h-6 w-6" /></div>
                  <div className="ak-empty-title">{searchTerm ? "Không tìm thấy khách hàng" : "Chưa có khách hàng nào"}</div>
                  <div className="ak-empty-desc">{searchTerm ? "Thử từ khóa khác" : "Thêm khách hàng đầu tiên của bạn"}</div>
                </div>
              ) : (
                <div className="ak-table-wrapper rounded-none border-0">
                  <table className="ak-table">
                    <thead>
                      <tr>
                        <th>Khách Hàng</th>
                        <th className="hidden sm:table-cell">Liên Hệ</th>
                        <th className="hidden lg:table-cell">Địa Chỉ</th>
                        <th className="hidden md:table-cell">Phân Loại</th>
                        <th className="text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map(customer => (
                        <tr key={customer.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className={`h-9 w-9 rounded-full ${avatarColor(customer.name)} flex items-center justify-center flex-shrink-0`}>
                                <span className="text-sm font-bold text-white">{customer.name.charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{customer.name}</p>
                                <p className="text-xs text-gray-400 sm:hidden">{customer.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell">
                            <div className="space-y-0.5">
                              {customer.email && (
                                <div className="flex items-center gap-1.5 text-gray-600">
                                  <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                  <span className="text-xs">{customer.email}</span>
                                </div>
                              )}
                              {customer.phone && (
                                <div className="flex items-center gap-1.5 text-gray-600">
                                  <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                  <span className="text-xs">{customer.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="hidden lg:table-cell">
                            {customer.address ? (
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                <span className="text-xs truncate max-w-48">{customer.address}</span>
                              </div>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="hidden md:table-cell">
                            <Select
                              value={(customer as any).customerRole || "customer"}
                              onValueChange={(role: "customer" | "vip" | "wholesale" | "partner") =>
                                updateCustomerRole.mutate({ id: customer.id, customerRole: role })
                              }
                            >
                              <SelectTrigger className="h-7 text-xs w-28 border-gray-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="customer">Khách Thường</SelectItem>
                                <SelectItem value="vip">VIP</SelectItem>
                                <SelectItem value="wholesale">Đại Lý</SelectItem>
                                <SelectItem value="partner">Đối Tác</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td>
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => setLocation(`/customers/${customer.id}`)} title="Xem chi tiết"
                                className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleEdit(customer)} title="Sửa"
                                className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDelete(customer.id)} disabled={deletingId === customer.id} title="Xóa"
                                className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                                {deletingId === customer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Staff Tab ── */}
          <TabsContent value="staff" className="mt-4 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="ak-stat-card">
                <div className="ak-stat-icon bg-blue-100"><Users className="h-5 w-5 text-blue-600" /></div>
                <div><div className="ak-stat-value">{(staffList as any[]).length}</div><div className="ak-stat-label">Tổng tài khoản</div></div>
              </div>
              <div className="ak-stat-card">
                <div className="ak-stat-icon bg-red-100"><Shield className="h-5 w-5 text-red-600" /></div>
                <div><div className="ak-stat-value">{adminCount}</div><div className="ak-stat-label">Quản trị viên</div></div>
              </div>
              <div className="ak-stat-card hidden sm:flex">
                <div className="ak-stat-icon bg-green-100"><User className="h-5 w-5 text-green-600" /></div>
                <div><div className="ak-stat-value">{(staffList as any[]).length - adminCount}</div><div className="ak-stat-label">Nhân viên</div></div>
              </div>
            </div>

            {/* Search + Table */}
            <div className="ak-card">
              <div className="ak-card-header">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm theo tên, email..."
                    value={staffSearchTerm}
                    onChange={(e) => setStaffSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                <span className="text-sm text-gray-500">{filteredStaff.length} tài khoản</span>
              </div>

              {filteredStaff.length === 0 ? (
                <div className="ak-empty">
                  <div className="ak-empty-icon"><Users className="h-6 w-6" /></div>
                  <div className="ak-empty-title">Chưa có tài khoản nhân viên</div>
                  <div className="ak-empty-desc">Tạo tài khoản đầu tiên để bắt đầu</div>
                </div>
              ) : (
                <div className="ak-table-wrapper rounded-none border-0">
                  <table className="ak-table">
                    <thead>
                      <tr>
                        <th>Tài Khoản</th>
                        <th className="hidden sm:table-cell">Email</th>
                        <th>Quyền</th>
                        <th className="text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaff.map((s: any) => (
                        <tr key={s.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className={`h-9 w-9 rounded-full ${avatarColor(s.name || s.email)} flex items-center justify-center flex-shrink-0`}>
                                <span className="text-sm font-bold text-white">{(s.name || s.email || "?")[0].toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{s.name || "—"}</p>
                                <p className="text-xs text-gray-400 sm:hidden">{s.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-xs">{s.email}</span>
                            </div>
                          </td>
                          <td>
                            <Select
                              value={s.role}
                              onValueChange={(role: "user" | "admin") => updateRoleMutation.mutate({ id: s.id, role })}
                            >
                              <SelectTrigger className="h-7 w-28 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">
                                  <div className="flex items-center gap-1.5">
                                    <User className="h-3 w-3 text-blue-500" />
                                    <span>Nhân viên</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="admin">
                                  <div className="flex items-center gap-1.5">
                                    <Shield className="h-3 w-3 text-red-500" />
                                    <span>Admin</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setResetPasswordOpen(s.id)}
                                title="Đổi mật khẩu"
                                className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              >
                                <Key className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => { if (confirm(`Xóa tài khoản "${s.name || s.email}"?`)) deleteStaffMutation.mutate({ id: s.id }); }}
                                title="Xóa tài khoản"
                                className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Customer Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsOpen(true); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Chỉnh Sửa Khách Hàng" : "Thêm Khách Hàng Mới"}</DialogTitle>
            <DialogDescription>{editingId ? "Cập nhật thông tin khách hàng" : "Nhập thông tin khách hàng mới"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Tên Khách Hàng <span className="text-red-500">*</span></Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nguyễn Văn A" className="mt-1.5" />
            </div>
            <div>
              <Label className="text-sm font-medium">Email <span className="text-red-500">*</span></Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" className="mt-1.5" />
            </div>
            <div>
              <Label className="text-sm font-medium">Số Điện Thoại</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="0901234567" className="mt-1.5" />
            </div>
            <div>
              <Label className="text-sm font-medium">Địa Chỉ</Label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="123 Đường ABC, TP.HCM" className="mt-1.5" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleSubmit} disabled={isPending} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Đang lưu...</> : (editingId ? "Cập Nhật" : "Thêm Khách Hàng")}
              </Button>
              <Button variant="outline" onClick={resetForm} disabled={isPending}>Hủy</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Staff Dialog */}
      <Dialog open={createStaffOpen} onOpenChange={setCreateStaffOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo Tài Khoản Mới</DialogTitle>
            <DialogDescription>Tạo tài khoản nhân viên hoặc admin mới trong hệ thống</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Tên đăng nhập <span className="text-red-500">*</span></Label>
              <Input
                value={staffForm.username}
                onChange={e => setStaffForm(f => ({ ...f, username: e.target.value }))}
                placeholder="vd: nhanvien01"
                className="mt-1.5"
              />
              <p className="text-xs text-gray-400 mt-1">Email sẽ là: {staffForm.username || "..."} @staff.local</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Họ tên <span className="text-red-500">*</span></Label>
              <Input
                value={staffForm.name}
                onChange={e => setStaffForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nguyễn Văn A"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Mật khẩu <span className="text-red-500">*</span></Label>
              <Input
                type="password"
                value={staffForm.password}
                onChange={e => setStaffForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Nhập mật khẩu"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Quyền</Label>
              <Select value={staffForm.role} onValueChange={(v: "user" | "admin") => setStaffForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Nhân viên</SelectItem>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleCreateStaff} disabled={createStaffMutation.isPending} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {createStaffMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Đang tạo...</> : "Tạo Tài Khoản"}
              </Button>
              <Button variant="outline" onClick={() => setCreateStaffOpen(false)}>Hủy</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordOpen !== null} onOpenChange={(open) => { if (!open) setResetPasswordOpen(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Đổi Mật Khẩu</DialogTitle>
            <DialogDescription>Nhập mật khẩu mới cho tài khoản này</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Mật khẩu mới <span className="text-red-500">*</span></Label>
              <Input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                className="mt-1.5"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => resetPasswordOpen && resetPasswordMutation.mutate({ id: resetPasswordOpen, newPassword })}
                disabled={resetPasswordMutation.isPending || !newPassword}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {resetPasswordMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Đang đổi...</> : "Xác Nhận"}
              </Button>
              <Button variant="outline" onClick={() => setResetPasswordOpen(null)}>Hủy</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
