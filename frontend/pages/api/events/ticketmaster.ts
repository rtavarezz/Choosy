import type { NextApiRequest, NextApiResponse } from 'next';

interface TicketmasterEvent {
  id: string;
  name: string;
  url: string;
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
  dates: {
    start: {
      localDate: string;
      localTime: string;
    };
  };
  _embedded?: {
    venues?: Array<{
      name: string;
      distance?: number;
    }>;
  };
  classifications: Array<{
    segment: {
      name: string;
    };
  }>;
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
    // TODO: Add your Ticketmaster API key to environment variables
    // TICKETMASTER_API_KEY=your_api_key_here
    const apiKey = process.env.TICKETMASTER_API_KEY;
    
    if (!apiKey) {
      console.warn('Ticketmaster API key not found. Add TICKETMASTER_API_KEY to your environment variables.');
      return res.status(200).json([]);
    }

    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&postalCode=${zipcode}&radius=25&unit=miles&size=20&sort=date,asc`
    );

    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data._embedded?.events) {
      return res.status(200).json([]);
    }

    const events: Event[] = data._embedded.events.map((event: TicketmasterEvent) => {
      const image = event.images.find(img => img.width >= 400 && img.height >= 600)?.url || 
                   event.images[0]?.url || 
                   'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=600&fit=crop';
      
      const price = event.priceRanges?.[0] 
        ? `${event.priceRanges[0].currency}${event.priceRanges[0].min}-${event.priceRanges[0].max}`
        : 'TBD';
      
      const distance = event._embedded?.venues?.[0]?.distance 
        ? `${Math.round(event._embedded.venues[0].distance)} mi`
        : 'Nearby';
      
      const category = event.classifications?.[0]?.segment?.name || 'Entertainment';

      return {
        id: event.id,
        title: event.name,
        description: `${category} event on ${event.dates.start.localDate}`,
        image,
        category,
        distance,
        price,
        rating: 4.0 + Math.random() * 1.0, // Mock rating since Ticketmaster doesn't provide this
        attendees: Math.floor(Math.random() * 50) + 5 // Mock attendee count
      };
    });

    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching Ticketmaster events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
} 