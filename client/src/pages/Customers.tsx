import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "" });

  // Fetch customers
  const { data: customers = [], isLoading, refetch } = trpc.customers.list.useQuery();

  // Mutations
  const createCustomer = trpc.customers.create.useMutation({
    onSuccess: () => {
      toast.success("Thêm khách hàng thành công!");
      refetch();
      setFormData({ name: "", email: "", phone: "", address: "" });
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Lỗi khi thêm khách hàng");
    },
  });

  const updateCustomer = trpc.customers.update.useMutation({
    onSuccess: () => {
      toast.success("Cập nhật khách hàng thành công!");
      refetch();
      setFormData({ name: "", email: "", phone: "", address: "" });
      setEditingId(null);
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Lỗi khi cập nhật khách hàng");
    },
  });

  const deleteCustomer = trpc.customers.delete.useMutation({
    onSuccess: () => {
      toast.success("Xóa khách hàng thành công!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Lỗi khi xóa khách hàng");
    },
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAdd = async () => {
    if (!formData.name) {
      toast.error("Vui lòng nhập tên khách hàng");
      return;
    }
    if (!formData.email) {
      toast.error("Vui lòng nhập email");
      return;
    }

    if (editingId) {
      await updateCustomer.mutateAsync({
        id: editingId,
        ...formData,
      });
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

  const handleDelete = (id: number) => {
    if (confirm("Bạn chắc chắn muốn xóa khách hàng này?")) {
      deleteCustomer.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Quản Lý Khách Hàng</h1>
            <p className="text-gray-600">Danh sách tất cả khách hàng</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setFormData({ name: "", email: "", phone: "", address: "" }); setEditingId(null); }} className="gap-2">
                <Plus className="h-4 w-4" />
                Thêm Khách Hàng
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Sửa Khách Hàng" : "Thêm Khách Hàng"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tên Khách Hàng</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nhập tên" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Nhập email" type="email" />
                </div>
                <div>
                  <Label>Số Điện Thoại</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Nhập số điện thoại" />
                </div>
                <div>
                  <Label>Địa Chỉ</Label>
                  <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Nhập địa chỉ" />
                </div>
                <Button onClick={handleAdd} className="w-full" disabled={createCustomer.isPending || updateCustomer.isPending}>
                  {createCustomer.isPending || updateCustomer.isPending ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold">Tên Khách Hàng</th>
                <th className="text-left py-3 px-4 font-semibold">Email</th>
                <th className="text-left py-3 px-4 font-semibold">Số Điện Thoại</th>
                <th className="text-left py-3 px-4 font-semibold">Địa Chỉ</th>
                <th className="text-left py-3 px-4 font-semibold">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    Không có khách hàng nào
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{customer.name}</td>
                    <td className="py-3 px-4">{customer.email}</td>
                    <td className="py-3 px-4">{customer.phone}</td>
                    <td className="py-3 px-4">{customer.address}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button onClick={() => handleEdit(customer)} variant="outline" size="sm" className="gap-2">
                          <Edit className="h-4 w-4" />
                          Sửa
                        </Button>
                        <Button onClick={() => handleDelete(customer.id)} variant="outline" size="sm" className="gap-2 text-red-600" disabled={deleteCustomer.isPending}>
                          <Trash2 className="h-4 w-4" />
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
