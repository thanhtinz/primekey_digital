import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    currency: "VND",
    quantity: "",
    category: "Dịch vụ",
  });

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      currency: "VND",
      quantity: "",
      category: "Dịch vụ",
    });
    setIsOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      currency: product.currency,
      quantity: product.quantity.toString(),
      category: product.category,
    });
    setIsOpen(true);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    toast.error(`Xác nhận xóa sản phẩm ${name}?`, {
      action: {
        label: "Xóa",
        onClick: () => {
          toast.loading("Đang xóa...");
          setTimeout(() => {
            setProducts(products.filter((p) => p.id !== id));
            toast.success(`Sản phẩm ${name} đã được xóa thành công!`);
          }, 800);
        },
      },
    });
  };

  const handleSaveProduct = () => {
    if (!formData.name || !formData.price || !formData.quantity) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (editingProduct) {
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                currency: formData.currency,
                quantity: parseInt(formData.quantity),
                category: formData.category,
              }
            : p
        )
      );
      toast.success("Cập nhật sản phẩm thành công!");
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        currency: formData.currency,
        quantity: parseInt(formData.quantity),
        category: formData.category,
      };
      setProducts([...products, newProduct]);
      toast.success("Thêm sản phẩm thành công!");
    }
    setIsOpen(false);
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === "VND") {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(price);
    } else {
      return `$${price.toFixed(2)}`;
    }
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
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Sản Phẩm</CardTitle>
            <CardDescription>{filteredProducts.length} sản phẩm</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Tên</th>
                    <th className="text-left py-3 px-4 font-semibold">Mô Tả</th>
                    <th className="text-left py-3 px-4 font-semibold">Giá</th>
                    <th className="text-left py-3 px-4 font-semibold">Số Lượng</th>
                    <th className="text-left py-3 px-4 font-semibold">Loại</th>
                    <th className="text-left py-3 px-4 font-semibold">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold">{product.name}</td>
                      <td className="py-3 px-4 text-sm">{product.description}</td>
                      <td className="py-3 px-4">{formatPrice(product.price, product.currency)}</td>
                      <td className="py-3 px-4">{product.quantity}</td>
                      <td className="py-3 px-4">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                            className="gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Sửa
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id, product.name)}
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
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Chỉnh Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? "Cập nhật thông tin sản phẩm"
                  : "Nhập thông tin sản phẩm mới"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Tên Sản Phẩm</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên sản phẩm"
                />
              </div>
              <div>
                <Label htmlFor="description">Mô Tả</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nhập mô tả sản phẩm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Giá</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Nhập giá"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Tiền Tệ</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VND">VND</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Số Lượng</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="Nhập số lượng"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Loại</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dịch vụ">Dịch vụ</SelectItem>
                      <SelectItem value="Sản phẩm">Sản phẩm</SelectItem>
                      <SelectItem value="Khác">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSaveProduct}>
                  {editingProduct ? "Cập Nhật" : "Thêm"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
