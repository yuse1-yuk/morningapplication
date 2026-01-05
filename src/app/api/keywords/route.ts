import { NextRequest, NextResponse } from "next/server";

import { addKeyword, deleteKeyword, listKeywords } from "@/lib/db";

export async function GET(request: NextRequest) {
  const userEmail = request.cookies.get("g_user_email")?.value;
  if (!userEmail) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  try {
    const keywords = await listKeywords(userEmail);
    return NextResponse.json({ keywords });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "failed_to_load" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userEmail = request.cookies.get("g_user_email")?.value;
  if (!userEmail) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const keyword: string = (body.keyword ?? "").toString().trim();
    if (!keyword) {
      return NextResponse.json({ error: "invalid_keyword" }, { status: 400 });
    }
    const row = await addKeyword(userEmail, keyword);
    return NextResponse.json({ keyword: row });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "failed_to_create" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const userEmail = request.cookies.get("g_user_email")?.value;
  if (!userEmail) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) {
    return NextResponse.json({ error: "id_required" }, { status: 400 });
  }
  try {
    await deleteKeyword(userEmail, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "failed_to_delete" }, { status: 500 });
  }
}
