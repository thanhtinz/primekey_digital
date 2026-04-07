import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, Users, Package } from "lucide-react";
import * as XLSX from "xlsx";

interface ImportRow {
  row: number;
  status: "success" | "error";
  message: string;
  data?: Record<string, string | number>;
}

export default function ImportExcel() {
  const [tab, setTab] = useState("customers");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportRow[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const createCustomer = trpc.customers.create.useMutation();
  const createProduct = trpc.products.create.useMutation();
  const utils = trpc.useUtils();

  const downloadTemplate = (type: "customers" | "products") => {
    const wb = XLSX.utils.book_new();
    if (type === "customers") {
      const ws = XLSX.utils.aoa_to_sheet([
        ["Tên Khách Hàng *", "Email", "Số Điện Thoại", "Địa Chỉ", "Ghi Chú"],
        ["Nguyễn Văn A", "nguyenvana@email.com", "0901234567", "123 Đường ABC, TP.HCM", "Khách VIP"],
        ["Trần Thị B", "tranthib@email.com", "0912345678", "456 Đường XYZ, Hà Nội", ""],
      ]);
      ws["!cols"] = [{ wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 40 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws, "Khách Hàng");
    } else {
      const ws = XLSX.utils.aoa_to_sheet([
        ["Tên Sản Phẩm *", "Mã SKU", "Giá *", "Đơn Vị", "Mô Tả"],
        ["Sản phẩm A", "SKU001", 150000, "cái", "Mô tả sản phẩm A"],
        ["Dịch vụ B", "SRV001", 500000, "lần", "Mô tả dịch vụ B"],
      ]);
      ws["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(wb, ws, "Sản Phẩm");
    }
    XLSX.writeFile(wb, `template-${type}.xlsx`);
    toast.success("Đã tải mẫu Excel");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setResults([]);

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws, { defval: "" });

      const newResults: ImportRow[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          if (tab === "customers") {
            const name = String(row["Tên Khách Hàng *"] || row["Tên Khách Hàng"] || "").trim();
            if (!name) throw new Error("Thiếu tên khách hàng");
            await createCustomer.mutateAsync({
              name,
              email: String(row["Email"] || "").trim() || `import_${Date.now()}_${i}@placeholder.local`,
              phone: String(row["Số Điện Thoại"] || "").trim() || undefined,
              address: String(row["Địa Chỉ"] || "").trim() || undefined,
              taxId: String(row["Ghi Chú"] || "").trim() || undefined,
            });
            newResults.push({ row: i + 2, status: "success", message: `Đã thêm: ${name}` });
          } else {
            const name = String(row["Tên Sản Phẩm *"] || row["Tên Sản Phẩm"] || "").trim();
            if (!name) throw new Error("Thiếu tên sản phẩm");
            await createProduct.mutateAsync({
              name,
              description: String(row["Mô Tả"] || "").trim() || undefined,
            });
            newResults.push({ row: i + 2, status: "success", message: `Đã thêm: ${name}` });
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Lỗi không xác định";
          newResults.push({ row: i + 2, status: "error", message: msg });
        }
      }

      setResults(newResults);
      const successCount = newResults.filter(r => r.status === "success").length;
      toast.success(`Hoàn thành: ${successCount}/${rows.length} dòng thành công`);
      utils.customers.list.invalidate();
      utils.products.list.invalidate();
    } catch {
      toast.error("Lỗi đọc file Excel");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const successCount = results.filter(r => r.status === "success").length;
  const errorCount = results.filter(r => r.status === "error").length;

  return (
    <DashboardLayoutCustom>
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Import Từ Excel</h1>
          <p className="text-muted-foreground text-sm mt-1">Nhập hàng loạt khách hàng hoặc sản phẩm từ file Excel</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="customers"><Users className="w-4 h-4 mr-2" />Khách Hàng</TabsTrigger>
            <TabsTrigger value="products"><Package className="w-4 h-4 mr-2" />Sản Phẩm</TabsTrigger>
          </TabsList>

          {["customers", "products"].map(type => (
            <TabsContent key={type} value={type} className="space-y-4">
              {/* Hướng dẫn */}
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <CardContent className="pt-4 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <p><strong>Bước 1:</strong> Tải file mẫu Excel bên dưới</p>
                  <p><strong>Bước 2:</strong> Điền dữ liệu vào file (các cột có dấu * là bắt buộc)</p>
                  <p><strong>Bước 3:</strong> Upload file đã điền để import</p>
                </CardContent>
              </Card>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Download template */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Tải File Mẫu
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {type === "customers" ? "Mẫu nhập khách hàng với các cột cần thiết" : "Mẫu nhập sản phẩm với các cột cần thiết"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => downloadTemplate(type as "customers" | "products")}
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Tải Mẫu Excel
                    </Button>
                  </CardContent>
                </Card>

                {/* Upload */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload File Excel
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Chỉ hỗ trợ .xlsx và .xls
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleImport}
                      className="hidden"
                      id={`file-${type}`}
                    />
                    <Button
                      className="w-full"
                      disabled={importing}
                      onClick={() => document.getElementById(`file-${type}`)?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {importing ? "Đang import..." : "Chọn File & Import"}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Kết quả */}
              {results.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Kết Quả Import</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          <CheckCircle className="w-3 h-3 mr-1" />{successCount} thành công
                        </Badge>
                        {errorCount > 0 && (
                          <Badge variant="outline" className="text-red-600 border-red-300">
                            <AlertCircle className="w-3 h-3 mr-1" />{errorCount} lỗi
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {results.map((r, i) => (
                        <div key={i} className={`flex items-center gap-2 text-xs p-2 rounded ${r.status === "success" ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400" : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"}`}>
                          {r.status === "success" ? <CheckCircle className="w-3 h-3 flex-shrink-0" /> : <AlertCircle className="w-3 h-3 flex-shrink-0" />}
                          <span className="font-medium">Dòng {r.row}:</span>
                          <span>{r.message}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayoutCustom>
  );
}
