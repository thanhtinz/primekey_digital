import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Gift, Star, Package, Wallet, CheckCircle, RotateCcw, Gamepad2, Users, ArrowRight, CreditCard, Banknote, Trophy } from "@/components/Icon";
import { ClientHeader } from "@/components/ClientHeader";

// ─── Spin Wheel Canvas Component ─────────────────────────────────────────────
function SpinWheelCanvas({ items, spinning, onSpinEnd, targetIndex }: {
  items: Array<{ label: string; color: string; prizeType: string; prizeValue: string }>;
  spinning: boolean;
  onSpinEnd: () => void;
  targetIndex: number | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  const drawWheel = (rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas || items.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = cx - 10;
    const arc = (2 * Math.PI) / items.length;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    items.forEach((item, i) => {
      const startAngle = rotation + i * arc;
      const endAngle = startAngle + arc;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = item.color || "#4F46E5";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
      // Label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 3;
      ctx.fillText(item.label.length > 12 ? item.label.slice(0, 12) + "…" : item.label, r - 12, 5);
      ctx.restore();
    });
    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 2;
    ctx.stroke();
    // Pointer
    ctx.beginPath();
    ctx.moveTo(cx + r - 5, cy);
    ctx.lineTo(cx + r + 20, cy - 12);
    ctx.lineTo(cx + r + 20, cy + 12);
    ctx.closePath();
    ctx.fillStyle = "#ef4444";
    ctx.fill();
  };

  useEffect(() => {
    drawWheel(rotationRef.current);
  }, [items]);

  useEffect(() => {
    if (!spinning || targetIndex === null || items.length === 0) return;
    const arc = (2 * Math.PI) / items.length;
    // Calculate target rotation so pointer (at 0 angle, right side) points to targetIndex
    const targetAngle = -(targetIndex * arc + arc / 2);
    const fullSpins = 5 * 2 * Math.PI;
    const endRotation = targetAngle - (targetAngle % (2 * Math.PI)) + fullSpins;
    const startRotation = rotationRef.current;
    const duration = 4000;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 4);
      rotationRef.current = startRotation + (endRotation - startRotation) * ease;
      drawWheel(rotationRef.current);
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        rotationRef.current = endRotation % (2 * Math.PI);
        onSpinEnd();
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [spinning, targetIndex]);

  if (items.length === 0) {
    return (
      <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-full border-4 border-dashed border-gray-300">
        <p className="text-gray-400 text-sm text-center px-4">Vòng quay chưa được cấu hình</p>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <canvas ref={canvasRef} width={280} height={280} className="rounded-full shadow-xl" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LoyaltyRewardsPage() {
  const { customer, token } = useCustomerAuth();
  const [activeTab, setActiveTab] = useState("rewards");

  // ── Rewards Tab State ──
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ── Spin Wheel State ──
  const [spinning, setSpinning] = useState(false);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [spinResult, setSpinResult] = useState<any>(null);
  const [spinResultOpen, setSpinResultOpen] = useState(false);

  // ── Referral Withdrawal State ──
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawType, setWithdrawType] = useState<"atm" | "wallet">("wallet");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");

  // ── Queries ──
  const { data: rewards, isLoading: rewardsLoading } = trpc.loyaltyRewards.getPublic.useQuery();
  const { data: pointsData, refetch: refetchPoints } = trpc.customer.myPoints.useQuery(
    { token: token! },
    { enabled: !!token }
  );
  const { data: myRedemptions, refetch: refetchRedemptions } = trpc.loyaltyRewards.myRedemptions.useQuery(
    { token: token! },
    { enabled: !!token }
  );
  const { data: spinConfig } = trpc.spinWheel.getConfig.useQuery();
  const { data: spinHistory, refetch: refetchSpinHistory } = trpc.spinWheel.myHistory.useQuery(
    { token: token! },
    { enabled: !!token }
  );
  const { data: referralStats } = trpc.referral.getStats.useQuery(
    { email: customer?.email || "" },
    { enabled: !!customer?.email }
  );
  const { data: myWithdrawals, refetch: refetchWithdrawals } = trpc.referralWithdrawals.myList.useQuery(
    { token: token! },
    { enabled: !!token }
  );

  // ── Mutations ──
  const redeemMutation = trpc.loyaltyRewards.redeem.useMutation({
    onSuccess: () => {
      toast.success("Đổi thưởng thành công!");
      setConfirmOpen(false);
      refetchRedemptions();
      refetchPoints();
    },
    onError: (err) => toast.error(err.message),
  });

  const spinMutation = trpc.spinWheel.spin.useMutation({
    onSuccess: (data) => {
      // Find winner index from items
      const items = spinConfig?.items || [];
      const idx = items.findIndex((item: any) => item.label === data.winner.label);
      setTargetIndex(idx >= 0 ? idx : 0);
      setSpinResult(data.winner);
    },
    onError: (err) => {
      toast.error(err.message);
      setSpinning(false);
    },
  });

  const withdrawMutation = trpc.referralWithdrawals.create.useMutation({
    onSuccess: (data) => {
      toast.success(data.status === "completed" ? "Đã chuyển vào ví thành công!" : "Yêu cầu rút tiền đã được gửi!");
      setWithdrawOpen(false);
      setWithdrawAmount("");
      setBankName("");
      setBankAccount("");
      setBankHolder("");
      refetchWithdrawals();
    },
    onError: (err) => toast.error(err.message),
  });

  const totalPoints = pointsData?.points || 0;
  const referralBalance = parseFloat(referralStats?.totalRewards?.toString() || "0");

  // ── Helpers ──
  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case "discount_code": return <Package className="w-5 h-5 text-blue-500" />;
      case "wallet_credit": return <Wallet className="w-5 h-5 text-green-500" />;
      case "physical": return <Gift className="w-5 h-5 text-purple-500" />;
      default: return <Star className="w-5 h-5 text-yellow-500" />;
    }
  };
  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case "discount_code": return "Mã giảm giá";
      case "wallet_credit": return "Cộng ví";
      case "physical": return "Quà vật lý";
      default: return "Phần thưởng";
    }
  };
  const getPrizeLabel = (type: string, value: number) => {
    switch (type) {
      case "points": return `+${value.toLocaleString("vi-VN")} điểm`;
      case "wallet_credit": return `+${value.toLocaleString("vi-VN")}₫ vào ví`;
      case "coupon": return "Mã giảm giá";
      case "nothing": return "Chúc may mắn lần sau";
      default: return "Phần thưởng";
    }
  };

  const handleSpin = () => {
    if (!token) { toast.error("Vui lòng đăng nhập"); return; }
    if (spinning) return;
    setSpinning(true);
    setSpinResult(null);
    spinMutation.mutate({ token });
  };

  const handleSpinEnd = () => {
    setSpinning(false);
    setSpinResultOpen(true);
    refetchPoints();
    refetchSpinHistory();
  };

  const handleWithdraw = () => {
    if (!token) return;
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) { toast.error("Vui lòng nhập số tiền hợp lệ"); return; }
    withdrawMutation.mutate({
      token,
      amount,
      withdrawType,
      bankName: withdrawType === "atm" ? bankName : undefined,
      bankAccount: withdrawType === "atm" ? bankAccount : undefined,
      bankHolder: withdrawType === "atm" ? bankHolder : undefined,
    });
  };

  const spinItems = spinConfig?.items || [];
  const spinCfg = spinConfig?.config;

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trung Tâm Phần Thưởng</h1>
          <p className="text-gray-500">Tích điểm, quay thưởng và nhận hoa hồng giới thiệu</p>
          {customer && (
            <div className="mt-4 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-5 py-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-yellow-700 text-lg">{totalPoints.toLocaleString("vi-VN")}</span>
              <span className="text-yellow-600">điểm tích lũy</span>
            </div>
          )}
        </div>

        {!customer ? (
          <div className="text-center py-16">
            <Gift className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">Đăng nhập để truy cập trung tâm phần thưởng</p>
            <Button onClick={() => window.location.href = "/login"}>Đăng nhập ngay</Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="rewards" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Gift className="w-4 h-4" /> Đổi Thưởng
              </TabsTrigger>
              <TabsTrigger value="spin" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <RotateCcw className="w-4 h-4" /> Vòng Quay
              </TabsTrigger>
              <TabsTrigger value="minigame" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Gamepad2 className="w-4 h-4" /> Mini Game
              </TabsTrigger>
              <TabsTrigger value="referral" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Users className="w-4 h-4" /> Giới Thiệu
              </TabsTrigger>
            </TabsList>

            {/* ── Tab: Đổi Thưởng ── */}
            <TabsContent value="rewards">
              {rewardsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-xl" />)}
                </div>
              ) : !rewards || rewards.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Gift className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">Chưa có phần thưởng nào</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rewards.map((reward: any) => {
                      const canRedeem = totalPoints >= reward.pointsCost && (reward.stock === -1 || reward.stock > 0);
                      return (
                        <Card key={reward.id} className={`overflow-hidden transition-all hover:shadow-lg ${!canRedeem ? "opacity-70" : ""}`}>
                          {reward.imageUrl && (
                            <div className="h-40 overflow-hidden">
                              <img src={reward.imageUrl} alt={reward.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-base font-semibold leading-tight">{reward.name}</CardTitle>
                              <Badge variant="outline" className="shrink-0 flex items-center gap-1 text-xs">
                                {getRewardTypeIcon(reward.rewardType)}
                                {getRewardTypeLabel(reward.rewardType)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {reward.description && (
                              <p className="text-sm text-gray-500 line-clamp-2">{reward.description}</p>
                            )}
                            {reward.rewardType === "wallet_credit" && parseFloat(reward.rewardValue || "0") > 0 && (
                              <p className="text-sm font-medium text-green-600">
                                +{parseFloat(reward.rewardValue).toLocaleString("vi-VN")}₫ vào ví
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-bold text-yellow-700">{reward.pointsCost.toLocaleString("vi-VN")} điểm</span>
                              </div>
                              {reward.stock !== -1 && (
                                <span className="text-xs text-gray-400">Còn {reward.stock}</span>
                              )}
                            </div>
                            {reward.stock === 0 ? (
                              <Button disabled className="w-full" variant="outline">Hết hàng</Button>
                            ) : (
                              <Button
                                className="w-full"
                                disabled={!canRedeem || redeemMutation.isPending}
                                onClick={() => { setSelectedReward(reward); setConfirmOpen(true); }}
                                variant={canRedeem ? "default" : "outline"}
                              >
                                {totalPoints < reward.pointsCost
                                  ? `Thiếu ${(reward.pointsCost - totalPoints).toLocaleString("vi-VN")} điểm`
                                  : "Đổi thưởng"}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Redemption History */}
                  {myRedemptions && myRedemptions.length > 0 && (
                    <div className="mt-10">
                      <h2 className="text-xl font-bold mb-4">Lịch Sử Đổi Thưởng</h2>
                      <div className="space-y-3">
                        {myRedemptions.map((item: any) => (
                          <div key={item.redemption?.id || Math.random()} className="flex items-center justify-between bg-white rounded-lg p-4 border">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                              <div>
                                <p className="font-medium">{item.rewardName || "Phần thưởng"}</p>
                                <p className="text-sm text-gray-400">
                                  {item.redemption?.createdAt ? new Date(item.redemption.createdAt).toLocaleDateString("vi-VN") : ""}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-red-500">-{item.redemption?.pointsUsed || 0} điểm</p>
                              <Badge variant={item.redemption?.status === "fulfilled" ? "default" : item.redemption?.status === "cancelled" ? "destructive" : "secondary"} className="text-xs">
                                {item.redemption?.status === "fulfilled" ? "Hoàn thành" : item.redemption?.status === "cancelled" ? "Đã hủy" : "Đang xử lý"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* ── Tab: Vòng Quay ── */}
            <TabsContent value="spin">
              <div className="flex flex-col items-center gap-8">
                {!spinCfg?.isEnabled ? (
                  <div className="text-center py-16 text-gray-400">
                    <RotateCcw className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">Vòng quay chưa được bật</p>
                    <p className="text-sm mt-2">Admin chưa kích hoạt tính năng này</p>
                  </div>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          {spinCfg.pointsPerSpin ?? 0} điểm/lượt
                        </span>
                        <span>•</span>
                        <span>{spinCfg.spinsPerDay ?? 1} lượt/ngày</span>
                      </div>
                    </div>

                    <SpinWheelCanvas
                      items={spinItems.map((item: any) => ({
                        label: item.label,
                        color: item.color || "#4F46E5",
                        prizeType: item.prizeType,
                        prizeValue: item.prizeValue,
                      }))}
                      spinning={spinning}
                      onSpinEnd={handleSpinEnd}
                      targetIndex={targetIndex}
                    />

                    <Button
                      size="lg"
                      className="px-10 py-6 text-lg font-bold rounded-full shadow-lg"
                      onClick={handleSpin}
                      disabled={spinning || spinMutation.isPending}
                    >
                      {spinning ? (
                        <><RotateCcw className="w-5 h-5 mr-2 animate-spin" /> Đang quay...</>
                      ) : (
                        <><RotateCcw className="w-5 h-5 mr-2" /> Quay Ngay</>
                      )}
                    </Button>

                    {/* Spin History */}
                    {spinHistory && spinHistory.length > 0 && (
                      <div className="w-full max-w-lg">
                        <h3 className="font-bold text-lg mb-3">Lịch Sử Quay</h3>
                        <div className="space-y-2">
                          {spinHistory.slice(0, 10).map((h: any) => (
                            <div key={h.id} className="flex items-center justify-between bg-white rounded-lg p-3 border text-sm">
                              <span className="text-gray-500">{new Date(h.createdAt).toLocaleString("vi-VN")}</span>
                              <span className="font-medium text-green-600">{getPrizeLabel(h.prizeType || "", parseFloat(h.prizeValue?.toString() || "0"))}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            {/* ── Tab: Mini Game ── */}
            <TabsContent value="minigame">
              <div className="text-center py-16 text-gray-400">
                <Gamepad2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Mini Game sắp ra mắt!</p>
                <p className="text-sm mt-2">Tính năng này đang được phát triển. Hãy quay lại sau nhé.</p>
              </div>
            </TabsContent>

            {/* ── Tab: Giới Thiệu & Rút Thưởng ── */}
            <TabsContent value="referral">
              <div className="space-y-6">
                {/* Referral Balance Card */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">Hoa hồng tích lũy</p>
                        <p className="text-3xl font-bold text-green-700 mt-1">
                          {referralBalance.toLocaleString("vi-VN")}₫
                        </p>
                        <p className="text-sm text-green-500 mt-1">
                          Tổng {referralStats?.totalReferrals || 0} người đã giới thiệu
                        </p>
                      </div>
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <Button
                      className="mt-4 w-full bg-green-600 hover:bg-green-700"
                      onClick={() => setWithdrawOpen(true)}
                      disabled={referralBalance <= 0}
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Rút Thưởng
                    </Button>
                  </CardContent>
                </Card>

                {/* Withdrawal Options Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="border-2 border-blue-100">
                    <CardContent className="pt-5 flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <Wallet className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold">Về Số Dư Ví</p>
                        <p className="text-sm text-gray-500 mt-1">Chuyển ngay vào ví, dùng để mua hàng. Xử lý tức thì.</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-purple-100">
                    <CardContent className="pt-5 flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                        <Banknote className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold">Về Tài Khoản ATM</p>
                        <p className="text-sm text-gray-500 mt-1">Chuyển khoản ngân hàng. Xử lý trong 1-3 ngày làm việc.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Withdrawal History */}
                {myWithdrawals && myWithdrawals.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-3">Lịch Sử Rút Thưởng</h3>
                    <div className="space-y-3">
                      {myWithdrawals.map((w: any) => (
                        <div key={w.id} className="flex items-center justify-between bg-white rounded-lg p-4 border">
                          <div className="flex items-center gap-3">
                            {w.withdrawType === "wallet" ? (
                              <Wallet className="w-5 h-5 text-blue-500 shrink-0" />
                            ) : (
                              <Banknote className="w-5 h-5 text-purple-500 shrink-0" />
                            )}
                            <div>
                              <p className="font-medium">{w.withdrawType === "wallet" ? "Về ví" : `ATM: ${w.bankName || ""}`}</p>
                              <p className="text-sm text-gray-400">{new Date(w.createdAt).toLocaleDateString("vi-VN")}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{parseFloat(w.amount).toLocaleString("vi-VN")}₫</p>
                            <Badge variant={w.status === "completed" ? "default" : w.status === "rejected" ? "destructive" : "secondary"} className="text-xs">
                              {w.status === "completed" ? "Hoàn thành" : w.status === "rejected" ? "Từ chối" : "Đang xử lý"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* ── Confirm Redeem Dialog ── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận đổi thưởng</DialogTitle>
          </DialogHeader>
          {selectedReward && (
            <div className="space-y-3">
              <p>Bạn muốn đổi <strong>{selectedReward.name}</strong>?</p>
              <div className="bg-yellow-50 rounded-lg p-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span>Sẽ trừ <strong>{selectedReward.pointsCost.toLocaleString("vi-VN")} điểm</strong> từ tài khoản của bạn</span>
              </div>
              <p className="text-sm text-gray-500">Sau khi đổi: còn {(totalPoints - selectedReward.pointsCost).toLocaleString("vi-VN")} điểm</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Hủy</Button>
            <Button
              onClick={() => selectedReward && token && redeemMutation.mutate({ token, rewardId: selectedReward.id })}
              disabled={redeemMutation.isPending}
            >
              {redeemMutation.isPending ? "Đang xử lý..." : "Xác nhận đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Spin Result Dialog ── */}
      <Dialog open={spinResultOpen} onOpenChange={setSpinResultOpen}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl">🎉 Chúc mừng!</DialogTitle>
          </DialogHeader>
          {spinResult && (
            <div className="py-4 space-y-3">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                <Trophy className="w-10 h-10 text-yellow-500" />
              </div>
              <p className="text-xl font-bold text-gray-800">{spinResult.label}</p>
              <p className="text-lg text-green-600 font-semibold">
                {getPrizeLabel(spinResult.prizeType, spinResult.prizeValue)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button className="w-full" onClick={() => setSpinResultOpen(false)}>Tuyệt vời!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Withdraw Dialog ── */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rút Thưởng Giới Thiệu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-green-50 rounded-lg p-3 text-sm text-green-700">
              Số dư hoa hồng: <strong>{referralBalance.toLocaleString("vi-VN")}₫</strong>
            </div>

            <div className="space-y-2">
              <Label>Hình thức rút</Label>
              <Select value={withdrawType} onValueChange={(v) => setWithdrawType(v as "atm" | "wallet")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wallet">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-blue-500" /> Về số dư ví (tức thì)
                    </div>
                  </SelectItem>
                  <SelectItem value="atm">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-purple-500" /> Về tài khoản ATM (1-3 ngày)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Số tiền muốn rút (₫)</Label>
              <Input
                type="number"
                placeholder="Nhập số tiền..."
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="1"
                max={referralBalance}
              />
            </div>

            {withdrawType === "atm" && (
              <>
                <div className="space-y-2">
                  <Label>Tên ngân hàng</Label>
                  <Input placeholder="VD: Vietcombank, BIDV..." value={bankName} onChange={(e) => setBankName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Số tài khoản</Label>
                  <Input placeholder="Nhập số tài khoản..." value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Chủ tài khoản</Label>
                  <Input placeholder="Tên chủ tài khoản..." value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>Hủy</Button>
            <Button onClick={handleWithdraw} disabled={withdrawMutation.isPending || !withdrawAmount}>
              {withdrawMutation.isPending ? "Đang xử lý..." : "Xác nhận rút"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
