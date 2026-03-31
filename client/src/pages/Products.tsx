import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayoutCustom";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  timesUsed: number;
}

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Dịch vụ tư vấn",
    description: "Tư vấn kinh doanh chuyên nghiệp",
    price: 500000,
    unit: "giờ",
    category: "Dịch vụ",
    timesUsed: 12,
  },
  {
    id: "2",
    name: "Thiết kế website",
    description: "Thiết kế website responsive",
    price: 5000000,
    unit: "dự án",
    category: "Dịch vụ",
    timesUsed: 5,
  },
  {
    id: "3",
    name: "Sản phẩm A",
    description: "Sản phẩm chất lượng cao",
    price: 250000,
    unit: "cái",
    category: "Sản phẩm",
    timesUsed: 20,
  },
];

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = mockProducts.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản Lý Sản Phẩm/Dịch Vụ</h1>
            <p className="text-gray-600">Quản lý danh sách sản phẩm và dịch vụ của bạn</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus className="h-4 w-4" />
            Thêm Sản Phẩm
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Sản Phẩm/Dịch Vụ</CardTitle>
            <CardDescription>Tổng cộng {filteredProducts.length} sản phẩm</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Tên Sản Phẩm</th>
                    <th className="text-left py-3 px-4 font-semibold">Mô Tả</th>
                    <th className="text-left py-3 px-4 font-semibold">Danh Mục</th>
                    <th className="text-right py-3 px-4 font-semibold">Giá</th>
                    <th className="text-left py-3 px-4 font-semibold">Đơn Vị</th>
                    <th className="text-center py-3 px-4 font-semibold">Lần Dùng</th>
                    <th className="text-center py-3 px-4 font-semibold">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold">{product.name}</td>
                      <td className="py-3 px-4 text-gray-600">{product.description}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {product.price.toLocaleString()} VND
                      </td>
                      <td className="py-3 px-4">{product.unit}</td>
                      <td className="py-3 px-4 text-center">{product.timesUsed}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-1 hover:bg-gray-200 rounded">
                            <Edit2 className="h-4 w-4 text-blue-600" />
                          </button>
                          <button className="p-1 hover:bg-gray-200 rounded">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Không tìm thấy sản phẩm nào</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
