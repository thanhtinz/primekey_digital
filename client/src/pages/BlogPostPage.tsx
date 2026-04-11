import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import DOMPurify from "dompurify";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";
import { BookOpen, Clock, Eye, ArrowLeft, Tag } from "@/components/Icon";

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function BlogPostPage() {
  const [, navigate] = useLocation();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: post, isLoading } = trpc.blog.getPost.useQuery({ slug: slug || "" }, { enabled: !!slug });
  const { data: categories = [] } = trpc.blog.listCategories.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <ClientHeader />
        <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="h-64 bg-gray-200 rounded-xl" />
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-gray-100 rounded" />)}
            </div>
          </div>
        </div>
        <ClientFooter />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white">
        <ClientHeader />
        <div className="max-w-3xl mx-auto px-4 pt-24 pb-16 text-center">
          <BookOpen className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-700 mb-2">Bài viết không tồn tại</h1>
          <p className="text-gray-400 text-sm mb-6">Bài viết này có thể đã bị xóa hoặc chưa được xuất bản.</p>
          <button
            onClick={() => navigate("/blog")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại Blog
          </button>
        </div>
        <ClientFooter />
      </div>
    );
  }

  const category = categories.find(c => c.id === post.categoryId);

  return (
    <div className="min-h-screen bg-white">
      <ClientHeader />

      <div className="max-w-3xl mx-auto px-4 pt-16 lg:pt-24 pb-16">
        {/* Back */}
        <button
          onClick={() => navigate("/blog")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition mb-6 mt-4"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại Blog
        </button>

        {/* Category */}
        {category && (
          <span className="inline-block bg-blue-50 text-blue-600 text-xs px-3 py-1 rounded-full font-medium mb-3">
            {category.name}
          </span>
        )}

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-snug">{post.title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-gray-400 mb-6">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatDate(post.publishedAt)}</span>
          <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{post.viewCount ?? 0} lượt xem</span>
        </div>

        {/* Cover image */}
        {post.coverImage && (
          <div className="rounded-2xl overflow-hidden mb-8 shadow-sm">
            <img src={post.coverImage} alt={post.title} className="w-full object-cover max-h-96" />
          </div>
        )}

        {/* Excerpt */}
        {post.excerpt && (
          <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-xl px-5 py-4 mb-8">
            <p className="text-blue-800 text-sm font-medium italic">{post.excerpt}</p>
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-sm md:prose max-w-none text-gray-700 leading-relaxed
            prose-headings:font-bold prose-headings:text-gray-900
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl prose-img:shadow-sm
            prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded
            prose-pre:bg-gray-900 prose-pre:text-gray-100
            prose-blockquote:border-blue-400 prose-blockquote:bg-blue-50 prose-blockquote:rounded-r-xl"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content.replace(/\n/g, "<br/>")) }}
        />

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => navigate("/blog")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Xem thêm bài viết
          </button>
        </div>
      </div>

      <ClientFooter />
    </div>
  );
}
