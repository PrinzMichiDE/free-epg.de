import { NextResponse } from 'next/server';

let shareCount = 0;

export async function GET() {
  return NextResponse.json({ shareCount });
}

export async function POST() {
  shareCount++;
  return NextResponse.json({ shareCount });
}

