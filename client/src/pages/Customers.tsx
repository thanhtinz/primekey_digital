import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalInvoices: number;
  totalSpent: number;
}

const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "Công Ty ABC",
    email: "contact@abc.com",
    phone: "0912345678",
    address: "123 Đường Nguyễn Huệ, TP.HCM",
    totalInvoices: 15,
    totalSpent: 250000000,
  },
  {
    id: "2",
    name: "Nguyễn Văn A",
    email: "nguyenvana@email.com",
    phone: "0987654321",
    address: "456 Đường Lê Lợi, Hà Nội",
    totalInvoices: 8,
    totalSpent: 45000000,
  },
  {
    id: "3",
    name: "Cửa Hàng XYZ",
    email: "shop@xyz.com",
    phone: "0901234567",
    address: "789 Đường Trần Hưng Đạo, Đà Nẵng",
    totalInvoices: 22,
    totalSpent: 380000000,
  },
];

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [isOpen, setIsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
  );

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setFormData({ name: "", email: "", phone: "", address: "" });
    setIsOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    });
    setIsOpen(true);
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    toast.error(`Xác nhận xóa khách hàng ${name}?`, {
      action: {
        label: "Xóa",
        onClick: () => {
          toast.loading("Đang xóa...");
          setTimeout(() => {
            setCustomers(customers.filter((c) => c.id !== id));
            toast.success(`Khách hàng ${name} đã được xóa thành công!`);
          }, 800);
        },
      },
    });
  };

  const handleSaveCustomer = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (editingCustomer) {
      setCustomers(
        customers.map((c) =>
          c.id === editingCustomer.id
            ? { ...c, ...formData }
            : c
        )
      );
      toast.success("Cập nhật khách hàng thành công!");
    } else {
      const newCustomer: Customer = {
        id: Date.now().toString(),
        ...formData,
        totalInvoices: 0,
        totalSpent: 0,
      };
      setCustomers([...customers, newCustomer]);
      toast.success("Thêm khách hàng thành công!");
    }
    setIsOpen(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Quản Lý Khách Hàng</h1>
            <p className="text-gray-600">Quản lý danh sách khách hàng của bạn</p>
          </div>
          <Button onClick={handleAddCustomer} className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm Khách Hàng
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm khách hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Khách Hàng</CardTitle>
            <CardDescription>{filteredCustomers.length} khách hàng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Tên</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Điện Thoại</th>
                    <th className="text-left py-3 px-4 font-semibold">Hóa Đơn</th>
                    <th className="text-left py-3 px-4 font-semibold">Tổng Chi</th>
                    <th className="text-left py-3 px-4 font-semibold">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{customer.name}</td>
                      <td className="py-3 px-4">{customer.email}</td>
                      <td className="py-3 px-4">{customer.phone}</td>
                      <td className="py-3 px-4">{customer.totalInvoices}</td>
                      <td className="py-3 px-4 font-semibold">{formatCurrency(customer.totalSpent)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCustomer(customer)}
                            className="gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Sửa
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                            className="gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Xóa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Chỉnh Sửa Khách Hàng" : "Thêm Khách Hàng Mới"}
              </DialogTitle>
              <DialogDescription>
                {editingCustomer
                  ? "Cập nhật thông tin khách hàng"
                  : "Nhập thông tin khách hàng mới"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Tên Khách Hàng</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên khách hàng"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Nhập email"
                />
              </div>
              <div>
                <Label htmlFor="phone">Điện Thoại</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Nhập số điện thoại"
                />
              </div>
              <div>
                <Label htmlFor="address">Địa Chỉ</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Nhập địa chỉ"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSaveCustomer}>
                  {editingCustomer ? "Cập Nhật" : "Thêm"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
