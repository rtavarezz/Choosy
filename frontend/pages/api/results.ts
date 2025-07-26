import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const BACKEND = process.env.BACKEND_URL!;
  if (!BACKEND) {
    console.error('BACKEND_URL environment variable not set');
    return res.status(500).json({ error: 'Backend configuration error' });
  }

  const { planId } = req.query;

  try {
    const response = await fetch(`${BACKEND}/api/plans/${planId}/results`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error in results API:', error);
    res.status(500).json({ message: 'Failed to fetch results' });
  }
} 