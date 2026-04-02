import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";

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

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
  );

  const handleAddCustomer = () => {
    toast.success("Mở form thêm khách hàng mới!");
  };

  const handleEditCustomer = (name: string) => {
    toast.info(`Đang chỉnh sửa khách hàng: ${name}`);
  };

  const handleDeleteCustomer = (name: string) => {
    toast.error(`Xác nhận xóa khách hàng ${name}?`, {
      action: {
        label: "Xóa",
        onClick: () => {
          toast.loading("Đang xóa...");
          setTimeout(() => {
            setCustomers(customers.filter((c) => c.name !== name));
            toast.success(`Khách hàng ${name} đã được xóa thành công!`);
          }, 800);
        },
      },
    });
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
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Khách Hàng</CardTitle>
            <CardDescription>Tổng cộng: {filteredCustomers.length} khách hàng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Tên Khách Hàng</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Số Điện Thoại</th>
                    <th className="text-left py-3 px-4 font-semibold">Địa Chỉ</th>
                    <th className="text-center py-3 px-4 font-semibold">Số HĐ</th>
                    <th className="text-right py-3 px-4 font-semibold">Tổng Chi Tiêu</th>
                    <th className="text-center py-3 px-4 font-semibold">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{customer.name}</td>
                        <td className="py-3 px-4">{customer.email}</td>
                        <td className="py-3 px-4">{customer.phone}</td>
                        <td className="py-3 px-4 text-xs">{customer.address}</td>
                        <td className="py-3 px-4 text-center">{customer.totalInvoices}</td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {formatCurrency(customer.totalSpent)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditCustomer(customer.name)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteCustomer(customer.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        Không tìm thấy khách hàng nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
