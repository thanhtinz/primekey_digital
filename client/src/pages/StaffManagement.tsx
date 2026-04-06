import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { UserPlus, Trash2, Key, Shield, User, Users } from "lucide-react";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";

export default function StaffManagement() {
  const [createOpen, setCreateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState<number | null>(null);
  const [form, setForm] = useState({ username: "", password: "", name: "", role: "user" as "user" | "admin" });
  const [newPassword, setNewPassword] = useState("");

  const { data: staff, refetch } = trpc.staff.list.useQuery();
  const createMutation = trpc.staff.create.useMutation({
    onSuccess: () => { toast.success("Tạo tài khoản thành công!"); setCreateOpen(false); setForm({ username: "", password: "", name: "", role: "user" }); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateRoleMutation = trpc.staff.updateRole.useMutation({
    onSuccess: () => { toast.success("Đã cập nhật quyền!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const resetPasswordMutation = trpc.staff.resetPassword.useMutation({
    onSuccess: () => { toast.success("Đã đổi mật khẩu!"); setResetOpen(null); setNewPassword(""); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.staff.delete.useMutation({
    onSuccess: () => { toast.success("Đã xóa tài khoản!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!form.username || !form.password || !form.name) { toast.error("Vui lòng điền đầy đủ thông tin"); return; }
    createMutation.mutate(form);
  };

  return (
    <DashboardLayoutCustom>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-400" />
              Quản Lý Nhân Viên
            </h1>
            <p className="text-slate-400 mt-1">Tạo và quản lý tài khoản admin & nhân viên</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <UserPlus className="w-4 h-4" /> Thêm Tài Khoản
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle>Tạo Tài Khoản Mới</DialogTitle>
                <DialogDescription>Tạo tài khoản nhân viên mới trong hệ thống</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300">Tên đăng nhập</Label>
                  <Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    placeholder="vd: nhanvien2" className="bg-slate-700 border-slate-600 text-white mt-1" />
                  <p className="text-xs text-slate-400 mt-1">Email sẽ là: {form.username || "..."} @invoiceprime.com</p>
                </div>
                <div>
                  <Label className="text-slate-300">Họ tên</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nguyễn Văn A" className="bg-slate-700 border-slate-600 text-white mt-1" />
                </div>
                <div>
                  <Label className="text-slate-300">Mật khẩu</Label>
                  <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Nhập mật khẩu" className="bg-slate-700 border-slate-600 text-white mt-1" />
                </div>
                <div>
                  <Label className="text-slate-300">Vai trò</Label>
                  <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as "user" | "admin" }))}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="user" className="text-white">Nhân viên (chỉ tạo đơn)</SelectItem>
                      <SelectItem value="admin" className="text-white">Admin (toàn quyền)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} disabled={createMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700">
                  {createMutation.isPending ? "Đang tạo..." : "Tạo Tài Khoản"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-400">Tên</TableHead>
                <TableHead className="text-slate-400">Tên đăng nhập</TableHead>
                <TableHead className="text-slate-400">Vai trò</TableHead>
                <TableHead className="text-slate-400">Ngày tạo</TableHead>
                <TableHead className="text-slate-400 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff?.map(s => (
                <TableRow key={s.id} className="border-slate-700 hover:bg-slate-700/50">
                  <TableCell className="text-white font-medium">
                    <div className="flex items-center gap-2">
                      {s.role === "admin" ? <Shield className="w-4 h-4 text-yellow-400" /> : <User className="w-4 h-4 text-slate-400" />}
                      {s.name || "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">{s.email?.replace("@invoiceprime.com", "")}</TableCell>
                  <TableCell>
                    <Select value={s.role} onValueChange={v => updateRoleMutation.mutate({ id: s.id, role: v as "user" | "admin" })}>
                      <SelectTrigger className="w-36 bg-slate-700 border-slate-600 text-white h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="user" className="text-white text-xs">Nhân viên</SelectItem>
                        <SelectItem value="admin" className="text-white text-xs">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {new Date(s.createdAt).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Dialog open={resetOpen === s.id} onOpenChange={open => { setResetOpen(open ? s.id : null); setNewPassword(""); }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10">
                            <Key className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-800 border-slate-700 text-white">
                          <DialogHeader>
                            <DialogTitle>Đổi Mật Khẩu — {s.name}</DialogTitle>
                            <DialogDescription>Thiết lập mật khẩu mới cho tài khoản này</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-slate-300">Mật khẩu mới</Label>
                              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                placeholder="Nhập mật khẩu mới" className="bg-slate-700 border-slate-600 text-white mt-1" />
                            </div>
                            <Button onClick={() => resetPasswordMutation.mutate({ id: s.id, newPassword })}
                              disabled={!newPassword || resetPasswordMutation.isPending}
                              className="w-full bg-yellow-600 hover:bg-yellow-700">
                              {resetPasswordMutation.isPending ? "Đang đổi..." : "Đổi Mật Khẩu"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        onClick={() => { if (confirm(`Xóa tài khoản ${s.name}?`)) deleteMutation.mutate({ id: s.id }); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!staff || staff.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                    Chưa có tài khoản nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayoutCustom>
  );
}
