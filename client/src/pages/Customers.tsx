import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayoutCustom";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  totalInvoices: number;
  totalAmount: number;
}

const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "Công Ty ABC",
    email: "info@abc.com",
    phone: "0123456789",
    address: "123 Đường ABC, Hà Nội",
    taxId: "0123456789",
    totalInvoices: 5,
    totalAmount: 25000000,
  },
  {
    id: "2",
    name: "Nguyễn Văn A",
    email: "nguyenvana@email.com",
    phone: "0987654321",
    address: "456 Đường XYZ, TP.HCM",
    taxId: "",
    totalInvoices: 3,
    totalAmount: 7500000,
  },
  {
    id: "3",
    name: "Cửa Hàng XYZ",
    email: "shop@xyz.com",
    phone: "0912345678",
    address: "789 Đường DEF, Đà Nẵng",
    taxId: "9876543210",
    totalInvoices: 8,
    totalAmount: 45000000,
  },
];

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredCustomers = mockCustomers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản Lý Khách Hàng</h1>
            <p className="text-gray-600">Quản lý danh sách khách hàng của bạn</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => setIsModalOpen(true)}>
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
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    <CardDescription className="text-xs">{customer.email}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Edit2 className="h-4 w-4 text-blue-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-1">
                  <p><span className="font-semibold">Điện thoại:</span> {customer.phone}</p>
                  <p><span className="font-semibold">Địa chỉ:</span> {customer.address}</p>
                  {customer.taxId && (
                    <p><span className="font-semibold">Mã số thuế:</span> {customer.taxId}</p>
                  )}
                </div>
                <div className="border-t pt-3 flex justify-between text-sm">
                  <div>
                    <p className="text-gray-600">Số hóa đơn</p>
                    <p className="font-bold text-lg">{customer.totalInvoices}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600">Tổng tiền</p>
                    <p className="font-bold text-lg">{(customer.totalAmount / 1000000).toFixed(1)}M</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Xem Chi Tiết
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">Không tìm thấy khách hàng nào</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
