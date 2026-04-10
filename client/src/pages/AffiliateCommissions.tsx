import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Users2, Gift, Loader2 } from "@/components/Icon";

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AffiliateCommissions() {
  const { data: referrals = [], isLoading } = trpc.referral.adminList.useQuery();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return referrals as any[];
    const q = search.toLowerCase();
    return (referrals as any[]).filter((r: any) =>
      r.referrerEmail?.toLowerCase().includes(q) ||
      r.refereeEmail?.toLowerCase().includes(q) ||
      r.referralCode?.toLowerCase().includes(q)
    );
  }, [referrals, search]);

  const totalRewards = useMemo(() =>
    (referrals as any[]).reduce((sum: number, r: any) => sum + parseFloat(r.rewardAmount || "0"), 0),
    [referrals]
  );

  return (
    <DashboardLayoutCustom>
      <div className="space-y-6">
        <div className="ak-page-header">
          <div>
            <h1 className="ak-page-title">Nhật Ký Hoa Hồng</h1>
            <p className="ak-page-subtitle">Lịch sử hoa hồng từ chương trình giới thiệu</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Tổng giới thiệu</p>
                  <p className="text-2xl font-bold mt-1">{(referrals as any[]).length}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Users2 className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Tổng hoa hồng</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{totalRewards.toLocaleString("vi-VN")} ₫</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Đã thanh toán</p>
                  <p className="text-2xl font-bold mt-1">{(referrals as any[]).filter((r: any) => r.status === "paid").length}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo email, mã giới thiệu..."
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
                <TrendingUp className="h-10 w-10 mb-2 opacity-30" />
                <p>Chưa có nhật ký hoa hồng nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="ak-table w-full">
                  <thead>
                    <tr>
                      <th>Người giới thiệu</th>
                      <th>Người được giới thiệu</th>
                      <th>Mã giới thiệu</th>
                      <th>Hoa hồng</th>
                      <th>Trạng thái</th>
                      <th>Ngày</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r: any) => (
                      <tr key={r.id}>
                        <td className="font-medium">{r.referrerEmail || "—"}</td>
                        <td className="text-muted-foreground">{r.refereeEmail || "—"}</td>
                        <td>
                          <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">{r.referralCode || "—"}</span>
                        </td>
                        <td className="font-semibold text-green-600">
                          {r.rewardAmount ? `${parseFloat(r.rewardAmount).toLocaleString("vi-VN")} ₫` : "—"}
                        </td>
                        <td>
                          {r.status === "paid" ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">Đã trả</Badge>
                          ) : r.status === "pending" ? (
                            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Chờ xử lý</Badge>
                          ) : (
                            <Badge variant="secondary">{r.status || "Mới"}</Badge>
                          )}
                        </td>
                        <td className="text-muted-foreground text-sm">{formatDate(r.createdAt)}</td>
                      </tr>
                    ))}
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
