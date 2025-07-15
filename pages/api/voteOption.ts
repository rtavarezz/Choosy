import type { NextApiRequest, NextApiResponse } from 'next';

// Mock vote storage (replace with Supabase in production)
const MOCK_VOTES = new Map();

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

    // Create vote record
    const voteRecord = {
      id: `${planId}_${optionId}_${voterId}`,
      planId,
      optionId,
      voterId,
      vote,
      createdAt: new Date().toISOString()
    };

    // Store vote (mock implementation)
    MOCK_VOTES.set(voteRecord.id, voteRecord);

    // Log vote for debugging
    console.log('Vote recorded:', {
      planId: voteRecord.planId,
      optionId: voteRecord.optionId,
      voterId: voteRecord.voterId,
      vote: voteRecord.vote
    });

    // Return success response
    res.status(200).json({ 
      message: 'Vote recorded successfully',
      voteId: voteRecord.id
    });

  } catch (error) {
    console.error('Error recording vote:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to record vote'
    });
  }
}
