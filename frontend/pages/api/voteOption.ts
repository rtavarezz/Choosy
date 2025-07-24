import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planId, eventId, voterName, voterPhone, voteType } = req.body;

    // Validate required fields
    if (!planId || !eventId || !voterName || !voterPhone || !voteType) {
      return res.status(400).json({ 
        error: 'Missing required fields: planId, eventId, voterName, voterPhone, voteType' 
      });
    }

    // Validate vote type
    if (!['like', 'dislike'].includes(voteType)) {
      return res.status(400).json({ 
        error: 'Vote type must be either "like" or "dislike"' 
      });
    }

    // Validate phone number length (max 15 digits including country code)
    const phoneDigits = voterPhone.replace(/\D/g, '');
    if (phoneDigits.length > 15) {
      return res.status(400).json({ 
        error: 'Phone number is too long. Please enter a valid phone number (maximum 15 digits including country code).' 
      });
    }
    if (phoneDigits.length < 10) {
      return res.status(400).json({ 
        error: 'Phone number is too short. Please enter a valid phone number (minimum 10 digits).' 
      });
    }

    // Call FastAPI backend
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const response = await fetch(`${apiBase}/api/votes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: planId,
        event_id: eventId,
        voter_name: voterName,
        voter_phone: voterPhone,
        vote_type: voteType
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();

    // Return success response
    res.status(200).json({ 
      message: 'Vote recorded successfully',
      voteId: data.id
    });

  } catch (error) {
    console.error('Error recording vote:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to record vote'
    });
  }
}
