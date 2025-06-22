import {NextResponse} from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const provider = process.env.MODEL_PROVIDER || 'openrouter';
  let models: string[] = [];
  try {
    if (provider === 'openrouter') {
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY || ''}`,
        },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.data)) {
          models = data.data.map((m: any) => m.id);
        }
      }
    } else if (provider === 'google') {
      const url = `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GOOGLE_AI_API_KEY || ''}`;
      const res = await fetch(url, {cache: 'no-store'});
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.models)) {
          models = data.models.map((m: any) => m.name);
        }
      }
    }
  } catch (err) {
    console.error('Model fetch error', err);
  }
  return NextResponse.json({models});
}
