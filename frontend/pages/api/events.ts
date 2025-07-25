import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lng, category, radius, limit } = req.query;

  // Validate required parameters
  if (!lat || !lng || typeof lat !== 'string' || typeof lng !== 'string') {
    return res.status(400).json({ error: 'Valid latitude and longitude are required' });
  }

  // Validate coordinate format
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
    return res.status(400).json({ error: 'Invalid coordinate format' });
  }

  // Validate optional parameters
  const validCategories = ['adventure', 'food', 'entertainment', 'culture', 'sports', 'nightlife'];
  const cleanCategory = validCategories.includes(category as string) ? category : 'adventure';
  
  const cleanRadius = Math.min(Math.max(parseInt(radius as string) || 5000, 1000), 50000);
  const cleanLimit = Math.min(Math.max(parseInt(limit as string) || 20, 1), 100);

  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const response = await fetch(
      `${apiBase}/api/events?lat=${latNum}&lng=${lngNum}&category=${cleanCategory}&radius=${cleanRadius}&limit=${cleanLimit}`
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ 
        error: errorData.error || 'Failed to fetch events',
        message: errorData.message || 'Server error'
      });
    }

    const data = await response.json();
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Events API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch events. Please try again.' 
    });
  }
} 