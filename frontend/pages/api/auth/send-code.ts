import type { NextApiRequest, NextApiResponse } from 'next';

// SMS ENDPOINT - COMMENTED OUT FOR DEVELOPMENT (see onboarding.tsx)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiBase = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
  try {
    const phone = req.body.phone || req.query.phone;
    if (!phone) {
      return res.status(400).json({ error: 'Missing phone number' });
    }
    const url = `${apiBase}/api/auth/send-code?phone=${encodeURIComponent(phone)}`;
    const response = await fetch(url, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send code' });
  }
} 