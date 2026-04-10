import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search, Users, Loader2, Mail, Phone, MapPin, Eye, UserPlus, TrendingUp } from "@/components/Icon";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";

export default function Customers() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "" });

  const { data: customers = [], isLoading } = trpc.customers.list.useQuery();
  const utils = trpc.useUtils();

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

  const resetForm = () => { setFormData({ name: "", email: "", phone: "", address: "" }); setEditingId(null); setIsOpen(false); };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm))
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

  const isPending = createCustomer.isPending || updateCustomer.isPending;
  const withEmail = customers.filter(c => c.email).length;
  const withPhone = customers.filter(c => c.phone).length;

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
            <h1 className="ak-page-title">Khách Hàng</h1>
            <p className="ak-page-subtitle">{customers.length} khách hàng trong hệ thống</p>
          </div>
          <Button onClick={() => { resetForm(); setIsOpen(true); }} className="gap-1.5 bg-blue-600 hover:bg-blue-700" size="sm">
            <Plus className="h-4 w-4" /> Thêm Khách Hàng
          </Button>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="ak-stat-card">
            <div className="ak-stat-icon bg-blue-100"><Users className="h-5 w-5 text-blue-600" /></div>
            <div><div className="ak-stat-value">{customers.length}</div><div className="ak-stat-label">Tổng khách hàng</div></div>
          </div>
          <div className="ak-stat-card">
            <div className="ak-stat-icon bg-green-100"><UserPlus className="h-5 w-5 text-green-600" /></div>
            <div><div className="ak-stat-value">{withEmail}</div><div className="ak-stat-label">Có email</div></div>
          </div>
          <div className="ak-stat-card hidden sm:flex">
            <div className="ak-stat-icon bg-purple-100"><TrendingUp className="h-5 w-5 text-purple-600" /></div>
            <div><div className="ak-stat-value">{withPhone}</div><div className="ak-stat-label">Có số điện thoại</div></div>
          </div>
        </div>

        {/* ── Search + Table ── */}
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
              {!searchTerm && (
                <Button size="sm" onClick={() => { resetForm(); setIsOpen(true); }} className="mt-3 gap-1.5 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4" /> Thêm Khách Hàng
                </Button>
              )}
            </div>
          ) : (
            <div className="ak-table-wrapper rounded-none border-0">
              <table className="ak-table">
                <thead>
                  <tr>
                    <th>Khách Hàng</th>
                    <th className="hidden sm:table-cell">Liên Hệ</th>
                    <th className="hidden lg:table-cell">Địa Chỉ</th>
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
      </div>

      {/* Add/Edit Dialog */}
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
    </DashboardLayout>
  );
}
