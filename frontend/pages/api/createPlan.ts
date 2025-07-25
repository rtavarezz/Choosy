import type { NextApiRequest, NextApiResponse } from 'next';
import { sanitizePlanData, validateName, validateZipCode, validatePhoneNumber } from '../../lib/security';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  // Forward the Authorization header from the client if present
  const authHeader = req.headers.authorization || (req.cookies && req.cookies['accessToken'] ? `Bearer ${req.cookies['accessToken']}` : undefined);

  try {
    const response = await fetch(`${apiBase}/api/plans`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
      body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create plan' });
  }
}
