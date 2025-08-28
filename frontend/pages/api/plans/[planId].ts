import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { planId } = req.query;

  if (!planId || typeof planId !== 'string') {
    return res.status(400).json({ error: 'Plan ID is required' });
  }

  try {
    const apiBase = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    const response = await fetch(`${apiBase}/api/plans/${planId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('Error fetching plan details:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch plan details'
    });
  }
} 