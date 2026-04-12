import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getEmailStats } from "@/lib/sheets/emails-log";
import { countActiveSubscribers } from "@/lib/sheets/subscribers";

export const revalidate = 300;

export async function GET() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const [stats, activeSubscribers] = await Promise.all([
      getEmailStats(),
      countActiveSubscribers(),
    ]);
    return NextResponse.json({
      ...stats,
      suscriptores_activos: activeSubscribers,
    });
  } catch (error) {
    console.error("[api/email/stats]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
