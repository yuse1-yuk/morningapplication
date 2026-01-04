import { formatISO, startOfToday } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

import {
  addTodo,
  deleteTodo,
  listTodos,
  listTodosByDate,
} from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const today = formatISO(startOfToday(), { representation: "date" });

  try {
    if (dateParam === "today") {
      const rows = await listTodosByDate(today);
      return NextResponse.json({ todos: rows });
    }
    const from = dateParam ?? today;
    const rows = await listTodos(from);
    return NextResponse.json({ todos: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "failed_to_load" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text: string = body.text;
    const targetDate: string = body.target_date;
    if (!text || !targetDate) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    const row = await addTodo(text, targetDate);
    return NextResponse.json({ todo: row });
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
    await deleteTodo(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "failed_to_delete" }, { status: 500 });
  }
}
