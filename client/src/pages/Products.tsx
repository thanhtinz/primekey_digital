import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  quantity: number;
  category: string;
}

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Dịch vụ thiết kế web",
    description: "Thiết kế website chuyên nghiệp",
    price: 5000000,
    currency: "VND",
    quantity: 100,
    category: "Dịch vụ",
  },
  {
    id: "2",
    name: "Dịch vụ tư vấn",
    description: "Tư vấn kinh doanh trực tuyến",
    price: 2000000,
    currency: "VND",
    quantity: 50,
    category: "Dịch vụ",
  },
  {
    id: "3",
    name: "Sản phẩm phần mềm",
    description: "Phần mềm quản lý bán hàng",
    price: 10000000,
    currency: "VND",
    quantity: 10,
    category: "Sản phẩm",
  },
  {
    id: "4",
    name: "Premium Support",
    description: "Hỗ trợ kỹ thuật 24/7",
    price: 500,
    currency: "USD",
    quantity: 999,
    category: "Dịch vụ",
  },
];

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>(mockProducts);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = () => {
    toast.success("Mở form thêm sản phẩm/dịch vụ mới!");
  };

  const handleEditProduct = (name: string) => {
    toast.info(`Đang chỉnh sửa sản phẩm: ${name}`);
  };

  const handleDeleteProduct = (name: string) => {
    toast.error(`Xác nhận xóa sản phẩm ${name}?`, {
      action: {
        label: "Xóa",
        onClick: () => {
          toast.loading("Đang xóa...");
          setTimeout(() => {
            setProducts(products.filter((p) => p.name !== name));
            toast.success(`Sản phẩm ${name} đã được xóa thành công!`);
          }, 800);
        },
      },
    });
  };

  const formatCurrency = (value: number, currency: string) => {
    if (currency === "USD") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value);
    }
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
            <h1 className="text-3xl font-bold">Quản Lý Sản Phẩm/Dịch Vụ</h1>
            <p className="text-gray-600">Quản lý danh sách sản phẩm và dịch vụ của bạn</p>
          </div>
          <Button onClick={handleAddProduct} className="gap-2">
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
                placeholder="Tìm kiếm theo tên, mô tả hoặc danh mục..."
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
            <CardDescription>Tổng cộng: {filteredProducts.length} sản phẩm</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Tên Sản Phẩm</th>
                    <th className="text-left py-3 px-4 font-semibold">Mô Tả</th>
                    <th className="text-left py-3 px-4 font-semibold">Danh Mục</th>
                    <th className="text-right py-3 px-4 font-semibold">Giá</th>
                    <th className="text-center py-3 px-4 font-semibold">Số Lượng</th>
                    <th className="text-center py-3 px-4 font-semibold">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{product.name}</td>
                        <td className="py-3 px-4 text-xs text-gray-600">{product.description}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {product.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {formatCurrency(product.price, product.currency)}
                        </td>
                        <td className="py-3 px-4 text-center">{product.quantity}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditProduct(product.name)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteProduct(product.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        Không tìm thấy sản phẩm nào
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
