import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Star, Users2, TrendingUp, Loader2 } from "@/components/Icon";

export default function LoyaltyHistory() {
  const { data: pointsList = [], isLoading } = trpc.loyalty.listPoints.useQuery();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return pointsList as any[];
    const q = search.toLowerCase();
    return (pointsList as any[]).filter((p: any) =>
      p.customerEmail?.toLowerCase().includes(q) ||
      (p.customerName || "").toLowerCase().includes(q)
    );
  }, [pointsList, search]);

  const totalPoints = useMemo(() =>
    (pointsList as any[]).reduce((sum: number, p: any) => sum + Number(p.totalPoints || 0), 0),
    [pointsList]
  );

  const totalMembers = (pointsList as any[]).length;

  return (
    <DashboardLayoutCustom>
      <div className="space-y-6">
        <div className="ak-page-header">
          <div>
            <h1 className="ak-page-title">Lịch Sử Tích Điểm</h1>
            <p className="ak-page-subtitle">Xem điểm tích lũy của tất cả khách hàng</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-yellow-600 uppercase tracking-wide">Tổng điểm đang lưu hành</p>
                  <p className="text-2xl font-bold mt-1 text-yellow-600">{totalPoints.toLocaleString("vi-VN")}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Thành viên tích điểm</p>
                  <p className="text-2xl font-bold mt-1">{totalMembers}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Users2 className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo email, tên..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Star className="h-10 w-10 mb-2 opacity-30" />
                <p>Chưa có dữ liệu tích điểm</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="ak-table w-full">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Khách hàng</th>
                      <th>Tổng điểm</th>
                      <th>Đã dùng</th>
                      <th>Còn lại</th>
                      <th>Hạng</th>
                      <th>Cập nhật</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p: any, i: number) => {
                      const total = Number(p.totalPoints || 0);
                      const used = Number(p.usedPoints || 0);
                      const remaining = total - used;
                      const tier = total >= 5000 ? "Vàng" : total >= 2000 ? "Bạc" : "Đồng";
                      const tierColor = total >= 5000 ? "bg-yellow-100 text-yellow-700" : total >= 2000 ? "bg-gray-100 text-gray-700" : "bg-orange-100 text-orange-700";
                      return (
                        <tr key={p.id}>
                          <td className="text-muted-foreground">{i + 1}</td>
                          <td>
                            <div className="font-medium">{p.customerName || "—"}</div>
                            <div className="text-xs text-muted-foreground">{p.customerEmail}</div>
                          </td>
                          <td className="font-semibold text-yellow-600">{total.toLocaleString("vi-VN")}</td>
                          <td className="text-muted-foreground">{used.toLocaleString("vi-VN")}</td>
                          <td className="font-medium text-green-600">{remaining.toLocaleString("vi-VN")}</td>
                          <td><Badge className={`${tierColor} border-0 text-xs`}>{tier}</Badge></td>
                          <td className="text-sm text-muted-foreground">
                            {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("vi-VN") : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayoutCustom>
  );
}
