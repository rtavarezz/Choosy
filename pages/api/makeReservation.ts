import type { NextApiRequest, NextApiResponse } from 'next';

// Mock reservation providers for different activity types
const RESERVATION_PROVIDERS = {
  concerts: {
    name: 'TicketMaster',
    endpoint: 'https://api.ticketmaster.com/v2/events',
    requiresConfirmation: true
  },
  nightlife: {
    name: 'OpenTable',
    endpoint: 'https://api.opentable.com/v2/restaurants',
    requiresConfirmation: false
  },
  foodie: {
    name: 'OpenTable',
    endpoint: 'https://api.opentable.com/v2/restaurants',
    requiresConfirmation: false
  },
  datenight: {
    name: 'Resy',
    endpoint: 'https://api.resy.com/v4/reservations',
    requiresConfirmation: true
  },
  sports: {
    name: 'StubHub',
    endpoint: 'https://api.stubhub.com/v2/events',
    requiresConfirmation: true
  },
  parks: {
    name: 'Recreation.gov',
    endpoint: 'https://api.recreation.gov/api/v1/permits',
    requiresConfirmation: false
  },
  gokart: {
    name: 'GoKart Pro',
    endpoint: 'https://api.gokartpro.com/v1/bookings',
    requiresConfirmation: true
  },
  swimming: {
    name: 'PoolPass',
    endpoint: 'https://api.poolpass.com/v1/sessions',
    requiresConfirmation: false
  },
  drinks: {
    name: 'BarTab',
    endpoint: 'https://api.bartab.com/v1/reservations',
    requiresConfirmation: false
  }
};

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

    // Get provider info
    const provider = RESERVATION_PROVIDERS[activityType as keyof typeof RESERVATION_PROVIDERS];
    if (!provider) {
      return res.status(400).json({ error: 'Unsupported activity type' });
    }

    // Mock reservation process
    const reservationId = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const confirmationNumber = `CNF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Simulate API call to provider
    const mockReservation = {
      reservationId,
      confirmationNumber,
      provider: provider.name,
      eventName,
      userName,
      phoneNumber,
      groupSize: groupSize || 'solo',
      eventTime: eventTime || '7:00 PM',
      eventDate: eventDate || new Date().toISOString().split('T')[0],
      status: provider.requiresConfirmation ? 'pending' : 'confirmed',
      requiresConfirmation: provider.requiresConfirmation,
      message: provider.requiresConfirmation 
        ? `Reservation submitted to ${provider.name}. You'll receive a confirmation call within 15 minutes.`
        : `Reservation confirmed with ${provider.name}! Confirmation #${confirmationNumber}`
    };

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return res.status(200).json({
      success: true,
      reservation: mockReservation
    });

  } catch (error) {
    console.error('Reservation error:', error);
    return res.status(500).json({ 
      error: 'Failed to make reservation. Please try again.' 
    });
  }
} 