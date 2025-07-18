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

    // Clean phone number for database validation
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, ''); // Remove everything except digits and +
    
    console.log('🔧 Creating plan with data:', {
      topic,
      groupSize,
      zipCode,
      userName,
      cleanPhone,
      customEvents
    });

    // Call FastAPI backend
    const response = await fetch('http://127.0.0.1:8000/api/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        group_size: groupSize, // Already a string from frontend
        zip_code: zipCode,
        host_name: userName,
        host_phone: cleanPhone,
        custom_events: customEvents || []
      }),
    });

    console.log('🔧 FastAPI response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('🔧 FastAPI error:', errorData);
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    console.log('🔧 FastAPI success response:', data);

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
