import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { planId } = req.query;

  if (!planId || typeof planId !== 'string') {
    return res.status(400).json({ error: 'Plan ID is required' });
  }

  try {
    // Call the backend voting status endpoint
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8000'}/api/plans/${planId}/voting-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Backend voting status error:', response.status, response.statusText);
      return res.status(response.status).json({ error: 'Failed to get voting status' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching voting status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 