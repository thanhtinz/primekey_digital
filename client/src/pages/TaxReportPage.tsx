import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, TrendingUp, DollarSign, BarChart3, Download, Calendar } from "lucide-react";

const MONTHS = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
const QUARTERS = ["Quý 1 (T1-T3)","Quý 2 (T4-T6)","Quý 3 (T7-T9)","Quý 4 (T10-T12)"];

export default function TaxReportPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [mode, setMode] = useState<"year" | "quarter" | "month">("year");
  const [quarter, setQuarter] = useState(1);
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const { data: report, isLoading } = trpc.taxReport.get.useQuery({
    year,
    quarter: mode === "quarter" ? quarter : undefined,
    month: mode === "month" ? month : undefined,
  });

  const summary = (report as any)?.summary;
  const rows = (report as any)?.rows || [];
  const byMonth = (report as any)?.byMonth || {};

  function formatVND(n: number) { return n.toLocaleString("vi-VN") + "đ"; }

  return (
    <DashboardLayoutCustom>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-cyan-400" />
              Báo Cáo Thuế
            </h1>
            <p className="text-slate-400 text-sm mt-1">Tổng hợp doanh thu và thuế theo kỳ</p>
          </div>
          <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-2">
            <Download className="w-4 h-4" /> Xuất Excel
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 text-sm">Kỳ báo cáo:</span>
          </div>
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-28 bg-slate-900 border-slate-600 text-white h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              {[currentYear, currentYear-1, currentYear-2].map(y => <SelectItem key={y} value={String(y)} className="text-white">{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={mode} onValueChange={v => setMode(v as any)}>
            <SelectTrigger className="w-32 bg-slate-900 border-slate-600 text-white h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="year" className="text-white">Cả năm</SelectItem>
              <SelectItem value="quarter" className="text-white">Theo quý</SelectItem>
              <SelectItem value="month" className="text-white">Theo tháng</SelectItem>
            </SelectContent>
          </Select>
          {mode === "quarter" && (
            <Select value={String(quarter)} onValueChange={v => setQuarter(Number(v))}>
              <SelectTrigger className="w-44 bg-slate-900 border-slate-600 text-white h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {QUARTERS.map((q, i) => <SelectItem key={i+1} value={String(i+1)} className="text-white">{q}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {mode === "month" && (
            <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
              <SelectTrigger className="w-32 bg-slate-900 border-slate-600 text-white h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {MONTHS.map((m, i) => <SelectItem key={i+1} value={String(i+1)} className="text-white">{m}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Đang tải báo cáo...</div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Tổng doanh thu", value: formatVND(Number(summary?.totalRevenue || 0)), icon: TrendingUp, color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400" },
                { label: "Tổng thuế", value: formatVND(Number(summary?.totalTax || 0)), icon: DollarSign, color: "from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400" },
                { label: "Doanh thu chưa thuế", value: formatVND(Number(summary?.totalRevenue || 0) - Number(summary?.totalTax || 0)), icon: BarChart3, color: "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400" },
                { label: "Số hóa đơn", value: summary?.totalCount || 0, icon: FileText, color: "from-green-500/20 to-green-600/10 border-green-500/30 text-green-400" },
              ].map(s => {
                const Icon = s.icon;
                const [gradientColor] = s.color.split(" ");
                return (
                  <div key={s.label} className={`bg-gradient-to-br ${s.color} border rounded-xl p-4`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4" />
                      <p className="text-slate-400 text-xs">{s.label}</p>
                    </div>
                    <p className="text-white font-bold text-lg truncate">{s.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Monthly breakdown */}
            {Object.keys(byMonth).length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700">
                  <h2 className="text-white font-semibold text-sm">Chi Tiết Theo Tháng</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left text-slate-400 font-medium px-4 py-2">Tháng</th>
                        <th className="text-right text-slate-400 font-medium px-4 py-2">Doanh thu</th>
                        <th className="text-right text-slate-400 font-medium px-4 py-2">Thuế</th>
                        <th className="text-right text-slate-400 font-medium px-4 py-2">Số HĐ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(byMonth).sort().map(([key, data]: [string, any]) => (
                        <tr key={key} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                          <td className="px-4 py-2 text-slate-300">{key}</td>
                          <td className="px-4 py-2 text-right text-white font-medium">{formatVND(data.revenue)}</td>
                          <td className="px-4 py-2 text-right text-orange-400">{formatVND(data.tax)}</td>
                          <td className="px-4 py-2 text-right text-slate-400">{data.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Invoice list */}
            {rows.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700">
                  <h2 className="text-white font-semibold text-sm">Danh Sách Hóa Đơn ({rows.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left text-slate-400 font-medium px-4 py-2">Mã HĐ</th>
                        <th className="text-left text-slate-400 font-medium px-4 py-2">Khách hàng</th>
                        <th className="text-right text-slate-400 font-medium px-4 py-2">Tổng tiền</th>
                        <th className="text-right text-slate-400 font-medium px-4 py-2">Thuế</th>
                        <th className="text-left text-slate-400 font-medium px-4 py-2">Ngày</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row: any) => (
                        <tr key={row.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                          <td className="px-4 py-2 text-blue-400 font-mono text-xs">{row.invoiceNumber}</td>
                          <td className="px-4 py-2 text-slate-300 truncate max-w-[150px]">{row.customerName || row.customerEmail}</td>
                          <td className="px-4 py-2 text-right text-white">{formatVND(Number(row.totalAmount || 0))}</td>
                          <td className="px-4 py-2 text-right text-orange-400">{formatVND(Number(row.taxAmount || 0))}</td>
                          <td className="px-4 py-2 text-slate-400 text-xs">{new Date(row.createdAt).toLocaleDateString("vi-VN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {rows.length === 0 && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Không có dữ liệu cho kỳ này</p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayoutCustom>
  );
}
