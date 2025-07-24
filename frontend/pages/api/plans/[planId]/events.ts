import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { planId } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!planId || typeof planId !== 'string') {
    return res.status(400).json({ error: 'Plan ID is required' });
  }

  try {
    console.log('🔍 Fetching events for plan:', planId);
    
    const response = await fetch(`http://127.0.0.1:8000/api/plans/${planId}/events`);
    console.log('🔍 Backend response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('🔍 Backend error:', errorData);
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    console.log('🔍 Events fetched successfully:', data.events?.length || 0, 'events');
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching plan events:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch plan events'
    });
  }
} 