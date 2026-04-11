import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";
import { BookOpen, Clock, Eye, Tag, ChevronRight, Search, ArrowRight } from "@/components/Icon";

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function BlogPage() {
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState("");

  const { data: categoriesData = [] } = trpc.blog.listCategories.useQuery();
  const { data: postsData, isLoading } = trpc.blog.listPosts.useQuery({
    categoryId: selectedCategory,
    page: 1,
    limit: 20,
  });

  const posts = postsData?.posts ?? [];
  const filtered = search.trim()
    ? posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    : posts;

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="min-h-screen bg-gray-50 pt-16 lg:pt-24">
      <ClientHeader />
      {/* Hero Banner */}
      <div className="mx-4 mt-4 mb-4">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-slate-700 via-blue-700 to-indigo-700 rounded-2xl px-5 py-5 text-white flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-black">Blog & Hướng Dẫn 📚</h1>
            <p className="text-white/80 text-sm">Kiến thức, tin tức và mẹo hay dành cho bạn</p>
          </div>
          {posts.length > 0 && (
            <div className="flex-shrink-0 bg-white/20 rounded-xl px-3 py-1.5 text-center">
              <p className="text-white font-black text-xl">{posts.length}</p>
              <p className="text-white/80 text-[10px]">bài viết</p>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 pb-10">
        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm bài viết..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
        </div>
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              selectedCategory === undefined
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Tất cả
          </button>
          {categoriesData.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-xl h-44 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Chưa có bài viết nào</p>
            <p className="text-gray-400 text-sm mt-1">Quay lại sau nhé!</p>
          </div>
        ) : (
          <>
            {/* Featured post */}
            {featured && !search && (
              <div
                className="mb-10 rounded-2xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer group hover:shadow-md transition"
                onClick={() => navigate(`/blog/${featured.slug}`)}
              >
                <div className="md:flex">
                  {featured.coverImage ? (
                    <div className="md:w-2/5 h-52 md:h-auto overflow-hidden">
                      <img src={featured.coverImage} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    </div>
                  ) : (
                    <div className="md:w-2/5 h-52 md:h-auto bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-white/40" />
                    </div>
                  )}
                  <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-blue-50 text-blue-600 text-xs px-2.5 py-0.5 rounded-full font-medium">Nổi bật</span>
                      {featured.categoryId && categoriesData.find(c => c.id === featured.categoryId) && (
                        <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5 rounded-full">
                          {categoriesData.find(c => c.id === featured.categoryId)?.name}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition line-clamp-2">
                      {featured.title}
                    </h2>
                    {featured.excerpt && (
                      <p className="text-gray-500 text-sm line-clamp-2 mb-4">{featured.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatDate(featured.publishedAt)}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{featured.viewCount ?? 0} lượt xem</span>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
                      Đọc bài viết <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grid posts */}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {(search ? filtered : rest).map(post => (
                <article
                  key={post.id}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                >
                  {post.coverImage ? (
                    <div className="h-44 overflow-hidden">
                      <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    </div>
                  ) : (
                    <div className="h-44 bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-blue-200" />
                    </div>
                  )}
                  <div className="p-4">
                    {post.categoryId && categoriesData.find(c => c.id === post.categoryId) && (
                      <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                        {categoriesData.find(c => c.id === post.categoryId)?.name}
                      </span>
                    )}
                    <h3 className="text-sm font-semibold text-gray-900 mt-2 mb-1.5 line-clamp-2 group-hover:text-blue-600 transition">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(post.publishedAt)}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.viewCount ?? 0}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      <ClientFooter />
    </div>
  );
}
