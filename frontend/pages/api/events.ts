import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { lat, lng, category, radius, limit } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }

  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const response = await fetch(`${apiBase}/api/events?lat=${lat}&lng=${lng}&category=${category || 'adventure'}&radius=${radius || 5000}&limit=${limit || 20}`);
    
    if (!response.ok) {
      throw new Error(`Backend events API failed: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Events API error:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
} 