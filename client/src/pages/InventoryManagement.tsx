"use client";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Package, Plus, Search, RefreshCw, Eye, Trash2, Upload, CheckCircle, Clock, ChevronRight } from "@/components/Icon";

export default function InventoryManagement() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewItem, setViewItem] = useState<any>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [stockInput, setStockInput] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: products = [] } = trpc.products.list.useQuery();
  const warehouseProducts = (products as any[]).filter(p => p.inventoryType === "warehouse");

  const selectedProduct = warehouseProducts.find((p: any) => p.id === selectedProductId);
  const packages = selectedProduct?.packages || [];

  const { data: inventoryData, refetch: refetchInventory } = trpc.inventory.list.useQuery(
    { productId: selectedProductId ?? 0 },
    { enabled: !!selectedProductId && showDetailView }
  );
  const inventoryItems = (inventoryData as any)?.items || [];

  const addItemsMut = trpc.inventory.add.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Đã nhập ${data?.added || 0} sản phẩm vào kho`);
      setStockInput("");
      setShowAddDialog(false);
      refetchInventory();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleAddItems = () => {
    if (!selectedPackageId) { toast.error("Vui lòng chọn gói sản phẩm"); return; }
    const lines = stockInput.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) { toast.error("Vui lòng nhập ít nhất 1 sản phẩm"); return; }
    const pkg = packages.find((p: any) => p.id === selectedPackageId);
    if (!pkg) { toast.error("Gói sản phẩm không tồn tại"); return; }
    addItemsMut.mutate({
      productId: pkg.productId,
      packageId: selectedPackageId,
      items: lines,
    });
  };

  const filteredItems = (inventoryItems as any[]).filter(item => {
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    if (selectedPackageId && item.packageId !== selectedPackageId) return false;
    if (searchTerm && !item.stockData.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const statusBadge = (status: string) => {
    if (status === "available") return <Badge className="bg-green-100 text-green-700 border-green-200">Còn hàng</Badge>;
    if (status === "used") return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Đã dùng</Badge>;
    if (status === "reserved") return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Đang giữ</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const getProductStats = (productId: number) => {
    const { data: stats } = trpc.inventory.list.useQuery(
      { productId },
      { enabled: true }
    );
    const items = (stats as any)?.items || [];
    return {
      total: items.length,
      available: items.filter((i: any) => i.status === "available").length,
      used: items.filter((i: any) => i.status === "used").length,
    };
  };

  const availableCount = (inventoryItems as any[]).filter(i => i.status === "available" && (!selectedPackageId || i.packageId === selectedPackageId)).length;
  const usedCount = (inventoryItems as any[]).filter(i => i.status === "used" && (!selectedPackageId || i.packageId === selectedPackageId)).length;
  const totalCount = (inventoryItems as any[]).filter(i => !selectedPackageId || i.packageId === selectedPackageId).length;

  // Main view: Hiển thị danh sách sản phẩm
  if (!showDetailView) {
    return (
      <DashboardLayoutCustom>
        <div className="p-6 space-y-6">
          <div className="ak-page-header">
            <div>
              <h1 className="ak-page-title">Quản Lý Kho Hàng</h1>
              <p className="ak-page-subtitle">Quản lý sản phẩm kỹ thuật số trong kho</p>
            </div>
          </div>

          {warehouseProducts.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Chưa có sản phẩm kho hàng</p>
                <p className="text-sm mt-1">Tạo sản phẩm và chọn loại "Kho Hàng"</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {warehouseProducts.map((product: any) => {
                const stats = getProductStats(product.id);
                return (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                <Package className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <h3 className="font-semibold text-base truncate">{product.name}</h3>
                              <p className="text-xs text-muted-foreground">{product.packages?.length || 0} gói sản phẩm</p>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="bg-muted/50 rounded-lg p-2 text-center">
                              <p className="text-sm font-semibold">{stats.total}</p>
                              <p className="text-xs text-muted-foreground">Tổng số lượng</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-2 text-center">
                              <p className="text-sm font-semibold text-green-700">{stats.available}</p>
                              <p className="text-xs text-green-600">Còn hàng</p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-2 text-center">
                              <p className="text-sm font-semibold text-red-700">{stats.used}</p>
                              <p className="text-xs text-red-600">Đã bán</p>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                              onClick={() => {
                                setSelectedProductId(product.id);
                                setShowAddDialog(true);
                              }}
                            >
                              <Plus className="w-4 h-4" /> Nhập hàng loạt
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => toast.info("Tính năng sẽ được thêm sớm")}
                            >
                              📊 Nhập từ CSV
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => toast.info("Tính năng sẽ được thêm sớm")}
                            >
                              📄 Nhập từ TXT
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-orange-600 border-orange-200"
                              onClick={() => toast.info("Tính năng sẽ được thêm sớm")}
                            >
                              📤 Xuất kho hàng
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => toast.info("Tính năng sẽ được thêm sớm")}
                            >
                              🔌 API
                            </Button>
                            <Button
                              size="sm"
                              className="gap-1 bg-blue-600 hover:bg-blue-700"
                              onClick={() => {
                                setSelectedProductId(product.id);
                                setShowDetailView(true);
                              }}
                            >
                              Quản lý <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Items Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-green-600" />
                Nhập Hàng Vào Kho
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {packages.length > 0 && (
                <div>
                  <Label className="text-sm">Gói sản phẩm (tùy chọn)</Label>
                  <Select
                    value={selectedPackageId?.toString() || "none"}
                    onValueChange={v => setSelectedPackageId(v === "none" ? null : Number(v))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Không chọn gói" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không chọn gói</SelectItem>
                      {packages.map((pkg: any) => (
                        <SelectItem key={pkg.id} value={String(pkg.id)}>{pkg.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-sm">Nội dung sản phẩm</Label>
                <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">
                  Mỗi dòng là 1 sản phẩm (key, tài khoản, link download, v.v.)
                </p>
                <Textarea
                  rows={8}
                  placeholder={"key1\nkey2\nkey3\n..."}
                  value={stockInput}
                  onChange={e => setStockInput(e.target.value)}
                  className="font-mono text-sm"
                />
                {stockInput && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stockInput.split("\n").filter(l => l.trim()).length} sản phẩm sẽ được nhập
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Hủy</Button>
              <Button
                onClick={handleAddItems}
                disabled={addItemsMut.isPending || !stockInput.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {addItemsMut.isPending ? "Đang nhập..." : "Nhập Hàng"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayoutCustom>
    );
  }

  // Detail view: Hiển thị mục kho của sản phẩm
  return (
    <DashboardLayoutCustom>
      <div className="p-6 space-y-6">
        <div className="ak-page-header">
          <div>
            <button
              onClick={() => setShowDetailView(false)}
              className="text-sm text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-1"
            >
              ← Quay lại
            </button>
            <h1 className="ak-page-title">{selectedProduct?.name}</h1>
            <p className="ak-page-subtitle">Quản lý các mục kho của sản phẩm này</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="gap-1.5 bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4" /> Nhập Hàng
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{totalCount}</p>
              <p className="text-xs text-muted-foreground">Tổng cộng</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{availableCount}</p>
              <p className="text-xs text-muted-foreground">Còn hàng</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-gray-500">{usedCount}</p>
              <p className="text-xs text-muted-foreground">Đã dùng</p>
            </CardContent>
          </Card>
        </div>

        {/* Package filter */}
        {packages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedPackageId(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                !selectedPackageId ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
              }`}
            >
              Tất cả gói
            </button>
            {packages.map((pkg: any) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackageId(pkg.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedPackageId === pkg.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
                }`}
              >
                {pkg.name}
              </button>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Tìm trong kho..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="available">Còn hàng</SelectItem>
              <SelectItem value="used">Đã dùng</SelectItem>
              <SelectItem value="reserved">Đang giữ</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetchInventory()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Items list */}
        <Card>
          <CardContent className="p-0">
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Kho trống</p>
                <Button
                  size="sm"
                  className="mt-3 bg-green-600 hover:bg-green-700"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-1" /> Nhập Hàng
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {filteredItems.map((item: any, idx: number) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <span className="text-xs text-muted-foreground w-6 flex-shrink-0">#{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono truncate">{item.stockData}</p>
                      {item.packageId && (
                        <p className="text-xs text-muted-foreground">
                          {packages.find((p: any) => p.id === item.packageId)?.name || "Gói #" + item.packageId}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {statusBadge(item.status)}
                      {item.status === "used" && item.assignedOrderId && (
                        <span className="text-xs text-muted-foreground">Đơn #{item.assignedOrderId}</span>
                      )}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                          onClick={() => { setViewItem(item); setShowViewDialog(true); }}
                          title="Xem"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-orange-600 hover:bg-orange-50"
                          title="Sửa"
                          onClick={() => toast.info("Tính năng sửa sẽ được thêm sớm")}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-600 hover:bg-red-50"
                          title="Xoá"
                          onClick={() => toast.info("Tính năng xoá sẽ được thêm sớm")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Items Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-600" />
              Nhập Hàng Vào Kho
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {packages.length > 0 && (
              <div>
                <Label className="text-sm">Gói sản phẩm (tùy chọn)</Label>
                <Select
                  value={selectedPackageId?.toString() || "none"}
                  onValueChange={v => setSelectedPackageId(v === "none" ? null : Number(v))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Không chọn gói" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không chọn gói</SelectItem>
                    {packages.map((pkg: any) => (
                      <SelectItem key={pkg.id} value={String(pkg.id)}>{pkg.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-sm">Nội dung sản phẩm</Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">
                Mỗi dòng là 1 sản phẩm (key, tài khoản, link download, v.v.)
              </p>
              <Textarea
                rows={8}
                placeholder={"key1\nkey2\nkey3\n..."}
                value={stockInput}
                onChange={e => setStockInput(e.target.value)}
                className="font-mono text-sm"
              />
              {stockInput && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stockInput.split("\n").filter(l => l.trim()).length} sản phẩm sẽ được nhập
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Hủy</Button>
            <Button
              onClick={handleAddItems}
              disabled={addItemsMut.isPending || !stockInput.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {addItemsMut.isPending ? "Đang nhập..." : "Nhập Hàng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Item Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chi Tiết Sản Phẩm Kho</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Nội dung</Label>
                <div className="mt-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">{viewItem.stockData}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Trạng thái</Label>
                <div className="mt-1">{statusBadge(viewItem.status)}</div>
              </div>
              {viewItem.status === "used" && viewItem.assignedOrderId && (
                <div>
                  <Label className="text-xs text-muted-foreground">Đơn hàng</Label>
                  <p className="mt-1 text-sm">Đơn #{viewItem.assignedOrderId}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayoutCustom>
  );
}
