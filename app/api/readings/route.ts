import { NextRequest, NextResponse } from 'next/server';
import { toSpeechText } from '@/lib/kuromoji-server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'text required' }, { status: 400 });
    }
    const speech = await toSpeechText(text);
    return NextResponse.json({ text: speech });
  } catch (error) {
    console.error('Readings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
