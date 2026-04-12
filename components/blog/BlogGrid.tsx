import type { BlogPost } from "@/types";
import { BlogCard } from "./BlogCard";

export function BlogGrid({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--text-muted)]">
        Todavia no hay articulos publicados.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <BlogCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
