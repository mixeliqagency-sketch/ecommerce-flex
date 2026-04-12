import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getSocialPostsHistory } from "@/lib/sheets/social-log";

export const revalidate = 60;

export async function GET() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const posts = await getSocialPostsHistory(50);
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("[api/social/history]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
