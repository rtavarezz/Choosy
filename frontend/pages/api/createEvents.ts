import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planId, events } = req.body;

    if (!planId || !events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Missing planId or events array' });
    }

    // Use environment variable for backend URL
    const BACKEND = process.env.BACKEND_URL!;
    if (!BACKEND) {
      console.error('BACKEND_URL environment variable not set');
      return res.status(500).json({ error: 'Backend configuration error' });
    }

    const response = await fetch(`${BACKEND}/api/plans/${planId}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(events),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error:', response.status, errorData);
      return res.status(response.status).json({ 
        error: errorData.detail || `Backend error: ${response.status}` 
      });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error creating events:', error);
    res.status(500).json({ error: 'Failed to create events' });
  }
} 