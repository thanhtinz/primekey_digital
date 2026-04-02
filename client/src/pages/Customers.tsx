import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";

const mockCustomers = [
  { id: 1, name: "Công Ty A", email: "contact@ctyA.com", phone: "0901234567", address: "123 Đường ABC, TP HCM" },
  { id: 2, name: "Công Ty B", email: "info@ctyB.com", phone: "0912345678", address: "456 Đường XYZ, Hà Nội" },
  { id: 3, name: "Công Ty C", email: "sales@ctyC.com", phone: "0923456789", address: "789 Đường DEF, Đà Nẵng" },
];

export default function Customers() {
  const [customers, setCustomers] = useState(mockCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "" });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    if (!formData.name) {
      toast.error("Vui lòng nhập tên khách hàng");
      return;
    }
    if (editingId) {
      setCustomers(customers.map(c => c.id === editingId ? { ...c, ...formData } : c));
      toast.success("Cập nhật khách hàng thành công!");
    } else {
      setCustomers([...customers, { id: Date.now(), ...formData }]);
      toast.success("Thêm khách hàng thành công!");
    }
    setFormData({ name: "", email: "", phone: "", address: "" });
    setEditingId(null);
    setIsOpen(false);
  };

  const handleEdit = (customer: typeof mockCustomers[0]) => {
    setFormData(customer);
    setEditingId(customer.id);
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn chắc chắn muốn xóa khách hàng này?")) {
      setCustomers(customers.filter(c => c.id !== id));
      toast.success("Xóa khách hàng thành công!");
    }
  };

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
                  <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Nhập email" />
                </div>
                <div>
                  <Label>Số Điện Thoại</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Nhập số điện thoại" />
                </div>
                <div>
                  <Label>Địa Chỉ</Label>
                  <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Nhập địa chỉ" />
                </div>
                <Button onClick={handleAdd} className="w-full">Lưu</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input placeholder="Tìm kiếm khách hàng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Tên Khách Hàng</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Số Điện Thoại</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Địa Chỉ</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3">{customer.name}</td>
                  <td className="px-6 py-3 text-gray-600">{customer.email}</td>
                  <td className="px-6 py-3 text-gray-600">{customer.phone}</td>
                  <td className="px-6 py-3 text-gray-600">{customer.address}</td>
                  <td className="px-6 py-3 text-right flex gap-2 justify-end">
                    <Button onClick={() => handleEdit(customer)} variant="outline" size="sm" className="gap-2">
                      <Edit className="h-4 w-4" />
                      Sửa
                    </Button>
                    <Button onClick={() => handleDelete(customer.id)} variant="outline" size="sm" className="gap-2 text-red-600">
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
