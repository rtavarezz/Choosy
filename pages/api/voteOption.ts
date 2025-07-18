import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planId, optionId, voterId, vote } = req.body;

    // Validate required fields
    if (!planId || !optionId || !voterId || vote === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: planId, optionId, voterId, vote' 
      });
    }

    // Validate vote value
    if (typeof vote !== 'boolean') {
      return res.status(400).json({ 
        error: 'Vote must be a boolean value (true/false)' 
      });
    }

    // Call FastAPI backend
    const response = await fetch('http://127.0.0.1:8000/api/votes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: planId,
        event_id: optionId,
        voter_id: voterId,
        vote_type: vote ? 'like' : 'dislike'
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
