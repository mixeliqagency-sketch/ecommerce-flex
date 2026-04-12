import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "@/lib/sheets/blog";
import { BlogEditor } from "@/components/panel/BlogEditor";

export const dynamic = "force-dynamic";

export default async function EditarPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading font-bold text-[var(--text-primary)]">
        Editar artículo
      </h1>
      <BlogEditor mode="edit" initialPost={post} />
    </div>
  );
}
