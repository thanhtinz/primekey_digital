import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, Edit2, Trash2, Eye, EyeOff, Tag, Loader2, X, Check, FolderOpen } from "@/components/Icon";

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

export default function BlogManagement() {
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<"posts" | "categories">("posts");

  // Posts
  const { data: posts = [], isLoading: postsLoading } = trpc.blog.adminListPosts.useQuery();
  const [showPostForm, setShowPostForm] = useState(false);
  const [editPost, setEditPost] = useState<any>(null);
  const [postForm, setPostForm] = useState({ title: "", slug: "", excerpt: "", content: "", coverImage: "", categoryId: "", isPublished: false });

  // Categories
  const { data: categories = [], isLoading: catsLoading } = trpc.blog.listCategories.useQuery();
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", slug: "", sortOrder: 0 });

  const createPost = trpc.blog.createPost.useMutation({
    onSuccess: () => { toast.success("Đã tạo bài viết!"); utils.blog.adminListPosts.invalidate(); setShowPostForm(false); resetPostForm(); },
    onError: (e: any) => toast.error(e.message),
  });
  const updatePost = trpc.blog.updatePost.useMutation({
    onSuccess: () => { toast.success("Đã cập nhật!"); utils.blog.adminListPosts.invalidate(); setEditPost(null); },
    onError: (e: any) => toast.error(e.message),
  });
  const deletePost = trpc.blog.deletePost.useMutation({
    onSuccess: () => { toast.success("Đã xóa!"); utils.blog.adminListPosts.invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });
  const createCat = trpc.blog.createCategory.useMutation({
    onSuccess: () => { toast.success("Đã tạo danh mục!"); utils.blog.listCategories.invalidate(); setShowCatForm(false); setCatForm({ name: "", slug: "", sortOrder: 0 }); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteCat = trpc.blog.deleteCategory.useMutation({
    onSuccess: () => { toast.success("Đã xóa!"); utils.blog.listCategories.invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  function resetPostForm() {
    setPostForm({ title: "", slug: "", excerpt: "", content: "", coverImage: "", categoryId: "", isPublished: false });
  }

  function openEdit(post: any) {
    setEditPost(post);
    setPostForm({
      title: post.title, slug: post.slug, excerpt: post.excerpt || "",
      content: post.content, coverImage: post.coverImage || "",
      categoryId: post.categoryId?.toString() || "", isPublished: post.isPublished,
    });
  }

  function handlePostSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      title: postForm.title, slug: postForm.slug, content: postForm.content,
      excerpt: postForm.excerpt || undefined, coverImage: postForm.coverImage || undefined,
      categoryId: postForm.categoryId ? parseInt(postForm.categoryId) : undefined,
      isPublished: postForm.isPublished,
    };
    if (editPost) {
      updatePost.mutate({ id: editPost.id, ...data });
    } else {
      createPost.mutate(data);
    }
  }

  return (
    <DashboardLayoutCustom>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="ak-page-header">
          <div>
            <h1 className="ak-page-title">Quản Lý Blog</h1>
            <p className="ak-page-subtitle">Tạo và quản lý bài viết blog</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("posts")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === "posts" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Bài viết ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === "categories" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Danh mục ({categories.length})
            </button>
          </div>
        </div>

        {/* Posts Tab */}
        {activeTab === "posts" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { setShowPostForm(true); setEditPost(null); resetPostForm(); }} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Tạo bài viết
              </Button>
            </div>

            {/* Post form */}
            {(showPostForm || editPost) && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{editPost ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}</h3>
                  <button onClick={() => { setShowPostForm(false); setEditPost(null); }} className="text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handlePostSubmit} className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Tiêu đề *</label>
                      <Input
                        value={postForm.title}
                        onChange={e => setPostForm(f => ({ ...f, title: e.target.value, slug: f.slug || slugify(e.target.value) }))}
                        placeholder="Tiêu đề bài viết" required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Slug *</label>
                      <Input
                        value={postForm.slug}
                        onChange={e => setPostForm(f => ({ ...f, slug: e.target.value }))}
                        placeholder="url-bai-viet" required
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Danh mục</label>
                      <select
                        value={postForm.categoryId}
                        onChange={e => setPostForm(f => ({ ...f, categoryId: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Không có danh mục --</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Ảnh bìa (URL)</label>
                      <Input
                        value={postForm.coverImage}
                        onChange={e => setPostForm(f => ({ ...f, coverImage: e.target.value }))}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Tóm tắt</label>
                    <textarea
                      value={postForm.excerpt}
                      onChange={e => setPostForm(f => ({ ...f, excerpt: e.target.value }))}
                      placeholder="Mô tả ngắn về bài viết..."
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Nội dung * (hỗ trợ HTML)</label>
                    <textarea
                      value={postForm.content}
                      onChange={e => setPostForm(f => ({ ...f, content: e.target.value }))}
                      placeholder="Nội dung bài viết..."
                      rows={10}
                      required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-y font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={postForm.isPublished}
                        onChange={e => setPostForm(f => ({ ...f, isPublished: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Xuất bản ngay</span>
                    </label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => { setShowPostForm(false); setEditPost(null); }}>Hủy</Button>
                    <Button type="submit" disabled={createPost.isPending || updatePost.isPending}>
                      {(createPost.isPending || updatePost.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                      {editPost ? "Cập nhật" : "Tạo bài viết"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Posts list */}
            {postsLoading ? (
              <div className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" /></div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 bg-white border border-gray-100 rounded-xl">
                <BookOpen className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Chưa có bài viết nào</p>
              </div>
            ) : (
              <div className="space-y-2">
                {posts.map((post: any) => (
                  <div key={post.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition">
                    {post.coverImage && (
                      <img src={post.coverImage} alt={post.title} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-medium text-gray-900 text-sm truncate">{post.title}</h3>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${post.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {post.isPublished ? "Đã xuất bản" : "Nháp"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">/blog/{post.slug}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => updatePost.mutate({ id: post.id, isPublished: !post.isPublished })}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title={post.isPublished ? "Ẩn bài" : "Xuất bản"}
                      >
                        {post.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => openEdit(post)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm("Xóa bài viết này?")) deletePost.mutate({ id: post.id }); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowCatForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Tạo danh mục
              </Button>
            </div>

            {showCatForm && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Tạo danh mục mới</h3>
                  <button onClick={() => setShowCatForm(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={e => { e.preventDefault(); createCat.mutate(catForm); }} className="space-y-3">
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Tên danh mục *</label>
                      <Input
                        value={catForm.name}
                        onChange={e => setCatForm(f => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))}
                        placeholder="Tên danh mục" required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Slug *</label>
                      <Input
                        value={catForm.slug}
                        onChange={e => setCatForm(f => ({ ...f, slug: e.target.value }))}
                        placeholder="ten-danh-muc" required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Thứ tự</label>
                      <Input
                        type="number"
                        value={catForm.sortOrder}
                        onChange={e => setCatForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setShowCatForm(false)}>Hủy</Button>
                    <Button type="submit" disabled={createCat.isPending}>
                      {createCat.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      Tạo danh mục
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {catsLoading ? (
              <div className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" /></div>
            ) : categories.length === 0 ? (
              <div className="text-center py-16 bg-white border border-gray-100 rounded-xl">
                <FolderOpen className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Chưa có danh mục nào</p>
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((cat: any) => (
                  <div key={cat.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Tag className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{cat.name}</p>
                        <p className="text-xs text-gray-400">/{cat.slug}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { if (confirm("Xóa danh mục này?")) deleteCat.mutate({ id: cat.id }); }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayoutCustom>
  );
}
