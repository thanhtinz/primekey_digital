import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search, Users, Loader2, Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "" });

  const { data: customers = [], isLoading } = trpc.customers.list.useQuery();
  const utils = trpc.useUtils();

  const createCustomer = trpc.customers.create.useMutation({
    onSuccess: () => {
      toast.success("Thêm khách hàng thành công!");
      utils.customers.list.invalidate();
      resetForm();
    },
    onError: (err) => toast.error(err.message || "Lỗi khi thêm khách hàng"),
  });

  const updateCustomer = trpc.customers.update.useMutation({
    onSuccess: () => {
      toast.success("Cập nhật thành công!");
      utils.customers.list.invalidate();
      resetForm();
    },
    onError: (err) => toast.error(err.message || "Lỗi khi cập nhật"),
  });

  const deleteCustomer = trpc.customers.delete.useMutation({
    onSuccess: () => {
      toast.success("Đã xóa khách hàng");
      utils.customers.list.invalidate();
    },
    onError: (err) => toast.error(err.message || "Lỗi khi xóa"),
  });

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", address: "" });
    setEditingId(null);
    setIsOpen(false);
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast.error("Vui lòng nhập tên khách hàng"); return; }
    if (!formData.email.trim()) { toast.error("Vui lòng nhập email"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { toast.error("Email không hợp lệ"); return; }

    if (editingId) {
      await updateCustomer.mutateAsync({ id: editingId, ...formData });
    } else {
      await createCustomer.mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
      });
    }
  };

  const handleEdit = (customer: typeof customers[0]) => {
    setFormData({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });
    setEditingId(customer.id);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa khách hàng này?")) return;
    setDeletingId(id);
    try {
      await deleteCustomer.mutateAsync({ id });
    } finally {
      setDeletingId(null);
    }
  };

  const isPending = createCustomer.isPending || updateCustomer.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Khách Hàng</h1>
            <p className="text-sm text-gray-500 mt-0.5">{customers.length} khách hàng trong hệ thống</p>
          </div>
          <Button
            onClick={() => { resetForm(); setIsOpen(true); }}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Thêm Khách Hàng
          </Button>
        </div>

        {/* Search */}
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm theo tên, email, số điện thoại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              {filteredCustomers.length} khách hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Users className="h-14 w-14 mb-3 opacity-20" />
                <p className="font-medium">
                  {searchTerm ? "Không tìm thấy khách hàng" : "Chưa có khách hàng nào"}
                </p>
                <p className="text-sm mt-1 mb-4">
                  {searchTerm ? "Thử từ khóa khác" : "Thêm khách hàng đầu tiên của bạn"}
                </p>
                {!searchTerm && (
                  <Button
                    size="sm"
                    onClick={() => { resetForm(); setIsOpen(true); }}
                    className="gap-1.5 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm Khách Hàng
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-y border-gray-100">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Khách Hàng</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 hidden sm:table-cell">Liên Hệ</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 hidden lg:table-cell">Địa Chỉ</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredCustomers.map(customer => (
                      <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            <p className="text-xs text-gray-400 sm:hidden mt-0.5">{customer.email}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 hidden sm:table-cell">
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
                        <td className="py-3.5 px-4 hidden lg:table-cell">
                          {customer.address ? (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-xs truncate max-w-48">{customer.address}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(customer)}
                              className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                              title="Sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(customer.id)}
                              disabled={deletingId === customer.id}
                              className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                              title="Xóa"
                            >
                              {deletingId === customer.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsOpen(true); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Chỉnh Sửa Khách Hàng" : "Thêm Khách Hàng Mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">
                Tên Khách Hàng <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nguyễn Văn A"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Số Điện Thoại</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0901234567"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Địa Chỉ</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Đường ABC, TP.HCM"
                className="mt-1.5"
              />
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
