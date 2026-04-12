// API analytics/summary — KPIs del dashboard (solo admin)
import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getDashboardMetrics } from "@/lib/sheets/metrics";
import { getAbandonedCartsToday } from "@/lib/sheets/carts";

// ISR 5 min — evita hammering de Sheets API en refreshes del dashboard
export const revalidate = 300;

export async function GET() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const [metrics, carritosHoy] = await Promise.all([
      getDashboardMetrics(),
      getAbandonedCartsToday(),
    ]);

    // Llenar los campos de carritos que getDashboardMetrics deja en 0
    // (ver comentario en metrics.ts — los endpoints componen el objeto final)
    metrics.carritos_abandonados_hoy = carritosHoy.length;

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[api/analytics/summary]", error);
    return NextResponse.json({ error: "Error al obtener métricas" }, { status: 500 });
  }
}
