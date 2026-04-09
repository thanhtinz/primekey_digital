import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HelpCircle, ChevronDown, ChevronUp, Search, MessageCircle } from "@/components/Icon";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";

export default function FAQPage() {
  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery();
  const { data: faqs = [] } = trpc.faq.listPublic.useQuery();
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const logo = publicInfo?.logoUrl;
  const siteName = publicInfo?.companyName || "Invoice Prime";

  const filtered = (faqs as any[]).filter(f =>
    !search || f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const grouped = filtered.reduce((acc: Record<string, any[]>, faq: any) => {
    const cat = faq.category || "Chung";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {});

  return (
    <div className="min-h-screen pt-20 bg-slate-50 text-slate-800">
      <ClientHeader />

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 border border-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Câu Hỏi Thường Gặp</h1>
          <p className="text-slate-500">Tìm câu trả lời nhanh cho các thắc mắc phổ biến</p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm câu hỏi..." className="pl-12 py-3 text-base bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-purple-500 rounded-xl" />
        </div>

        {/* FAQ list */}
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16">
            <HelpCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500">{search ? "Không tìm thấy câu hỏi phù hợp" : "Chưa có câu hỏi nào"}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <h2 className="text-slate-600 text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-600 rounded-full" />
                  {category}
                </h2>
                <div className="space-y-2">
                  {items.map((faq: any) => (
                    <div key={faq.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:bg-slate-100 hover:border-slate-300 transition-colors">
                      <button
                        onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                        className="w-full flex items-center justify-between p-4 text-left"
                      >
                        <span className="text-slate-800 font-medium pr-4">{faq.question}</span>
                        {openId === faq.id ? <ChevronUp className="w-5 h-5 text-purple-600 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0" />}
                      </button>
                      {openId === faq.id && (
                        <div className="px-4 pb-4 border-t border-slate-200">
                          <p className="text-slate-600 text-sm leading-relaxed mt-3 whitespace-pre-wrap">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-10 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6 text-center">
          <MessageCircle className="w-8 h-8 text-purple-600 mx-auto mb-3" />
          <h3 className="text-slate-800 font-semibold mb-1">Không tìm thấy câu trả lời?</h3>
          <p className="text-slate-500 text-sm mb-4">Liên hệ với chúng tôi để được hỗ trợ trực tiếp</p>
          <Link href="/warranty-request">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
              <MessageCircle className="w-4 h-4" /> Gửi Yêu Cầu Hỗ Trợ
            </Button>
          </Link>
        </div>
      </div>
      <ClientFooter />
    </div>
  );
}
