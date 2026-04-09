import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { HelpCircle, Plus, Pencil, Trash2, GripVertical, ChevronDown } from "@/components/Icon";

interface FAQForm { question: string; answer: string; category: string; sortOrder: number; }
const defaultForm: FAQForm = { question: "", answer: "", category: "Chung", sortOrder: 0 };

export default function FAQSettings() {
  const utils = trpc.useUtils();
  const { data: faqs = [], isLoading } = trpc.faq.list.useQuery();
  const createMutation = trpc.faq.create.useMutation({
    onSuccess: () => { utils.faq.list.invalidate(); toast.success("Đã tạo câu hỏi"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.faq.update.useMutation({
    onSuccess: () => { utils.faq.list.invalidate(); toast.success("Đã cập nhật"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.faq.delete.useMutation({
    onSuccess: () => { utils.faq.list.invalidate(); toast.success("Đã xóa"); },
    onError: (e) => toast.error(e.message),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FAQForm>(defaultForm);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  function openCreate() { setEditingId(null); setForm(defaultForm); setDialogOpen(true); }
  function openEdit(faq: any) { setEditingId(faq.id); setForm({ question: faq.question, answer: faq.answer, category: faq.category || "Chung", sortOrder: faq.sortOrder || 0 }); setDialogOpen(true); }
  function handleSubmit() {
    if (!form.question.trim() || !form.answer.trim()) return toast.error("Vui lòng điền đầy đủ câu hỏi và câu trả lời");
    if (editingId) updateMutation.mutate({ id: editingId, ...form });
    else createMutation.mutate(form);
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Group by category
  const grouped = (faqs as any[]).reduce((acc: Record<string, any[]>, faq: any) => {
    const cat = faq.category || "Chung";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {});

  return (
    <DashboardLayoutCustom>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-purple-400" />
              Câu Hỏi Thường Gặp (FAQ)
            </h1>
            <p className="text-slate-400 text-sm mt-1">Quản lý nội dung FAQ hiển thị cho khách hàng</p>
          </div>
          <Button onClick={openCreate} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Thêm Câu Hỏi
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Tổng câu hỏi", value: (faqs as any[]).length, color: "from-purple-500/20 to-purple-600/10 border-purple-500/30" },
            { label: "Danh mục", value: Object.keys(grouped).length, color: "from-blue-500/20 to-blue-600/10 border-blue-500/30" },
            { label: "Đang hiển thị", value: (faqs as any[]).length, color: "from-green-500/20 to-green-600/10 border-green-500/30" },
          ].map(s => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} border rounded-xl p-4`}>
              <p className="text-slate-400 text-xs">{s.label}</p>
              <p className="text-white text-2xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* FAQ list grouped */}
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Đang tải...</div>
        ) : (faqs as any[]).length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Chưa có câu hỏi nào</p>
            <Button onClick={openCreate} variant="outline" className="mt-4 border-slate-600 text-slate-300 hover:bg-slate-700">
              <Plus className="w-4 h-4 mr-2" /> Tạo câu hỏi đầu tiên
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-900/50 border-b border-slate-700">
                  <span className="text-slate-300 text-sm font-semibold">{category}</span>
                  <span className="text-slate-500 text-xs ml-2">({items.length} câu hỏi)</span>
                </div>
                <div className="divide-y divide-slate-700">
                  {items.map((faq: any) => (
                    <div key={faq.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                      <div className="flex items-start gap-3">
                        <GripVertical className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <button onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)} className="text-left w-full">
                            <p className="text-white font-medium text-sm">{faq.question}</p>
                          </button>
                          {expandedId === faq.id && (
                            <p className="text-slate-400 text-sm mt-2 whitespace-pre-wrap">{faq.answer}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(faq)} className="text-slate-400 hover:text-white hover:bg-slate-700 h-7 w-7 p-0">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate({ id: faq.id })} className="text-slate-400 hover:text-red-400 hover:bg-red-900/20 h-7 w-7 p-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Chỉnh Sửa Câu Hỏi" : "Thêm Câu Hỏi Mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-slate-300 text-sm">Câu hỏi *</Label>
              <Input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} placeholder="VD: Làm thế nào để tra cứu đơn hàng?" className="mt-1 bg-slate-800 border-slate-600 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Câu trả lời *</Label>
              <Textarea value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} placeholder="Nhập câu trả lời chi tiết..." className="mt-1 bg-slate-800 border-slate-600 text-white resize-none" rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm">Danh mục</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="VD: Thanh toán, Giao hàng..." className="mt-1 bg-slate-800 border-slate-600 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Thứ tự</Label>
                <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} className="mt-1 bg-slate-800 border-slate-600 text-white" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-slate-400 hover:text-white">Hủy</Button>
            <Button onClick={handleSubmit} disabled={isPending} className="bg-purple-600 hover:bg-purple-700 text-white">
              {isPending ? "Đang lưu..." : editingId ? "Cập Nhật" : "Tạo Câu Hỏi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayoutCustom>
  );
}
