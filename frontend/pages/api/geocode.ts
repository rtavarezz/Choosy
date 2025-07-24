import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { zipcode, lat, lng } = req.query;

  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    let backendUrl = '';
    if (lat && lng) {
      // If lat/lng provided, call backend to get zipcode
      backendUrl = `${apiBase}/api/geocode?lat=${lat}&lng=${lng}`;
    } else if (zipcode) {
      // If zipcode provided, call backend as before
      backendUrl = `${apiBase}/api/geocode?zipcode=${zipcode}`;
    } else {
      return res.status(400).json({ message: 'Zipcode or lat/lng required' });
    }

    const response = await fetch(backendUrl);
    if (!response.ok) {
      throw new Error(`Backend geocoding failed: ${response.status}`);
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ message: 'Failed to geocode' });
  }
} 