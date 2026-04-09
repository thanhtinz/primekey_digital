/**
 * SupportWidget - Widget hỗ trợ nổi (floating) cho tất cả trang client
 * Hiển thị ở góc dưới phải, click để mở form gửi ticket nhanh
 */
import { useState } from "react";
import { MessageCircle, X, Send, CheckCircle, ChevronRight } from "@/components/Icon";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

export function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ email: "", subject: "", message: "" });
  const [, navigate] = useLocation();

  const token = typeof window !== "undefined" ? localStorage.getItem("customerToken") || "" : "";
  const isLoggedIn = !!token;

  const { data: sessionData } = trpc.customer.me.useQuery(
    { token },
    { enabled: isLoggedIn, staleTime: 60_000 }
  );

  const createTicket = trpc.support.createTicket.useMutation({
    onSuccess: () => {
      toast.success("Yêu cầu hỗ trợ đã được gửi!");
      setSubmitted(true);
    },
    onError: (err) => toast.error(err.message || "Có lỗi xảy ra"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = isLoggedIn ? sessionData?.email || form.email : form.email;
    if (!email) { toast.error("Vui lòng nhập email"); return; }
    if (!form.subject.trim()) { toast.error("Vui lòng nhập tiêu đề"); return; }
    if (!form.message.trim()) { toast.error("Vui lòng nhập nội dung"); return; }
    createTicket.mutate({
      token: token || undefined,
      customerEmail: email,
      subject: form.subject,
      message: form.message,
      priority: "medium",
    });
  };

  const handleReset = () => {
    setSubmitted(false);
    setForm({ email: "", subject: "", message: "" });
    setOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Popup panel */}
      {open && (
        <div className="w-80 bg-[#1a1a1a] border border-white/15 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-white" />
              <span className="font-semibold text-white text-sm">Hỗ trợ khách hàng</span>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-white/20 transition-colors">
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          <div className="p-4">
            {submitted ? (
              <div className="text-center py-4">
                <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-2" />
                <p className="font-semibold text-white text-sm">Đã gửi thành công!</p>
                <p className="text-xs text-white/50 mt-1 mb-4">Chúng tôi sẽ phản hồi sớm nhất có thể.</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-medium text-white transition-colors"
                  >
                    Gửi ticket mới
                  </button>
                  <button
                    onClick={() => { navigate("/support"); setOpen(false); }}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-medium text-white transition-colors flex items-center justify-center gap-1"
                  >
                    Xem ticket <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <p className="text-xs text-white/50">Gửi yêu cầu hỗ trợ, chúng tôi sẽ phản hồi trong 24h.</p>
                {!isLoggedIn && (
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="Email của bạn *"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                )}
                {isLoggedIn && (
                  <div className="bg-white/5 rounded-xl px-3 py-1.5 text-xs text-white/50">
                    {sessionData?.email}
                  </div>
                )}
                <input
                  type="text"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Tiêu đề *"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Mô tả vấn đề của bạn... *"
                  required
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { navigate("/support"); setOpen(false); }}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium text-white/60 transition-colors"
                  >
                    Xem FAQ
                  </button>
                  <button
                    type="submit"
                    disabled={createTicket.isPending}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {createTicket.isPending ? "Đang gửi..." : "Gửi"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-14 h-14 rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all duration-300 ${open ? "bg-[#1a1a1a] border border-white/15 rotate-0" : "bg-blue-600 hover:bg-blue-700 hover:scale-110"}`}
        aria-label="Hỗ trợ"
      >
        {open ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
      </button>
    </div>
  );
}
