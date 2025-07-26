import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const BACKEND = process.env.BACKEND_URL!;
  if (!BACKEND) {
    console.error('BACKEND_URL environment variable not set');
    return res.status(500).json({ error: 'Backend configuration error' });
  }

  try {
    const response = await fetch(`${BACKEND}/api/votes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    if (!response.ok) {
      const err = await response.json();
      if (err && err.detail) {
        err.detail.forEach((d: any, i: number) => {
          console.error(`🔥 backend /api/votes validation error [${i}]:`);
          console.error('  type:', d.type);
          console.error('  loc:', JSON.stringify(d.loc));
          console.error('  msg:', d.msg);
          console.error('  input:', JSON.stringify(d.input));
        });
      } else {
        console.error('🔥 backend /api/votes validation error:', err);
      }
      return res.status(response.status).json(err);
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal' });
  }
} 