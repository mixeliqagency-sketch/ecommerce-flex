import { BlogEditor } from "@/components/panel/BlogEditor";

export default function NuevoPostPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading font-bold text-[var(--text-primary)]">
        Nuevo artículo
      </h1>
      <BlogEditor mode="create" />
    </div>
  );
}
