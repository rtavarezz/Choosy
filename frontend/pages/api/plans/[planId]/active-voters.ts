import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { planId } = req.query;

  if (!planId || typeof planId !== 'string') {
    return res.status(400).json({ error: 'Plan ID is required' });
  }

  try {
    if (req.method === 'GET') {
      // Get active voters
      const response = await fetch(`http://127.0.0.1:8000/api/plans/${planId}/active-voters`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      res.status(200).json(data);
    } else if (req.method === 'POST') {
      // Update active voter status
      const response = await fetch(`http://127.0.0.1:8000/api/plans/${planId}/active-voters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      res.status(200).json(data);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error with active voters:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to handle active voters request'
    });
  }
} 