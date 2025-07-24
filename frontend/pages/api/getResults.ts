import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planId } = req.query;

    // Validate plan ID
    if (!planId || typeof planId !== 'string') {
      return res.status(400).json({ 
        error: 'Missing or invalid planId parameter' 
      });
    }

    // Call FastAPI backend
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const response = await fetch(`${apiBase}/api/plans/${planId}/results`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();

    // Return results
    res.status(200).json(data);

  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch results'
    });
  }
}
