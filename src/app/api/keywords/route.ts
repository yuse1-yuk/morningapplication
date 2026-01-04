import { NextRequest, NextResponse } from "next/server";

import { addKeyword, deleteKeyword, listKeywords } from "@/lib/db";

export async function GET() {
  try {
    const keywords = await listKeywords();
    return NextResponse.json({ keywords });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "failed_to_load" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const keyword: string = (body.keyword ?? "").toString().trim();
    if (!keyword) {
      return NextResponse.json({ error: "invalid_keyword" }, { status: 400 });
    }
    const row = await addKeyword(keyword);
    return NextResponse.json({ keyword: row });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "failed_to_create" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) {
    return NextResponse.json({ error: "id_required" }, { status: 400 });
  }
  try {
    await deleteKeyword(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "failed_to_delete" }, { status: 500 });
  }
}
