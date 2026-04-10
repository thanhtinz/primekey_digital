import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Loader2, FileText, Eye, EyeOff } from "@/components/Icon";

export default function BlogPosts() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const { data: posts = [], isLoading, refetch } = trpc.blog.adminListPosts.useQuery();

  const deletePost = trpc.blog.deletePost.useMutation({
    onSuccess: () => { refetch(); toast.success("Đã xóa bài viết"); },
    onError: (e: any) => toast.error(e.message),
  });
  const togglePublish = trpc.blog.updatePost.useMutation({
    onSuccess: () => { refetch(); toast.success("Đã cập nhật trạng thái"); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = (posts as any[]).filter((p: any) =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayoutCustom>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="ak-page-header">
            <div>
              <h1 className="ak-page-title">Tất Cả Bài Viết</h1>
              <p className="ak-page-subtitle">Quản lý toàn bộ bài viết trên blog</p>
            </div>
          </div>
          <Button onClick={() => navigate("/admin/blog/new")}>
            <Plus className="h-4 w-4 mr-2" /> Viết bài mới
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm bài viết..."
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
                <FileText className="h-10 w-10 mb-2 opacity-30" />
                <p>Chưa có bài viết nào</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/admin/blog/new")}>
                  <Plus className="h-4 w-4 mr-1" /> Viết bài đầu tiên
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="ak-table w-full">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Tiêu đề</th>
                      <th>Chuyên mục</th>
                      <th>Trạng thái</th>
                      <th>Ngày tạo</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((post: any, i: number) => (
                      <tr key={post.id}>
                        <td className="text-muted-foreground">{i + 1}</td>
                        <td>
                          <div className="font-medium line-clamp-1">{post.title}</div>
                          {post.excerpt && <div className="text-xs text-muted-foreground line-clamp-1">{post.excerpt}</div>}
                        </td>
                        <td>
                          {post.categoryName ? (
                            <Badge variant="outline" className="text-xs">{post.categoryName}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td>
                          <Badge className={post.isPublished
                            ? "bg-green-100 text-green-700 border-0"
                            : "bg-gray-100 text-gray-600 border-0"
                          }>
                            {post.isPublished ? "Đã đăng" : "Nháp"}
                          </Badge>
                        </td>
                        <td className="text-sm text-muted-foreground">
                          {post.createdAt ? new Date(post.createdAt).toLocaleDateString("vi-VN") : "—"}
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon" variant="ghost" className="h-8 w-8"
                              title={post.isPublished ? "Ẩn bài" : "Đăng bài"}
                              onClick={() => togglePublish.mutate({ id: post.id, isPublished: !post.isPublished })}
                            >
                              {post.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              size="icon" variant="ghost" className="h-8 w-8"
                              onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon" variant="ghost"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => { if (confirm("Xóa bài viết này?")) deletePost.mutate({ id: post.id }); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
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
