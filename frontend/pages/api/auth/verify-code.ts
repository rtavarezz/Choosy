import type { NextApiRequest, NextApiResponse } from 'next';

// SMS ENDPOINT - COMMENTED OUT FOR DEVELOPMENT (see onboarding.tsx)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiBase = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
  try {
    const response = await fetch(`${apiBase}/api/auth/verify-code`, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify code' });
  }
} 