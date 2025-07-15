import type { NextApiRequest, NextApiResponse } from 'next';

// Mock plan data storage (replace with Supabase in production)
const MOCK_PLANS = new Map();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topic, groupSize, zipCode, phoneNumber, customEvents } = req.body;

    // Validate required fields
    if (!topic || !groupSize || !zipCode || !phoneNumber) {
      return res.status(400).json({ 
        error: 'Missing required fields: topic, groupSize, zipCode, phoneNumber' 
      });
    }

    // Generate unique plan ID
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create plan object
    const plan = {
      id: planId,
      topic,
      groupSize,
      zipCode,
      phoneNumber,
      customEvents: customEvents || [],
      createdAt: new Date().toISOString(),
      endTime: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes from now
    };

    // Store plan (mock implementation)
    MOCK_PLANS.set(planId, plan);

    // Log plan creation for debugging
    console.log('Mock plan created:', {
      planId: plan.id,
      topic: plan.topic,
      groupSize: plan.groupSize,
      zipCode: plan.zipCode,
      phoneNumber: plan.phoneNumber,
      customEvents: plan.customEvents
    });

    // Return success response
    res.status(200).json({ 
      planId: plan.id,
      message: 'Plan created successfully'
    });

  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create plan'
    });
  }
}
