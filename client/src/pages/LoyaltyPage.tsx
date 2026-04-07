import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Star, Search, Gift, TrendingUp, History, ShoppingBag } from "lucide-react";
import { ClientHeader } from "@/components/ClientHeader";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export default function LoyaltyPage() {
  const { customer, isLoggedIn } = useCustomerAuth();
  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery();
  const [email, setEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const { data: loyaltyData, isLoading, refetch } = trpc.loyalty.getByEmail.useQuery(
    { email: searchEmail },
    { enabled: !!searchEmail }
  );

  // Tự điền email từ session khi đã đăng nhập
  useEffect(() => {
    if (isLoggedIn && customer?.email && !searchEmail) {
      setEmail(customer.email);
      setSearchEmail(customer.email);
    }
  }, [isLoggedIn, customer?.email]);

  const logo = publicInfo?.logoUrl;
  const siteName = publicInfo?.companyName || "Invoice Prime";

  function handleSearch() {
    if (!email.trim() || !email.includes("@")) return;
    setSearchEmail(email.trim());
  }

  const points = loyaltyData?.points || 0;
  const history = loyaltyData?.history || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <ClientHeader maxWidth="max-w-4xl" rightSlot={<Link href="/track" className="text-slate-400 hover:text-white text-xs transition-colors">Tra cứu đơn</Link>} />

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Star className="w-10 h-10 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Điểm Thành Viên</h1>
          <p className="text-slate-400">Nhập email để xem điểm tích lũy và lịch sử giao dịch</p>
        </div>

        {/* Search */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-6">
          <div className="flex gap-3">
            <Input
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Nhập email của bạn..."
              className="bg-slate-900/60 border-slate-600 text-white placeholder:text-slate-500 focus:border-yellow-500"
            />
            <Button onClick={handleSearch} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold gap-2 flex-shrink-0">
              <Search className="w-4 h-4" /> Tra Cứu
            </Button>
          </div>
        </div>

        {/* Results */}
        {isLoading && <div className="text-center py-8 text-slate-400">Đang tra cứu...</div>}

        {loyaltyData && (
          <div className="space-y-4">
            {/* Points card */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Tổng điểm tích lũy</p>
                  <p className="text-4xl font-bold text-yellow-400 mt-1">{points.toLocaleString()}</p>
                  <p className="text-slate-400 text-sm mt-1">điểm</p>
                </div>
                <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
                  <Star className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
              {points > 0 && (
                <div className="mt-4 pt-4 border-t border-yellow-500/20">
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <Gift className="w-4 h-4" />
                    <span>Điểm có thể đổi thưởng tại cửa hàng</span>
                  </div>
                </div>
              )}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  <h3 className="text-white font-semibold">Lịch Sử Giao Dịch</h3>
                </div>
                <div className="divide-y divide-slate-700">
                  {history.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-white text-sm">{item.reason === "EARNED_ORDER" ? "Tích điểm từ đơn hàng" : item.reason === "REDEEMED" ? "Đổi điểm" : item.reason}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</p>
                      </div>
                      <span className={`font-bold text-sm ${item.points > 0 ? "text-green-400" : "text-red-400"}`}>
                        {item.points > 0 ? "+" : ""}{item.points}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {history.length === 0 && points === 0 && (
              <div className="text-center py-8 bg-slate-800/30 border border-dashed border-slate-700 rounded-xl">
                <Star className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400">Chưa có điểm tích lũy cho email này</p>
                <p className="text-slate-500 text-sm mt-1">Mua hàng để bắt đầu tích điểm!</p>
              </div>
            )}
          </div>
        )}

        {/* How it works */}
        {!loyaltyData && !isLoading && (
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { icon: ShoppingBag, title: "Mua hàng", desc: "Mỗi đơn hàng thanh toán thành công sẽ tích điểm tự động" },
              { icon: TrendingUp, title: "Tích lũy", desc: "Điểm được cộng dồn theo từng giao dịch" },
              { icon: Gift, title: "Đổi thưởng", desc: "Dùng điểm để được giảm giá cho đơn hàng tiếp theo" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 text-center">
                <Icon className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-white text-sm font-medium">{title}</p>
                <p className="text-slate-500 text-xs mt-1">{desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


