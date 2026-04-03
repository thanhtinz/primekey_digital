import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", price: 0 });

  // Fetch products
  const { data: products = [], isLoading, refetch } = trpc.products.list.useQuery();

  // Mutations
  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Thêm sản phẩm thành công!");
      refetch();
      setFormData({ name: "", description: "", price: 0 });
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Lỗi khi thêm sản phẩm");
    },
  });

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success("Cập nhật sản phẩm thành công!");
      refetch();
      setFormData({ name: "", description: "", price: 0 });
      setEditingId(null);
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Lỗi khi cập nhật sản phẩm");
    },
  });

  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success("Xóa sản phẩm thành công!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Lỗi khi xóa sản phẩm");
    },
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = async () => {
    if (!formData.name || formData.price <= 0) {
      toast.error("Vui lòng nhập tên và giá sản phẩm");
      return;
    }

    if (editingId) {
      await updateProduct.mutateAsync({
        id: editingId,
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price,
      });
    } else {
      await createProduct.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price,
      });
    }
  };

  const handleEdit = (product: typeof products[0]) => {
    setFormData({
      name: product.name,
      description: product.description || "",
      price: typeof product.price === "string" ? parseFloat(product.price) : product.price,
    });
    setEditingId(product.id);
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) {
      deleteProduct.mutate({ id });
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
            <h1 className="text-3xl font-bold">Quản Lý Sản Phẩm</h1>
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
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nhập tên sản phẩm" />
                </div>
                <div>
                  <Label>Mô Tả</Label>
                  <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Nhập mô tả" />
                </div>
                <div>
                  <Label>Giá (VND)</Label>
                  <Input value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} placeholder="Nhập giá" type="number" />
                </div>
                <Button onClick={handleAdd} className="w-full" disabled={createProduct.isPending || updateProduct.isPending}>
                  {createProduct.isPending || updateProduct.isPending ? "Đang lưu..." : "Lưu"}
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
              placeholder="Tìm kiếm sản phẩm..."
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
                <th className="text-left py-3 px-4 font-semibold">Tên Sản Phẩm</th>
                <th className="text-left py-3 px-4 font-semibold">Mô Tả</th>
                <th className="text-left py-3 px-4 font-semibold">Giá (VND)</th>
                <th className="text-left py-3 px-4 font-semibold">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    Không có sản phẩm nào
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{product.name}</td>
                    <td className="py-3 px-4">{product.description}</td>
                    <td className="py-3 px-4">{typeof product.price === "string" ? parseFloat(product.price).toLocaleString("vi-VN") : (product.price as number).toLocaleString("vi-VN")}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button onClick={() => handleEdit(product)} variant="outline" size="sm" className="gap-2">
                          <Edit className="h-4 w-4" />
                          Sửa
                        </Button>
                        <Button onClick={() => handleDelete(product.id)} variant="outline" size="sm" className="gap-2 text-red-600" disabled={deleteProduct.isPending}>
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
