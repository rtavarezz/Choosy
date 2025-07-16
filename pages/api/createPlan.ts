import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topic, groupSize, zipCode, userName, phoneNumber, customEvents } = req.body;

    // Validate required fields
    if (!topic || !groupSize || !zipCode || !userName || !phoneNumber) {
      return res.status(400).json({ 
        error: 'Missing required fields: topic, groupSize, zipCode, userName, phoneNumber' 
      });
    }

    // Call FastAPI backend
    const response = await fetch('http://localhost:8000/api/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        group_size: groupSize,
        zip_code: zipCode,
        host_name: userName,
        host_phone: phoneNumber,
        custom_events: customEvents || []
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();

    // Return success response
    res.status(200).json({ 
      planId: data.id,
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
