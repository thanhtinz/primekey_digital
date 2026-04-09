import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Star, RotateCcw, Trophy, History } from "@/components/Icon";
import { ClientHeader } from "@/components/ClientHeader";

export default function SpinWheelPage() {
  const { customer, token } = useCustomerAuth();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: wheelData, isLoading } = trpc.spinWheel.getConfig.useQuery();
  const { data: pointsData } = trpc.customer.myPoints.useQuery(
    { token: token! },
    { enabled: !!token }
  );
  const { data: history, refetch: refetchHistory } = trpc.spinWheel.myHistory.useQuery(
    { token: token! },
    { enabled: !!token }
  );

  const spinMutation = trpc.spinWheel.spin.useMutation({
    onSuccess: (data) => {
      const w = data.winner;
      toast.success(`🎉 Bạn trúng: ${w.label}!`);
      if (w.prizeType === "points" && w.prizeValue > 0) toast.info(`+${w.prizeValue} điểm đã được cộng vào tài khoản`);
      else if (w.prizeType === "wallet_credit" && w.prizeValue > 0) toast.info(`+${Number(w.prizeValue).toLocaleString("vi-VN")}₫ đã được cộng vào ví`);
      setWinner(w);
      refetchHistory();
    },
    onError: (err) => {
      toast.error(err.message);
      setIsSpinning(false);
    },
  });

  const items = wheelData?.items?.filter((i: any) => i.isActive) || [];
  const config = wheelData?.config;
  const totalPoints = pointsData?.points || 0;
  const pointsPerSpin = config?.pointsPerSpin ?? 0;
  const spinsPerDay = config?.spinsPerDay ?? 1;

  // Draw wheel on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || items.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;
    const arc = (2 * Math.PI) / items.length;

    ctx.clearRect(0, 0, size, size);

    items.forEach((item: any, i: number) => {
      const startAngle = i * arc;
      const endAngle = (i + 1) * arc;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = item.color || (i % 2 === 0 ? "#4F46E5" : "#7C3AED");
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.min(14, 120 / items.length)}px sans-serif`;
      ctx.fillText(item.label, radius - 10, 5);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(center, center, 20, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [items]);

  const handleSpin = () => {
    if (!customer || !token) { toast.error("Vui lòng đăng nhập"); return; }
    if (isSpinning) return;
    setIsSpinning(true);
    setWinner(null);

    const spinAmount = 1440 + Math.random() * 720;
    const newRotation = rotation + spinAmount;
    setRotation(newRotation);

    spinMutation.mutate({ token });

    setTimeout(() => {
      setIsSpinning(false);
    }, 3500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!config?.isEnabled) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientHeader />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <RotateCcw className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-700 mb-2">Vòng Quay Chưa Mở</h1>
          <p className="text-gray-400">Vòng quay may mắn hiện chưa được kích hoạt. Hãy quay lại sau!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <ClientHeader />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎡 Vòng Quay May Mắn</h1>
          <p className="text-gray-500">Quay để nhận phần thưởng hấp dẫn!</p>
          {pointsPerSpin > 0 && (
            <p className="text-sm text-purple-600 mt-1">Mỗi lượt quay tốn <strong>{pointsPerSpin} điểm</strong></p>
          )}
          {customer && (
            <div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-yellow-700">{totalPoints.toLocaleString("vi-VN")} điểm</span>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
          {/* Wheel */}
          <div className="relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[24px] border-l-transparent border-r-transparent border-b-red-500" />
            <div
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? "transform 3.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
              }}
            >
              {items.length > 0 ? (
                <canvas ref={canvasRef} width={300} height={300} className="rounded-full shadow-2xl" />
              ) : (
                <div className="w-72 h-72 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                  Chưa có ô nào
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4 text-center lg:text-left">
            {winner && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="font-bold text-green-700 text-lg">🎉 {winner.label}</p>
                {winner.prizeType === "points" && winner.prizeValue > 0 && (
                  <p className="text-sm text-green-600">+{winner.prizeValue} điểm</p>
                )}
                {winner.prizeType === "wallet_credit" && winner.prizeValue > 0 && (
                  <p className="text-sm text-green-600">+{Number(winner.prizeValue).toLocaleString("vi-VN")}₫ vào ví</p>
                )}
              </div>
            )}

            <Button
              size="lg"
              className="w-full lg:w-auto px-10 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              onClick={handleSpin}
              disabled={isSpinning || !customer || items.length === 0 || (pointsPerSpin > 0 && totalPoints < pointsPerSpin)}
            >
              {isSpinning ? "Đang quay..." : "🎡 Quay ngay!"}
            </Button>

            {!customer && (
              <p className="text-sm text-gray-500">
                <a href="/login" className="text-purple-600 underline">Đăng nhập</a> để tham gia
              </p>
            )}
            {customer && pointsPerSpin > 0 && totalPoints < pointsPerSpin && (
              <p className="text-sm text-red-500">Thiếu {pointsPerSpin - totalPoints} điểm để quay</p>
            )}
            <p className="text-xs text-gray-400">Tối đa {spinsPerDay} lượt/ngày</p>

            {/* Prizes list */}
            <div className="mt-4">
              <h3 className="font-semibold mb-2 text-sm text-gray-600">Các phần thưởng:</h3>
              <div className="space-y-1">
                {items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color || "#4F46E5" }} />
                    <span>{item.label}</span>
                    <span className="text-gray-400 text-xs">({item.probability}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* History */}
        {customer && history && history.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <History className="w-5 h-5" /> Lịch Sử Quay
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {history.slice(0, 10).map((h: any) => (
                <div key={h.id} className="flex items-center justify-between bg-white rounded-lg p-3 border text-sm">
                  <div>
                    <p className="font-medium">
                      {h.prizeType === "nothing"
                        ? "Chúc bạn may mắn lần sau"
                        : h.prizeType === "points"
                          ? `+${h.prizeValue} điểm`
                          : `+${Number(h.prizeValue).toLocaleString("vi-VN")}₫`}
                    </p>
                    <p className="text-gray-400 text-xs">{new Date(h.createdAt).toLocaleString("vi-VN")}</p>
                  </div>
                  {h.pointsUsed > 0 && <span className="text-red-400 text-xs">-{h.pointsUsed} điểm</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
