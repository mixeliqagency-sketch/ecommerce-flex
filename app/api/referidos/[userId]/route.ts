import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getOrCreateReferral } from "@/lib/sheets/referrals";

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const isAdmin = session.user.role === "admin";
  const userEmail = session.user.email;

  if (!isAdmin && params.userId !== userEmail) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const referral = await getOrCreateReferral(params.userId);
    return NextResponse.json({ referral });
  } catch (error) {
    console.error("[api/referidos/userId]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
