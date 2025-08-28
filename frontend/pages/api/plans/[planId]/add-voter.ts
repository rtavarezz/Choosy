import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { planId } = req.query;
  const { voter_id, voter_name, voter_phone } = req.body;
  const apiBase = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
  
  try {
    const response = await fetch(`${apiBase}/api/plans/${planId}/add-voter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ voter_id, voter_name, voter_phone }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Add voter error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
}