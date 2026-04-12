// Panel: Redes Sociales — compositor + historial.

import { getSocialPostsHistory } from "@/lib/sheets/social-log";
import { SocialMediaComposer } from "@/components/panel/SocialMediaComposer";
import { SocialMediaHistory } from "@/components/panel/SocialMediaHistory";

export const revalidate = 60;

export default async function RedesSocialesPage() {
  let posts: Awaited<ReturnType<typeof getSocialPostsHistory>> = [];
  try {
    posts = await getSocialPostsHistory(50);
  } catch (err) {
    console.error("[panel/redes-sociales]", err);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-heading font-bold text-[var(--text-primary)]">
        Redes Sociales
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
          <h2 className="text-xl font-heading font-semibold mb-4 text-[var(--text-primary)]">
            Nueva publicacion
          </h2>
          <SocialMediaComposer />
        </div>
        <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
          <h2 className="text-xl font-heading font-semibold mb-4 text-[var(--text-primary)]">
            Historial
          </h2>
          <SocialMediaHistory posts={posts} />
        </div>
      </div>
    </div>
  );
}
