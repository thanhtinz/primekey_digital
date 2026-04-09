/**
 * SupportPage - Trang hỗ trợ khách hàng
 * Widget hỗ trợ + hệ thống ticket
 */
import { useState } from "react";
import { MessageCircle, Send, ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle, HelpCircle, Headphones, Mail, Phone, Ticket } from "@/components/Icon";
import { trpc } from "@/lib/trpc";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";
import { toast } from "sonner";

const FAQ_ITEMS = [
  {
    q: "Làm thế nào để đặt hàng?",
    a: "Bạn chọn sản phẩm, thêm vào giỏ hàng hoặc mua ngay, điền thông tin đặt hàng và chọn phương thức thanh toán. Sau khi thanh toán thành công, bạn sẽ nhận được sản phẩm qua email.",
  },
  {
    q: "Các phương thức thanh toán nào được hỗ trợ?",
    a: "Chúng tôi hỗ trợ thanh toán qua số dư ví và chuyển khoản ngân hàng qua PayOS (hỗ trợ tất cả ngân hàng Việt Nam).",
  },
  {
    q: "Tôi có thể nạp tiền vào ví như thế nào?",
    a: "Vào trang Nạp Tiền, chọn số tiền muốn nạp và thanh toán qua PayOS. Số dư sẽ được cộng vào tài khoản ngay sau khi thanh toán thành công.",
  },
  {
    q: "Nếu tôi gặp vấn đề với sản phẩm đã mua, tôi cần làm gì?",
    a: "Bạn có thể tạo ticket hỗ trợ bên dưới với thông tin chi tiết về vấn đề. Đội ngũ hỗ trợ sẽ phản hồi trong vòng 24 giờ.",
  },
  {
    q: "Mã giảm giá có thể sử dụng như thế nào?",
    a: "Nhập mã giảm giá vào ô 'Mã giảm giá' khi thanh toán. Mã sẽ được áp dụng tự động nếu hợp lệ.",
  },
  {
    q: "Làm thế nào để giới thiệu bạn bè và nhận hoa hồng?",
    a: "Vào trang Giới Thiệu Bạn Bè, copy link giới thiệu của bạn và chia sẻ. Khi bạn bè đăng ký và mua hàng lần đầu, bạn sẽ nhận được % hoa hồng.",
  },
];

function FAQItem({ item }: { item: { q: string; a: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-800 text-sm pr-4">{item.q}</span>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-100">
          <p className="pt-3">{item.a}</p>
        </div>
      )}
    </div>
  );
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: "Đang chờ", color: "text-yellow-400 bg-yellow-400/10", icon: Clock },
  in_progress: { label: "Đang xử lý", color: "text-blue-400 bg-blue-400/10", icon: AlertCircle },
  resolved: { label: "Đã giải quyết", color: "text-green-400 bg-green-400/10", icon: CheckCircle },
  closed: { label: "Đã đóng", color: "text-gray-400 bg-gray-50", icon: CheckCircle },
};

export default function SupportPage() {
  const token = typeof window !== "undefined" ? localStorage.getItem("customerToken") || "" : "";
  const isLoggedIn = !!token;

  const [form, setForm] = useState({ email: "", name: "", subject: "", message: "", priority: "medium" as "low" | "medium" | "high" });
  const [submitted, setSubmitted] = useState(false);

  const { data: sessionData } = trpc.customer.me.useQuery({ token }, { enabled: isLoggedIn, staleTime: 60_000 });
  const { data: myTickets, refetch: refetchTickets } = trpc.support.listMyTickets.useQuery({ token }, { enabled: isLoggedIn, staleTime: 30_000 });

  const createTicket = trpc.support.createTicket.useMutation({
    onSuccess: () => {
      toast.success("Ticket đã được tạo! Chúng tôi sẽ phản hồi sớm nhất có thể.");
      setSubmitted(true);
      refetchTickets();
    },
    onError: (err) => toast.error(err.message || "Có lỗi xảy ra, vui lòng thử lại."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = isLoggedIn ? (sessionData?.email || form.email) : form.email;
    if (!email) { toast.error("Vui lòng nhập email"); return; }
    if (!form.subject.trim()) { toast.error("Vui lòng nhập tiêu đề"); return; }
    if (!form.message.trim()) { toast.error("Vui lòng nhập nội dung"); return; }
    createTicket.mutate({
      token: token || undefined,
      customerEmail: email,
      customerName: isLoggedIn ? (sessionData?.name || form.name) : form.name,
      subject: form.subject,
      message: form.message,
      priority: form.priority,
    });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <ClientHeader />
      <div className="flex-1 pt-14">
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 border-b border-blue-800 py-10 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-4">
              <Headphones className="h-4 w-4 text-white" />
              <span className="text-sm text-white font-medium">Hỗ trợ 24/7</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">Trung Tâm Hỗ Trợ</h1>
            <p className="text-blue-100 text-base max-w-xl mx-auto">
              Chúng tôi luôn sẵn sàng hỗ trợ bạn. Tìm câu trả lời hoặc gửi yêu cầu hỗ trợ.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Contact channels */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { icon: MessageCircle, label: "Live Chat", desc: "Phản hồi trong vài phút", color: "text-blue-400", bg: "bg-blue-500/10" },
              { icon: Mail, label: "Email", desc: "Phản hồi trong 24 giờ", color: "text-green-400", bg: "bg-green-500/10" },
              { icon: Phone, label: "Hotline", desc: "8:00 - 22:00 hàng ngày", color: "text-purple-400", bg: "bg-purple-500/10" },
            ].map(ch => (
              <div key={ch.label} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${ch.bg} flex items-center justify-center flex-shrink-0`}>
                  <ch.icon className={`h-5 w-5 ${ch.color}`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{ch.label}</p>
                  <p className="text-xs text-gray-400">{ch.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: FAQ */}
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-400" />
                Câu hỏi thường gặp
              </h2>
              <div className="space-y-2">
                {FAQ_ITEMS.map((item, i) => <FAQItem key={i} item={item} />)}
              </div>
            </div>

            {/* Right: Create ticket */}
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Ticket className="h-5 w-5 text-blue-400" />
                Tạo yêu cầu hỗ trợ
              </h2>

              {submitted ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
                  <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
                  <p className="font-semibold text-white">Ticket đã được gửi!</p>
                  <p className="text-sm text-gray-500 mt-1 mb-4">Chúng tôi sẽ phản hồi qua email sớm nhất có thể.</p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors"
                  >
                    Tạo ticket mới
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-4">
                  {!isLoggedIn && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Email *</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="email@example.com"
                          required
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Tên</label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Tên của bạn"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  )}
                  {isLoggedIn && (
                    <div className="bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-500">
                      Gửi với tư cách: <span className="text-white font-medium">{sessionData?.email}</span>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Tiêu đề *</label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      placeholder="Mô tả ngắn gọn vấn đề của bạn"
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Mức độ ưu tiên</label>
                    <select
                      value={form.priority}
                      onChange={e => setForm(f => ({ ...f, priority: e.target.value as any }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                    >
                      <option value="low">Thấp - Câu hỏi chung</option>
                      <option value="medium">Trung bình - Cần hỗ trợ</option>
                      <option value="high">Cao - Vấn đề khẩn cấp</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Nội dung *</label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Mô tả chi tiết vấn đề của bạn..."
                      required
                      rows={4}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={createTicket.isPending}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {createTicket.isPending ? "Đang gửi..." : "Gửi yêu cầu hỗ trợ"}
                  </button>
                </form>
              )}

              {/* My tickets */}
              {isLoggedIn && myTickets && myTickets.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Ticket của tôi</h3>
                  <div className="space-y-2">
                    {myTickets.map((ticket: any) => {
                      const status = STATUS_MAP[ticket.status] || STATUS_MAP.open;
                      const StatusIcon = status.icon;
                      return (
                        <div key={ticket.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-3">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-medium text-white line-clamp-1">{ticket.subject}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 ${status.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            {new Date(ticket.createdAt).toLocaleDateString("vi-VN")}
                          </p>
                          {ticket.adminReply && (
                            <div className="mt-2 bg-blue-500/5 border border-blue-500/15 rounded-lg p-2">
                              <p className="text-xs text-blue-400 font-medium mb-0.5">Phản hồi từ hỗ trợ:</p>
                              <p className="text-xs text-gray-500">{ticket.adminReply}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ClientFooter />
    </div>
  );
}
