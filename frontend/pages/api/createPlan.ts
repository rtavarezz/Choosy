import type { NextApiRequest, NextApiResponse } from 'next';
import { sanitizePlanData, validateName, validateZipCode, validatePhoneNumber } from '../../lib/security';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiBase = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

  try {
    // Use the simple plan creation endpoint that doesn't require authentication
    const response = await fetch(`${apiBase}/api/plans/simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    
    const data = await response.json();
    console.log('🎯 Backend plan creation response:', data);
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Plan creation error:', error);
    res.status(500).json({ message: 'Failed to create plan' });
  }
}
