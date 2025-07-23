import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { zipcode } = req.query;

  if (!zipcode) {
    return res.status(400).json({ message: 'Zipcode is required' });
  }

  try {
    // Call the backend geocoding service
    const response = await fetch(`http://localhost:8000/api/geocode?zipcode=${zipcode}`);
    
    if (!response.ok) {
      throw new Error(`Backend geocoding failed: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ message: 'Failed to geocode zipcode' });
  }
} 