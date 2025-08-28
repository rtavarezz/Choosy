import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      activityType, 
      eventName, 
      userName, 
      phoneNumber, 
      groupSize, 
      eventTime,
      eventDate 
    } = req.body;

    // Validate required fields
    if (!activityType || !eventName || !userName || !phoneNumber) {
      return res.status(400).json({ 
        error: 'Missing required fields: activityType, eventName, userName, phoneNumber' 
      });
    }

    // Call FastAPI backend
    const apiBase = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    const response = await fetch(`${apiBase}/api/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        activity_type: activityType,
        event_name: eventName,
        user_name: userName,
        phone_number: phoneNumber,
        group_size: groupSize || 'myself',
        event_time: eventTime || '7:00 PM',
        event_date: eventDate || new Date().toISOString().split('T')[0]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      reservation: data
    });

  } catch (error) {
    console.error('Reservation error:', error);
    return res.status(500).json({ 
      error: 'Failed to make reservation. Please try again.' 
    });
  }
} 