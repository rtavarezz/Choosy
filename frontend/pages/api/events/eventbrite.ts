import type { NextApiRequest, NextApiResponse } from 'next';

interface EventbriteEvent {
  id: string;
  name: {
    text: string;
  };
  description: {
    text: string;
  };
  url: string;
  start: {
    local: string;
  };
  end: {
    local: string;
  };
  logo?: {
    url: string;
  };
  category: {
    name: string;
  };
  venue?: {
    name: string;
    address: {
      localized_address_display: string;
    };
  };
  ticket_availability: {
    is_sold_out: boolean;
    minimum_ticket_price?: {
      display: string;
    };
  };
}

interface Event {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  distance: string;
  price: string;
  rating: number;
  attendees: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { zipcode } = req.query;

  if (!zipcode) {
    return res.status(400).json({ message: 'Zipcode is required' });
  }

  try {
    // TODO: Add your Eventbrite API key to environment variables
    // EVENTBRITE_API_KEY=your_api_key_here
    const apiKey = process.env.EVENTBRITE_API_KEY;
    
    if (!apiKey) {
      console.warn('Eventbrite API key not found. Add EVENTBRITE_API_KEY to your environment variables.');
      return res.status(200).json([]);
    }

    // First, we need to find the location ID for the zipcode
    // Eventbrite uses location IDs instead of zipcodes directly
    const locationResponse = await fetch(
      `https://www.eventbriteapi.com/v3/destinations/search/?q=${zipcode}&expand=destination`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!locationResponse.ok) {
      throw new Error(`Eventbrite location API error: ${locationResponse.status}`);
    }

    const locationData = await locationResponse.json();
    
    if (!locationData.destinations || locationData.destinations.length === 0) {
      return res.status(200).json([]);
    }

    const locationId = locationData.destinations[0].id;

    // Now fetch events for this location
    const eventsResponse = await fetch(
      `https://www.eventbriteapi.com/v3/events/search/?location.address=${zipcode}&expand=venue,category&start_date.range_start=${new Date().toISOString()}&start_date.range_end=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!eventsResponse.ok) {
      throw new Error(`Eventbrite events API error: ${eventsResponse.status}`);
    }

    const eventsData = await eventsResponse.json();
    
    if (!eventsData.events) {
      return res.status(200).json([]);
    }

    const events: Event[] = eventsData.events.map((event: EventbriteEvent) => {
      const image = event.logo?.url || 
                   'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=600&fit=crop';
      
      const price = event.ticket_availability.is_sold_out 
        ? 'Sold Out'
        : event.ticket_availability.minimum_ticket_price?.display || 'Free';
      
      const category = event.category?.name || 'Event';

      return {
        id: event.id,
        title: event.name.text,
        description: event.description.text.substring(0, 150) + (event.description.text.length > 150 ? '...' : ''),
        image,
        category,
        distance: 'Nearby', // Eventbrite doesn't provide distance in their API
        price,
        rating: 4.0 + Math.random() * 1.0, // Mock rating
        attendees: Math.floor(Math.random() * 100) + 10 // Mock attendee count
      };
    });

    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching Eventbrite events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
} 