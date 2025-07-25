import type { NextApiRequest, NextApiResponse } from 'next';
import { sanitizePlanData, validateName, validateZipCode, validatePhoneNumber } from '../../lib/security';

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

    // Sanitize and validate input
    const sanitizedData = sanitizePlanData({ topic, groupSize, zipCode, userName, phoneNumber });
    
    if (!validateName(sanitizedData.userName)) {
      return res.status(400).json({ error: 'Invalid name format' });
    }
    
    if (!validateZipCode(sanitizedData.zipCode)) {
      return res.status(400).json({ error: 'Invalid ZIP code format' });
    }
    
    if (!validatePhoneNumber(sanitizedData.phoneNumber)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Use sanitized data
    const { userName: cleanUserName, zipCode: cleanZipCode, phoneNumber: cleanPhone } = sanitizedData;
    
    console.log('🔧 Creating plan with data:', {
      topic,
      groupSize,
      zipCode,
      userName,
      cleanPhone,
      customEvents
    });

    // Call FastAPI backend
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const response = await fetch(`${apiBase}/api/plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: sanitizedData.topic,
        group_size: sanitizedData.groupSize,
        zip_code: cleanZipCode,
        host_name: cleanUserName,
        host_phone: cleanPhone,
        custom_events: customEvents || []
      }),
    });

    console.log('🔧 FastAPI response status:', response.status);

    if (!response.ok) {
      // Handle 502 Bad Gateway and other server errors
      if (response.status === 502) {
        console.log('🔧 Backend server is down (502 Bad Gateway)');
        return res.status(502).json({ 
          error: 'Backend server is temporarily unavailable',
          message: 'Please try again in a few minutes'
        });
      }
      
      // Try to parse error response, but handle empty responses
      try {
        const errorData = await response.json();
        console.log('🔧 FastAPI error:', errorData);
        return res.status(response.status).json(errorData);
      } catch (parseError) {
        console.log('🔧 Could not parse error response:', parseError);
        return res.status(response.status).json({ 
          error: 'Backend error',
          message: `Server returned ${response.status} status`
        });
      }
    }

    // Try to parse success response, but handle empty responses
    let data;
    try {
      data = await response.json();
      console.log('🔧 FastAPI success response:', data);
    } catch (parseError) {
      console.log('🔧 Could not parse success response:', parseError);
      return res.status(500).json({ 
        error: 'Invalid response from backend',
        message: 'Backend returned malformed data'
      });
    }

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
