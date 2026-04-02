import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";

const mockProducts = [
  { id: 1, name: "Dịch vụ tư vấn", description: "Tư vấn kinh doanh", price: 500000 },
  { id: 2, name: "Thiết kế website", description: "Thiết kế website chuyên nghiệp", price: 5000000 },
  { id: 3, name: "Phát triển ứng dụng", description: "Phát triển ứng dụng mobile/web", price: 10000000 },
];

export default function Products() {
  const [products, setProducts] = useState(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", price: 0 });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    if (!formData.name || formData.price <= 0) {
      toast.error("Vui lòng nhập tên và giá sản phẩm");
      return;
    }
    if (editingId) {
      setProducts(products.map(p => p.id === editingId ? { ...p, ...formData } : p));
      toast.success("Cập nhật sản phẩm thành công!");
    } else {
      setProducts([...products, { id: Date.now(), ...formData }]);
      toast.success("Thêm sản phẩm thành công!");
    }
    setFormData({ name: "", description: "", price: 0 });
    setEditingId(null);
    setIsOpen(false);
  };

  const handleEdit = (product: typeof mockProducts[0]) => {
    setFormData(product);
    setEditingId(product.id);
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) {
      setProducts(products.filter(p => p.id !== id));
      toast.success("Xóa sản phẩm thành công!");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Quản Lý Sản Phẩm/Dịch Vụ</h1>
            <p className="text-gray-600">Danh sách tất cả sản phẩm và dịch vụ</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setFormData({ name: "", description: "", price: 0 }); setEditingId(null); }} className="gap-2">
                <Plus className="h-4 w-4" />
                Thêm Sản Phẩm
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Sửa Sản Phẩm" : "Thêm Sản Phẩm"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tên Sản Phẩm</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nhập tên" />
                </div>
                <div>
                  <Label>Mô Tả</Label>
                  <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Nhập mô tả" />
                </div>
                <div>
                  <Label>Giá (VND)</Label>
                  <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })} placeholder="Nhập giá" />
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
            <Input placeholder="Tìm kiếm sản phẩm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Tên Sản Phẩm</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Mô Tả</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Giá</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3">{product.name}</td>
                  <td className="px-6 py-3 text-gray-600">{product.description}</td>
                  <td className="px-6 py-3">{product.price.toLocaleString()} VND</td>
                  <td className="px-6 py-3 text-right flex gap-2 justify-end">
                    <Button onClick={() => handleEdit(product)} variant="outline" size="sm" className="gap-2">
                      <Edit className="h-4 w-4" />
                      Sửa
                    </Button>
                    <Button onClick={() => handleDelete(product.id)} variant="outline" size="sm" className="gap-2 text-red-600">
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
