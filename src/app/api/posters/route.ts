import { NextResponse } from 'next/server';

// Temporary in-memory storage (Resets on restart)
// In production, use a database like Supabase or MongoDB
let savedPosters: Record<string, any> = {};

export async function POST(request: Request) {
  const data = await request.json();
  const id = Date.now().toString();
  savedPosters[id] = data;
  return NextResponse.json({ id, message: "Poster saved!" });
}

export async function GET() {
  return NextResponse.json(savedPosters);
}