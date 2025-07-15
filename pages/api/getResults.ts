import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planId } = req.query;

    // Validate plan ID
    if (!planId || typeof planId !== 'string') {
      return res.status(400).json({ 
        error: 'Missing or invalid planId parameter' 
      });
    }

    // Mock results data (replace with Supabase query in production)
    const mockResults = {
      planId,
      plan: {
        topic: 'concerts',
        groupSize: 'solo',
        zipCode: '10001',
        userName: 'John Smith',
        phoneNumber: '(555) 123-4567'
      },
      totalVotes: 3,
      participants: ['friendA', 'friendB', 'friendC'],
      events: [
        {
          id: '1',
          name: 'Winning Event',
          votes: 2,
          percentage: 66.7
        },
        {
          id: '2', 
          name: 'Second Place Event',
          votes: 1,
          percentage: 33.3
        },
        {
          id: '3',
          name: 'Third Place Event', 
          votes: 0,
          percentage: 0
        }
      ].sort((a, b) => b.votes - a.votes)
    };

    // Return mock results
    res.status(200).json(mockResults);

  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch results'
    });
  }
}
