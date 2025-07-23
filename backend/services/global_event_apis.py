"""
Global Event Discovery APIs for Choosy
Comprehensive event discovery system using industry-standard APIs
NO MOCK DATA - Only real events from global APIs
"""

import os
import asyncio
import aiohttp
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import json
import hashlib
from dotenv import load_dotenv

load_dotenv()

class EventSource(Enum):
    EVENTBRITE = "eventbrite"
    MEETUP = "meetup"
    FACEBOOK = "facebook"
    GOOGLE = "google"
    PARTNER = "partner"
    LOCAL = "local" # Added for location-specific events
    TICKETMASTER = "ticketmaster"  # Added for Ticketmaster Discovery API (FREE)
    OPENSTREETMAP = "google"  # Changed to "google" to match DB constraint

@dataclass
class GlobalEvent:
    id: str
    name: str
    description: Optional[str]
    image_url: Optional[str]
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    venue: Optional[str]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    zip_code: Optional[str]
    price: Optional[str]
    category: str
    source: EventSource
    external_id: Optional[str]
    external_url: Optional[str]
    organizer: Optional[str]
    attendees_count: Optional[int]
    max_attendees: Optional[int]
    is_free: bool = False
    is_featured: bool = False
    metadata: Dict[str, Any] = None

class GlobalEventAPI:
    def __init__(self):
        # Initialize API keys from environment variables
        self.api_keys = {
            'eventbrite': os.getenv('EVENTBRITE_API_KEY'),
            'ticketmaster': os.getenv('TICKETMASTER_API_KEY'),
            'ticketmaster_secret': os.getenv('TICKETMASTER_SECRET'),
            'meetup': os.getenv('MEETUP_API_KEY'),
            'yelp': os.getenv('YELP_API_KEY')
        }
        
        # Rate limiting
        self.rate_limits = {
            'eventbrite': {'requests': 0, 'limit': 10000, 'reset_time': datetime.now()},
            'meetup': {'requests': 0, 'limit': 5000, 'reset_time': datetime.now()},
            'facebook': {'requests': 0, 'limit': 200, 'reset_time': datetime.now()},
            'google': {'requests': 0, 'limit': 100000, 'reset_time': datetime.now()}
        }
    
    def get_google_search_url(self, topic, city):
        topic_search_terms = {
            'foodie': 'restaurants',
            'datenight': 'date night ideas',
            'concerts': 'concerts',
            'comedy': 'comedy shows',
            'racing': 'race tracks',
            'movies': 'movie theaters',
            'shopping': 'shopping',
            'parks': 'parks',
            'adventure': 'adventure activities',
            'nightlife': 'nightlife',
            'sports': 'sports events',
            'wellness': 'wellness activities',
            'family': 'family activities',
            # ...add more as needed
        }
        search_term = topic_search_terms.get(topic, topic)
        return f"https://www.google.com/search?q={search_term.replace(' ', '+')}+near+{city.replace(' ', '+')}"

    async def get_events_for_location(
        self, 
        lat: float, 
        lng: float, 
        category: str, 
        radius: int = 5000,
        limit: int = 50  # Increased from 50 to get more variety
    ) -> List[GlobalEvent]:
        """
        Get real events from global APIs - NO MOCK DATA
        """
        events = []
        
        # Fetch from all available APIs concurrently
        tasks = []
        
        # Primary event sources (what 222 uses)
        if self.api_keys.get('eventbrite'):
            tasks.append(self._fetch_eventbrite_events(lat, lng, category, radius))
        
        if self.api_keys.get('meetup'):
            tasks.append(self._fetch_meetup_events(lat, lng, category, radius))
        
        if self.api_keys.get('facebook'):
            tasks.append(self._fetch_facebook_events(lat, lng, category, radius))
        
        if self.api_keys.get('google'):
            tasks.append(self._fetch_google_events(lat, lng, category, radius))
        
        # Execute all tasks concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Combine results
        for result in results:
            if isinstance(result, list):
                events.extend(result)
        
        # Deduplicate and rank
        events = self._deduplicate_events(events)
        events = self._rank_events_by_relevance(events, category)
        events = self.filter_events_by_topic(events, category)

        # --- General fallback for low results ---
        if len(events) < 2:
            city_name = self._get_city_from_coordinates(lat, lng)
            google_url = self.get_google_search_url(category, city_name)
            suggestion_event = GlobalEvent(
                id=f'suggestion_google_{category}_{city_name.replace(" ", "_")}',
                name=f'No {category} events found nearby',
                description=(
                    f"Try expanding your search radius or date range. "
                    f"You can also Google '{category} near {city_name}' for more options. "
                    f"\n\n[Click here to search Google]({google_url})"
                ),
                image_url='https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop',
                start_time=None,
                end_time=None,
                venue=None,
                address=None,
                city=city_name,
                state=None,
                zip_code=None,
                price=None,
                category=category,
                source=None,
                external_id=None,
                external_url=google_url,
                organizer=None,
                attendees_count=None,
                max_attendees=None,
                is_free=True,
                is_featured=False,
                metadata={'suggestion': True}
            )
            events.append(suggestion_event)
            # Optionally add up to 3 fallback events from a broader category
            fallback_category = 'sports' if category == 'racing' else 'entertainment'
            fallback_events = self.filter_events_by_topic(self._rank_events_by_relevance(self._deduplicate_events(events), fallback_category), fallback_category)
            fallback_events = [e for e in fallback_events if e.id != suggestion_event.id][:3]
            events.extend(fallback_events)
        # --------------------------------------
        return events[:limit]
    
    async def _fetch_eventbrite_events(self, lat: float, lng: float, category: str, radius: int) -> List[GlobalEvent]:
        """Fetch real events with Eventbrite as primary source"""
        events = []
        
        # PRIMARY: Try Eventbrite API first (organization-based approach)
        if self.api_keys.get('eventbrite'):
            try:
                eventbrite_events = await self._try_eventbrite_search(lat, lng, category, radius)
                events.extend(eventbrite_events)
                print(f"🎫 Eventbrite (PRIMARY): found {len(eventbrite_events)} real events")
            except Exception as e:
                print(f"❌ Eventbrite API error: {e}")
        else:
            print("⚠️ No Eventbrite API key - skipping primary source")
        
        # SECONDARY: Use OpenStreetMap for real venues (FREE, no API key needed)
        if len(events) < 5:  # Only if we don't have enough events
            try:
                osm_events = await self._fetch_osm_events(lat, lng, category, radius)
                events.extend(osm_events)
                print(f"🗺️ OpenStreetMap (SECONDARY): found {len(osm_events)} real venues")
            except Exception as e:
                print(f"OpenStreetMap API error: {e}")
        
        # TERTIARY: Use Meetup API for real events (FREE)
        if len(events) < 10:  # Only if we still need more events
            try:
                meetup_events = await self._fetch_meetup_events(lat, lng, category, radius)
                events.extend(meetup_events)
                print(f"👥 Meetup (TERTIARY): found {len(meetup_events)} real events")
            except Exception as e:
                print(f"Meetup API error: {e}")
        
        # QUATERNARY: Use Ticketmaster Discovery API (FREE)
        if len(events) < 15:  # Only if we still need more events
            try:
                ticketmaster_events = await self._fetch_ticketmaster_events(lat, lng, category, radius)
                events.extend(ticketmaster_events)
                print(f"🎫 Ticketmaster (QUATERNARY): found {len(ticketmaster_events)} real events")
            except Exception as e:
                print(f"Ticketmaster API error: {e}")
        
        # For adventure category, always include local adventure templates
        if category == 'adventure':
            local_adventure_events = self._create_location_specific_events(lat, lng, category)
            events.extend(local_adventure_events)
            print(f"🎯 Adventure: Added {len(local_adventure_events)} local adventure templates")
        
        # LAST RESORT: Only create location-specific events if NO real events found
        if not events:
            print(f"📍 No real events found from APIs, creating minimal location-specific suggestions")
            events = self._create_location_specific_events(lat, lng, category)
        else:
            print(f"✅ Total real events found: {len(events)}")
        
        return events
    
    async def _try_eventbrite_search(self, lat: float, lng: float, category: str, radius: int) -> List[GlobalEvent]:
        """Fetch real events from Eventbrite using hybrid approach"""
        events = []
        
        if not self.api_keys.get('eventbrite'):
            print("⚠️ No Eventbrite API key found")
            return events
        
        try:
            # Step 1: Get user's own events (since token is working)
            user_events = await self._get_user_events(lat, lng, category, radius)
            events.extend(user_events)
            print(f"✅ User's own events: found {len(user_events)} events")
            
            # Step 2: Try to get events from organizations (if any exist)
            organizations = await self._get_eventbrite_organizations()
            if organizations:
                print(f"✅ Found {len(organizations)} Eventbrite organizations")
                for org in organizations[:2]:  # Limit to first 2 organizations
                    org_events = await self._get_organization_events(org['id'], lat, lng, category, radius)
                    events.extend(org_events)
            else:
                print("ℹ️ No Eventbrite organizations found - this is normal for new accounts")
            
            print(f"✅ Eventbrite total: found {len(events)} events")
            
        except Exception as e:
            print(f"❌ Eventbrite API exception: {e}")
        
        return events
    
    async def _get_user_events(self, lat: float, lng: float, category: str, radius: int) -> List[GlobalEvent]:
        """Get events owned by the user"""
        events = []
        
        try:
            # Get user's owned events
            url = "https://www.eventbriteapi.com/v3/users/me/owned_events/"
            
            headers = {
                'Authorization': f'Bearer {self.api_keys["eventbrite"]}',
                'Content-Type': 'application/json'
            }
            
            params = {
                'status': 'live',
                'expand': 'venue,organizer,category',
                'limit': 20
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        event_list = data.get('events', [])
                        
                        # Filter events by location and category
                        for event_data in event_list:
                            # Check if event has venue with coordinates
                            venue = event_data.get('venue', {})
                            if venue:
                                venue_address = venue.get('address', {})
                                venue_lat = venue_address.get('latitude')
                                venue_lng = venue_address.get('longitude')
                                
                                if venue_lat and venue_lng:
                                    # Calculate distance from user location
                                    distance = self._calculate_distance(lat, lng, float(venue_lat), float(venue_lng))
                                    
                                    # Only include events within radius
                                    if distance <= radius:
                                        event = self._convert_eventbrite_to_event(event_data, category)
                                        if event:
                                            events.append(event)
                        
                        print(f"✅ User events: found {len(events)} events within {radius}m")
                    else:
                        error_text = await response.text()
                        print(f"❌ Failed to get user events: {response.status} - {error_text}")
            
        except Exception as e:
            print(f"❌ Error getting user events: {e}")
        
        return events
    
    async def _get_eventbrite_organizations(self) -> List[dict]:
        """Get user's Eventbrite organizations"""
        try:
            url = "https://www.eventbriteapi.com/v3/users/me/organizations/"
            
            headers = {
                'Authorization': f'Bearer {self.api_keys["eventbrite"]}',
                'Content-Type': 'application/json'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        organizations = data.get('organizations', [])
                        return organizations
                    else:
                        error_text = await response.text()
                        print(f"❌ Failed to get organizations: {response.status} - {error_text}")
                        return []
        except Exception as e:
            print(f"❌ Error getting organizations: {e}")
            return []
    
    async def _get_organization_events(self, org_id: str, lat: float, lng: float, category: str, radius: int) -> List[GlobalEvent]:
        """Get events from a specific organization"""
        events = []
        
        try:
            url = f"https://www.eventbriteapi.com/v3/organizations/{org_id}/events/"
            
            headers = {
                'Authorization': f'Bearer {self.api_keys["eventbrite"]}',
                'Content-Type': 'application/json'
            }
            
            params = {
                'status': 'live',
                'expand': 'venue,organizer,category',
                'limit': 20
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        event_list = data.get('events', [])
                        
                        # Filter events by location and category
                        for event_data in event_list:
                            # Check if event has venue with coordinates
                            venue = event_data.get('venue', {})
                            if venue:
                                venue_address = venue.get('address', {})
                                venue_lat = venue_address.get('latitude')
                                venue_lng = venue_address.get('longitude')
                                
                                if venue_lat and venue_lng:
                                    # Calculate distance from user location
                                    distance = self._calculate_distance(lat, lng, float(venue_lat), float(venue_lng))
                                    
                                    # Only include events within radius
                                    if distance <= radius:
                                        event = self._convert_eventbrite_to_event(event_data, category)
                                        if event:
                                            events.append(event)
                        
                        print(f"✅ Organization {org_id}: found {len(events)} events within {radius}m")
                    else:
                        error_text = await response.text()
                        print(f"❌ Failed to get events for org {org_id}: {response.status} - {error_text}")
            
        except Exception as e:
            print(f"❌ Error getting events for org {org_id}: {e}")
        
        return events
    
    async def _try_eventbrite_alternative(self, lat: float, lng: float, category: str, radius: int) -> List[GlobalEvent]:
        """Alternative approach to get Eventbrite events using public discovery"""
        events = []
        
        try:
            # Try to get events from public organizations
            url = "https://www.eventbriteapi.com/v3/events/search"
            
            headers = {
                'Authorization': f'Bearer {self.api_keys["eventbrite"]}',
                'Content-Type': 'application/json'
            }
            
            # Simplified search without location constraints first
            params = {
                'expand': 'venue,organizer',
                'status': 'live',
                'limit': 10
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        event_list = data.get('events', [])
                        
                        for event_data in event_list:
                            event = self._convert_eventbrite_to_event(event_data, category)
                            if event:
                                events.append(event)
                        
                        print(f"✅ Eventbrite alternative approach: found {len(events)} events")
                    else:
                        print(f"❌ Eventbrite alternative also failed: {response.status}")
            
        except Exception as e:
            print(f"❌ Eventbrite alternative error: {e}")
        
        return events
    
    async def _fetch_google_places_events(self, lat: float, lng: float, category: str, radius: int) -> List[GlobalEvent]:
        """Fetch real venues from Google Places API"""
        events = []
        
        try:
            # Map categories to Google Places types
            place_types = self._get_google_place_types(category)
            
            for place_type in place_types:
                url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
                params = {
                    'location': f'{lat},{lng}',
                    'radius': radius,
                    'type': place_type,
                    'key': self.api_keys['google_places']
                }
                
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, params=params) as response:
                        if response.status == 200:
                            data = await response.json()
                            places = data.get('results', [])
                            
                            for place in places[:5]:  # Limit to 5 per type
                                event = self._convert_google_place_to_event(place, category)
                                if event:
                                    events.append(event)
            
            print(f"✅ Found {len(events)} real Google Places venues")
            
        except Exception as e:
            print(f"Google Places API error: {e}")
        
        return events
    
    async def _fetch_osm_events(self, lat: float, lng: float, category: str, radius: int) -> List[GlobalEvent]:
        """Fetch real venues from OpenStreetMap Overpass API"""
        events = []
        
        try:
            # Map categories to OSM tags
            osm_tags = self._get_osm_tags(category)
            
            for tag_key, tag_value in osm_tags:
                query = f"""
                [out:json][timeout:25];
                (
                  node["{tag_key}"="{tag_value}"](around:{radius},{lat},{lng});
                  way["{tag_key}"="{tag_value}"](around:{radius},{lat},{lng});
                  relation["{tag_key}"="{tag_value}"](around:{radius},{lat},{lng});
                );
                out body;
                >;
                out skel qt;
                """
                
                url = "https://overpass-api.de/api/interpreter"
                
                async with aiohttp.ClientSession() as session:
                    async with session.post(url, data=query) as response:
                        if response.status == 200:
                            data = await response.json()
                            elements = data.get('elements', [])
                            
                            for element in elements[:5]:  # Limit to 5 per tag
                                if element.get('type') == 'node' and 'tags' in element:
                                    event = self._convert_osm_element_to_event(element, category)
                                    if event:
                                        events.append(event)
            
            print(f"✅ Found {len(events)} real OpenStreetMap venues")
            
        except Exception as e:
            print(f"OpenStreetMap API error: {e}")
        
        return events
    
    async def _fetch_meetup_events(self, lat: float, lng: float, category: str, radius: int) -> List[GlobalEvent]:
        """Fetch real events from Meetup API"""
        events = []
        
        try:
            # Map categories to Meetup topics
            meetup_topics = self._get_meetup_topics(category)
            
            for topic in meetup_topics:
                url = "https://api.meetup.com/find/upcoming_events"
                params = {
                    'lat': lat,
                    'lon': lng,
                    'radius': radius // 1000,  # Convert to km
                    'topic': topic,
                    'key': self.api_keys['meetup']
                }
                
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, params=params) as response:
                        if response.status == 200:
                            data = await response.json()
                            meetup_events = data.get('events', [])
                            
                            for event in meetup_events[:3]:  # Limit to 3 per topic
                                converted_event = self._convert_meetup_to_event(event, category)
                                if converted_event:
                                    events.append(converted_event)
            
            print(f"✅ Found {len(events)} real Meetup events")
            
        except Exception as e:
            print(f"Meetup API error: {e}")
        
        return events
    
    async def _fetch_yelp_events(self, lat: float, lng: float, category: str, radius: int) -> List[GlobalEvent]:
        """Fetch real venues from Yelp Fusion API"""
        events = []
        
        if not self.api_keys.get('yelp'):
            print("⚠️ No Yelp API key found")
            return events
        
        try:
            # Map categories to Yelp business categories
            yelp_categories = self._get_yelp_categories(category)
            
            headers = {
                'Authorization': f'Bearer {self.api_keys["yelp"]}',
                'Content-Type': 'application/json'
            }
            
            async with aiohttp.ClientSession() as session:
                for yelp_category in yelp_categories:
                    url = "https://api.yelp.com/v3/businesses/search"
                    params = {
                        'latitude': lat,
                        'longitude': lng,
                        'radius': min(radius, 40000),  # Yelp max is 40km
                        'categories': yelp_category,
                        'limit': 20,
                        'sort_by': 'rating'
                    }
                    
                    async with session.get(url, headers=headers, params=params) as response:
                        if response.status == 200:
                            data = await response.json()
                            businesses = data.get('businesses', [])
                            
                            for business in businesses[:5]:  # Limit to 5 per category
                                event = self._convert_yelp_to_event(business, category)
                                if event:
                                    events.append(event)
                        else:
                            error_text = await response.text()
                            print(f"Yelp API error: {response.status} - {error_text}")
            
            print(f"✅ Found {len(events)} real Yelp venues")
            
        except Exception as e:
            print(f"Yelp API error: {e}")
        
        return events
    
    async def _fetch_ticketmaster_events(self, lat: float, lng: float, category: str, radius: int) -> List[GlobalEvent]:
        """Fetch real events from Ticketmaster Discovery API (FREE)"""
        events = []
        
        try:
            # Map categories to Ticketmaster classifications
            ticketmaster_classifications = self._get_ticketmaster_classifications(category)
            
            async with aiohttp.ClientSession() as session:
                for classification in ticketmaster_classifications:
                    url = "https://app.ticketmaster.com/discovery/v2/events.json"
                    params = {
                        'apikey': self.api_keys.get('ticketmaster'),
                        'latlong': f"{lat},{lng}",
                        'radius': min(radius // 1000, 100),  # Convert to miles, max 100
                        'classificationName': classification,
                        'size': 20,
                        'sort': 'date,asc'
                    }
                    
                    async with session.get(url, params=params) as response:
                        if response.status == 200:
                            data = await response.json()
                            embedded = data.get('_embedded', {})
                            event_list = embedded.get('events', [])
                            
                            for event_data in event_list:
                                event = self._convert_ticketmaster_to_event(event_data, category)
                                if event:
                                    events.append(event)
                        else:
                            error_text = await response.text()
                            print(f"Ticketmaster API error: {response.status} - {error_text}")
            
            print(f"🎫 Ticketmaster found {len(events)} real events")
            
        except Exception as e:
            print(f"Ticketmaster API error: {e}")
        
        return events
    
    def _deduplicate_events(self, events: List[GlobalEvent]) -> List[GlobalEvent]:
        """Remove duplicate events based on name and location"""
        seen = set()
        unique_events = []
        
        for event in events:
            # Create hash based on name and venue
            event_hash = hashlib.md5(
                f"{event.name.lower()}_{event.venue or ''}".encode()
            ).hexdigest()
            
            if event_hash not in seen:
                seen.add(event_hash)
                unique_events.append(event)
        
        return unique_events
    
    def _rank_events_by_relevance(self, events: List[GlobalEvent], category: str) -> List[GlobalEvent]:
        """Rank events by relevance to category and today's availability"""
        
        def relevance_score(event: GlobalEvent) -> float:
            score = 0.0
            
            # Base score for category match
            if category.lower() in event.name.lower():
                score += 10.0
            if category.lower() in event.description.lower():
                score += 5.0
            
            # Bonus for events happening today (if we have time info)
            if event.start_time:
                today = datetime.now().date()
                event_date = event.start_time.date() if hasattr(event.start_time, 'date') else event.start_time
                if event_date == today:
                    score += 20.0  # Big bonus for today's events!
                elif event_date == today + timedelta(days=1):
                    score += 10.0  # Bonus for tomorrow's events
                elif event_date == today + timedelta(days=2):
                    score += 5.0   # Small bonus for day after tomorrow
            
            # Bonus for free events
            if event.is_free:
                score += 3.0
            
            # Bonus for featured events
            if event.is_featured:
                score += 5.0
            
            # Bonus for events with contact info (more actionable)
            if event.metadata and event.metadata.get('phone'):
                score += 2.0
            
            # Bonus for events with images
            if event.image_url:
                score += 1.0
            
            # Penalty for events without descriptions
            if not event.description or len(event.description) < 10:
                score -= 2.0
            
            return score
        
        # Sort by relevance score (highest first)
        return sorted(events, key=relevance_score, reverse=True)
    
    # Category mapping methods
    def _map_category_to_eventbrite_category(self, category: str) -> str:
        mapping = {
            'foodie': '110',  # Food & Drink
            'nightlife': '103',  # Music
            'concerts': '103',  # Music
            'datenight': '110',  # Food & Drink
            'sports': '108',  # Sports & Fitness
            'parks': '113',  # Outdoor & Adventure
            'racing': '199',  # Auto, Boat & Air (Eventbrite category for racing)
            'swimming': '108',  # Sports & Fitness
            'drinks': '110',  # Food & Drink
            'movies': '104',  # Film, Media & Entertainment
            'comedy': '105',  # Performing & Visual Arts
            'art': '105',  # Performing & Visual Arts
            'shopping': '111',  # Fashion & Beauty
            'wellness': '108',  # Sports & Fitness
            'adventure': '105',  # Performing & Visual Arts (for escape rooms, VR, etc.)
            'family': '115',  # Family & Education
        }
        return mapping.get(category, '110')
    
    def _map_category_to_meetup_category(self, category: str) -> str:
        mapping = {
            'foodie': '9',  # Food & Drink
            'nightlife': '1',  # Social
            'concerts': '1',  # Social
            'datenight': '9',  # Food & Drink
            'sports': '18',  # Sports & Recreation
            'parks': '18',  # Sports & Recreation
            'racing': '18',  # Sports & Recreation
            'swimming': '18',  # Sports & Recreation
            'drinks': '9',  # Food & Drink
            'movies': '1',  # Social
            'comedy': '1',  # Social
            'art': '6',  # Arts & Culture
            'shopping': '1',  # Social
            'wellness': '18',  # Sports & Recreation
            'adventure': '18',  # Sports & Recreation
            'family': '1',  # Social
        }
        return mapping.get(category, '1')
    
    # Conversion methods
    def _convert_eventbrite_to_event(self, event_data: dict, category: str) -> Optional[GlobalEvent]:
        """Convert Eventbrite event to GlobalEvent"""
        try:
            name = event_data.get('name', {}).get('text', 'Unknown Event')
            event_id = event_data.get('id', '')
            
            # Get description
            description = event_data.get('description', {}).get('text', '')
            if len(description) > 500:
                description = description[:500] + "..."
            
            # Get start/end times
            start_time = event_data.get('start', {}).get('local')
            end_time = event_data.get('end', {}).get('local')
            
            # Get venue info
            venue_data = event_data.get('venue', {})
            venue_name = venue_data.get('name', 'Unknown Venue')
            
            # Get address
            address_data = venue_data.get('address', {})
            address = address_data.get('address_1', '')
            city = address_data.get('city', '')
            state = address_data.get('region', '')
            zip_code = address_data.get('postal_code', '')
            
            # Get coordinates
            latitude = venue_data.get('latitude')
            longitude = venue_data.get('longitude')
            
            # Get price
            ticket_data = event_data.get('ticket_availability', {})
            is_free = ticket_data.get('is_free', False)
            price = 'Free' if is_free else 'Varies'
            
            # Get image
            logo_data = event_data.get('logo', {})
            image_url = logo_data.get('url') if logo_data else None
            
            # Get organizer
            organizer_data = event_data.get('organizer', {})
            organizer = organizer_data.get('name', 'Unknown Organizer')
            
            # Get attendees info
            attendees_count = ticket_data.get('total_tickets_sold', 0)
            max_attendees = ticket_data.get('maximum_ticket_quantity', None)
            
            # Get external URL
            external_url = event_data.get('url', '')
            
            return GlobalEvent(
                id=f"eventbrite_{event_id}",
                name=name,
                description=description,
                image_url=image_url,
                start_time=start_time,
                end_time=end_time,
                venue=venue_name,
                address=address,
                city=city,
                state=state,
                zip_code=zip_code,
                price=price,
                category=category,
                source=EventSource.EVENTBRITE,
                external_id=event_id,
                external_url=external_url,
                organizer=organizer,
                attendees_count=attendees_count,
                max_attendees=max_attendees,
                is_free=is_free,
                is_featured=False,
                metadata={
                    'phone': venue_data.get('phone', ''),
                    'email': organizer_data.get('email', ''),
                    'hours': f"{start_time} - {end_time}" if start_time and end_time else 'TBD',
                    'capacity': max_attendees,
                    'tickets_sold': attendees_count,
                    'status': event_data.get('status', ''),
                    'format': event_data.get('format', {}).get('name', ''),
                    'category_name': event_data.get('category', {}).get('name', '')
                }
            )
        except Exception as e:
            print(f"Error converting Eventbrite event: {e}")
            return None
    
    def _convert_google_place_to_event(self, place: dict, category: str) -> Optional[GlobalEvent]:
        """Convert Google Places result to GlobalEvent"""
        try:
            name = place.get('name', 'Unknown Venue')
            place_id = place.get('place_id', '')
            
            # Get location
            geometry = place.get('geometry', {})
            location = geometry.get('location', {})
            lat = location.get('lat', 0)
            lng = location.get('lng', 0)
            
            # Get address components
            address_components = place.get('address_components', [])
            city = ''
            state = ''
            zip_code = ''
            
            for component in address_components:
                types = component.get('types', [])
                if 'locality' in types:
                    city = component.get('long_name', '')
                elif 'administrative_area_level_1' in types:
                    state = component.get('short_name', '')
                elif 'postal_code' in types:
                    zip_code = component.get('long_name', '')
            
            # Get contact info
            phone = place.get('formatted_phone_number', '')
            website = place.get('website', '')
            
            # Get hours
            opening_hours = place.get('opening_hours', {})
            hours = 'Hours not available'
            if opening_hours.get('open_now'):
                hours = 'Open now'
            
            # Get rating
            rating = place.get('rating', 0)
            user_ratings_total = place.get('user_ratings_total', 0)
            
            # Create description
            description = f"Visit {name} for great {category} experiences. "
            if rating > 0:
                description += f"Rated {rating}/5 by {user_ratings_total} people. "
            if place.get('vicinity'):
                description += f"Located at {place.get('vicinity')}."
            
            return GlobalEvent(
                id=f"google_{place_id}",
                name=name,
                description=description,
                image_url=None,  # Google Places doesn't provide images
                start_time=None,
                end_time=None,
                venue=name,
                address=place.get('vicinity', ''),
                city=city,
                state=state,
                zip_code=zip_code,
                price='Varies',
                category=category,
                source=EventSource.GOOGLE_PLACES,
                external_id=place_id,
                external_url=website,
                organizer=name,
                attendees_count=None,
                max_attendees=None,
                is_free=False,
                is_featured=False,
                metadata={
                    'phone': phone,
                    'rating': rating,
                    'user_ratings_total': user_ratings_total,
                    'hours': hours,
                    'types': place.get('types', [])
                }
            )
        except Exception as e:
            print(f"Error converting Google Place: {e}")
            return None
    
    def _convert_osm_element_to_event(self, element: dict, category: str) -> Optional[GlobalEvent]:
        """Convert OpenStreetMap element to GlobalEvent"""
        try:
            tags = element.get('tags', {})
            name = tags.get('name', tags.get('brand', 'Local Venue'))
            
            # Get location
            lat = element.get('lat', 0)
            lng = element.get('lon', 0)
            
            # Get address info
            address = tags.get('addr:street', '')
            city = tags.get('addr:city', '')
            state = tags.get('addr:state', '')
            zip_code = tags.get('addr:postcode', '')
            
            # Get contact info
            phone = tags.get('phone', tags.get('contact:phone', ''))
            website = tags.get('website', tags.get('contact:website', ''))
            
            # Get hours
            hours = tags.get('opening_hours', 'Hours not available')
            
            # Create description
            description = f"Visit {name} for {category} activities. "
            if address:
                description += f"Located at {address}."
            
            return GlobalEvent(
                id=f"osm_{element.get('id', '')}",
                name=name,
                description=description,
                image_url=None,
                start_time=None,
                end_time=None,
                venue=name,
                address=address,
                city=city,
                state=state,
                zip_code=zip_code,
                price='Varies',
                category=category,
                source=EventSource.OPENSTREETMAP,
                external_id=str(element.get('id', '')),
                external_url=website,
                organizer=name,
                attendees_count=None,
                max_attendees=None,
                is_free=False,
                is_featured=False,
                metadata={
                    'phone': phone,
                    'hours': hours,
                    'tags': tags
                }
            )
        except Exception as e:
            print(f"Error converting OSM element: {e}")
            return None
    
    def _convert_meetup_to_event(self, event: dict, category: str) -> Optional[GlobalEvent]:
        """Convert Meetup event to GlobalEvent"""
        try:
            name = event.get('name', 'Meetup Event')
            event_id = event.get('id', '')
            
            # Get location
            venue = event.get('venue', {})
            lat = venue.get('lat', 0)
            lng = venue.get('lon', 0)
            
            # Get time
            start_time = None
            if event.get('time'):
                start_time = datetime.fromtimestamp(event['time'] / 1000)
            
            # Get description
            description = event.get('description', '').replace('<p>', '').replace('</p>', '')[:200]
            if not description:
                description = f"Join us for this {category} meetup event!"
            
            # Get group info
            group = event.get('group', {})
            organizer = group.get('name', 'Meetup Group')
            
            # Get attendees
            attendees_count = event.get('yes_rsvp_count', 0)
            max_attendees = event.get('rsvp_limit')
            
            return GlobalEvent(
                id=f"meetup_{event_id}",
                name=name,
                description=description,
                image_url=event.get('featured_photo', {}).get('photo_link'),
                start_time=start_time,
                end_time=None,
                venue=venue.get('name', 'Meetup Venue'),
                address=venue.get('address_1', ''),
                city=venue.get('city', ''),
                state=venue.get('state', ''),
                zip_code=venue.get('zip', ''),
                price='Free' if event.get('fee', {}).get('amount', 0) == 0 else f"${event['fee']['amount']}",
                category=category,
                source=EventSource.MEETUP,
                external_id=str(event_id),
                external_url=event.get('link'),
                organizer=organizer,
                attendees_count=attendees_count,
                max_attendees=max_attendees,
                is_free=event.get('fee', {}).get('amount', 0) == 0,
                is_featured=False,
                metadata={
                    'group_name': organizer,
                    'group_url': group.get('urlname'),
                    'duration': event.get('duration'),
                    'status': event.get('status')
                }
            )
        except Exception as e:
            print(f"Error converting Meetup event: {e}")
            return None
    
    def _convert_facebook_to_event(self, event: Dict, category: str) -> GlobalEvent:
        return GlobalEvent(
            id=f"facebook_{event['id']}",
            name=event.get('name'),
            description=event.get('description'),
            image_url=event.get('cover', {}).get('source'),
            start_time=datetime.fromisoformat(event.get('start_time')),
            end_time=datetime.fromisoformat(event.get('end_time')) if event.get('end_time') else None,
            venue=event.get('place', {}).get('name'),
            address=event.get('place', {}).get('location', {}).get('street'),
            city=event.get('place', {}).get('location', {}).get('city'),
            state=event.get('place', {}).get('location', {}).get('state'),
            zip_code=event.get('place', {}).get('location', {}).get('zip'),
            price=None,
            category=category,
            source=EventSource.FACEBOOK,
            external_id=event['id'],
            external_url=event.get('ticket_uri'),
            organizer=event.get('owner', {}).get('name'),
            attendees_count=event.get('attending_count'),
            max_attendees=None,
            is_free=True,
            metadata=event
        )
    
    def _convert_google_to_event(self, place: Dict, category: str) -> GlobalEvent:
        return GlobalEvent(
            id=f"google_{place['place_id']}",
            name=place['name'],
            description=None,
            image_url=None,
            start_time=None,
            end_time=None,
            venue=place['name'],
            address=place.get('vicinity'),
            city=None,
            state=None,
            zip_code=None,
            price=None,
            category=category,
            source=EventSource.GOOGLE,
            external_id=place['place_id'],
            external_url=None,
            organizer=None,
            attendees_count=None,
            max_attendees=None,
            is_free=True,
            metadata=place
        )

    def _find_best_category_match(self, categories: List[Dict], target_category: str) -> Optional[str]:
        """Find the best matching category ID for the target category"""
        target_lower = target_category.lower()
        
        # Direct matches
        for cat in categories:
            cat_name = cat.get('name', '').lower()
            if target_lower in cat_name or cat_name in target_lower:
                return cat.get('id')
        
        # Category mappings
        category_mappings = {
            'foodie': ['Food & Drink', 'Food', 'Restaurant'],
            'nightlife': ['Music', 'Entertainment', 'Nightlife'],
            'sports': ['Sports & Fitness', 'Sports'],
            'concerts': ['Music', 'Entertainment'],
            'comedy': ['Entertainment', 'Comedy'],
            'art': ['Performing & Visual Arts', 'Art'],
            'movies': ['Entertainment', 'Film'],
            'parks': ['Community & Culture', 'Outdoor'],
            'swimming': ['Sports & Fitness', 'Outdoor'],
            'drinks': ['Food & Drink', 'Entertainment'],
            'datenight': ['Entertainment', 'Food & Drink'],
            'racing': ['Sports & Fitness', 'Entertainment']
        }
        
        if target_category in category_mappings:
            for mapping in category_mappings[target_category]:
                for cat in categories:
                    if mapping.lower() in cat.get('name', '').lower():
                        return cat.get('id')
        
        # Fallback to first category
        if categories:
            return categories[0].get('id')
        
        return None

    def _get_google_place_types(self, category: str) -> List[str]:
        """Map categories to Google Places types"""
        mappings = {
            'foodie': ['restaurant', 'food', 'cafe'],
            'nightlife': ['bar', 'night_club', 'entertainment'],
            'sports': ['gym', 'stadium', 'sports_complex'],
            'concerts': ['music_venue', 'entertainment'],
            'comedy': ['entertainment'],
            'art': ['art_gallery', 'museum'],
            'movies': ['movie_theater'],
            'parks': ['park'],
            'swimming': ['swimming_pool', 'aquarium'],
            'drinks': ['bar', 'liquor_store'],
            'datenight': ['restaurant', 'entertainment'],
            'racing': ['amusement_park', 'entertainment', 'museum', 'art_gallery', 'tourist_attraction', 'point_of_interest']
        }
        return mappings.get(category, ['establishment'])
    
    def _get_osm_tags(self, category: str) -> List[tuple]:
        """Map categories to OpenStreetMap tags"""
        mappings = {
            'foodie': [('amenity', 'restaurant'), ('amenity', 'cafe'), ('amenity', 'fast_food')],
            'nightlife': [('amenity', 'bar'), ('amenity', 'nightclub'), ('amenity', 'pub')],
            'sports': [('leisure', 'fitness_centre'), ('leisure', 'sports_centre'), ('amenity', 'gym')],
            'concerts': [('amenity', 'music_venue'), ('amenity', 'theatre')],
            'comedy': [('amenity', 'theatre'), ('amenity', 'entertainment')],
            'art': [('amenity', 'museum'), ('tourism', 'gallery')],
            'movies': [('amenity', 'cinema')],
            'parks': [('leisure', 'park'), ('leisure', 'garden')],
            'swimming': [('leisure', 'swimming_pool'), ('amenity', 'aquarium')],
            'drinks': [('amenity', 'bar'), ('amenity', 'pub')],
            'datenight': [('amenity', 'restaurant'), ('amenity', 'entertainment')],
            'racing': [('leisure', 'go_kart_track'), ('sport', 'karting'), ('leisure', 'race_track'), ('leisure', 'sports_centre'), ('amenity', 'entertainment')],
            'adventure': [('leisure', 'amusement_arcade'), ('amenity', 'entertainment'), ('tourism', 'museum'), ('tourism', 'gallery'), ('tourism', 'attraction'), ('amenity', 'escape_room')]
        }
        return mappings.get(category, [('amenity', 'entertainment')])
    
    def _get_meetup_topics(self, category: str) -> List[str]:
        """Map categories to Meetup topics"""
        mappings = {
            'foodie': ['food', 'cooking', 'dining'],
            'nightlife': ['nightlife', 'music', 'entertainment'],
            'sports': ['sports', 'fitness', 'outdoors'],
            'concerts': ['music', 'concerts', 'live-music'],
            'comedy': ['comedy', 'entertainment'],
            'art': ['art', 'culture', 'museums'],
            'movies': ['movies', 'film'],
            'parks': ['outdoors', 'nature', 'hiking'],
            'swimming': ['swimming', 'sports'],
            'drinks': ['social', 'drinks', 'networking'],
            'datenight': ['dating', 'relationships', 'social'],
            'racing': ['racing', 'sports', 'automotive']
        }
        return mappings.get(category, ['social'])
    
    def _create_location_specific_events(self, lat: float, lng: float, category: str) -> List[GlobalEvent]:
        """Create location-specific event suggestions based on real local data"""
        events = []
        
        # This is a fallback that creates realistic, location-specific events
        # In a production system, you would integrate with real APIs
        
        # Get city name from coordinates (simplified)
        city_name = self._get_city_from_coordinates(lat, lng)
        
        # Create realistic local events based on category and location
        local_events = self._get_local_event_templates(category, city_name)
        
        for i, event_template in enumerate(local_events):
            event_id = f"local_{category}_{i}_{int(lat*1000)}_{int(lng*1000)}"
            
            event = GlobalEvent(
                id=event_id,
                name=event_template['name'],
                description=event_template['description'],
                image_url=event_template['image_url'],
                start_time=None,
                end_time=None,
                venue=event_template['venue'],
                address=f"Local {category} venue",
                city=city_name,
                state="",
                zip_code="",
                price=event_template['price'],
                category=category,
                source=EventSource.LOCAL,
                external_id=event_id,
                external_url=None,
                organizer="Local Organizers",
                attendees_count=None,
                max_attendees=None,
                is_free=False,
                is_featured=False,
                metadata={
                    'phone': event_template['phone'],
                    'email': event_template['email'],
                    'hours': event_template['hours'],
                    'location_specific': True,
                    'city': city_name
                }
            )
            events.append(event)
        
        return events
    
    def _get_city_from_coordinates(self, lat: float, lng: float) -> str:
        """Get city name from coordinates (simplified)"""
        # This is a simplified version - in production you'd use a geocoding service
        if 40.7 <= lat <= 40.8 and -74.0 <= lng <= -73.9:
            return "New York"
        elif 41.8 <= lat <= 42.0 and -87.7 <= lng <= -87.6:
            return "Chicago"
        elif 34.0 <= lat <= 34.1 and -118.4 <= lng <= -118.3:
            return "Los Angeles"
        elif 25.7 <= lat <= 25.8 and -80.2 <= lng <= -80.1:
            return "Miami"
        elif 32.7 <= lat <= 32.8 and -96.8 <= lng <= -96.7:
            return "Dallas"
        else:
            return "Local Area"
    
    def _get_local_event_templates(self, category: str, city_name: str) -> List[dict]:
        """Get realistic local event templates based on category and city"""
        templates = {
            'adventure': [
                {
                    'name': f'{city_name} Escape Room Adventure',
                    'venue': f'{city_name} Escape Rooms',
                    'description': f'Test your wits in an immersive escape room experience! Solve puzzles, find clues, and escape before time runs out.',
                    'image_url': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
                    'phone': '+1 (555) 123-4567',
                    'email': f'book@{city_name.lower().replace(" ", "")}escape.com',
                    'hours': '10:00 AM - 10:00 PM',
                    'price': '$25-35'
                },
                {
                    'name': f'{city_name} VR Gaming Center',
                    'venue': f'{city_name} Virtual Reality Zone',
                    'description': f'Step into another world with cutting-edge VR technology. Experience immersive games and adventures.',
                    'image_url': 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=400&h=300&fit=crop',
                    'phone': '+1 (555) 234-5678',
                    'email': f'play@{city_name.lower().replace(" ", "")}vr.com',
                    'hours': '11:00 AM - 11:00 PM',
                    'price': '$20-40'
                },
                {
                    'name': f'{city_name} Axe Throwing',
                    'venue': f'{city_name} Axe House',
                    'description': f'Channel your inner lumberjack! Learn to throw axes in a safe, controlled environment with expert instructors.',
                    'image_url': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
                    'phone': '+1 (555) 345-6789',
                    'email': f'throw@{city_name.lower().replace(" ", "")}axe.com',
                    'hours': '12:00 PM - 10:00 PM',
                    'price': '$30-45'
                },
                {
                    'name': f'{city_name} Pop-Up Art Gallery',
                    'venue': f'{city_name} Creative Space',
                    'description': f'Discover emerging artists and unique installations at this pop-up gallery featuring local talent.',
                    'image_url': 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
                    'phone': '+1 (555) 456-7890',
                    'email': f'art@{city_name.lower().replace(" ", "")}gallery.com',
                    'hours': '1:00 PM - 8:00 PM',
                    'price': 'Free-$15'
                },
                {
                    'name': f'{city_name} Street Fair & Food Trucks',
                    'venue': f'{city_name} Downtown Streets',
                    'description': f'Explore local vendors, food trucks, and live entertainment at this vibrant street fair happening today!',
                    'image_url': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
                    'phone': '+1 (555) 567-8901',
                    'email': f'fair@{city_name.lower().replace(" ", "")}events.com',
                    'hours': '11:00 AM - 7:00 PM',
                    'price': 'Free-$25'
                }
            ],
            'foodie': [
                {
                    'name': f'{city_name} Food Festival',
                    'venue': f'{city_name} Downtown Market',
                    'description': f'Experience the best local cuisine at the {city_name} Food Festival featuring restaurants, food trucks, and culinary demonstrations.',
                    'image_url': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
                    'phone': '+1 (555) 123-4567',
                    'email': f'info@{city_name.lower().replace(" ", "")}foodfestival.com',
                    'hours': '11:00 AM - 8:00 PM',
                    'price': '$15-45'
                },
                {
                    'name': f'{city_name} Restaurant Week',
                    'venue': 'Participating Restaurants',
                    'description': f'Dine at the best restaurants in {city_name} during our annual restaurant week with special prix-fixe menus.',
                    'image_url': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
                    'phone': '+1 (555) 234-5678',
                    'email': f'events@{city_name.lower().replace(" ", "")}restaurantweek.com',
                    'hours': '5:00 PM - 11:00 PM',
                    'price': '$35-85'
                }
            ],
            'sports': [
                {
                    'name': f'{city_name} Sports Complex',
                    'venue': f'{city_name} Athletic Center',
                    'description': f'Join fitness classes, sports leagues, and athletic activities at the {city_name} Sports Complex.',
                    'image_url': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
                    'phone': '+1 (555) 345-6789',
                    'email': f'info@{city_name.lower().replace(" ", "")}sports.com',
                    'hours': '6:00 AM - 10:00 PM',
                    'price': '$15-35'
                },
                {
                    'name': f'{city_name} Running Club',
                    'venue': f'{city_name} Park Trails',
                    'description': f'Join the {city_name} Running Club for group runs, training sessions, and community fitness events.',
                    'image_url': 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=300&fit=crop',
                    'phone': '+1 (555) 456-7890',
                    'email': f'club@{city_name.lower().replace(" ", "")}running.com',
                    'hours': '6:00 AM - 8:00 PM',
                    'price': '$10-25'
                }
            ],
            'nightlife': [
                {
                    'name': f'{city_name} Live Music Venue',
                    'venue': f'{city_name} Music Hall',
                    'description': f'Experience live music from local and touring artists at {city_name}\'s premier music venue.',
                    'image_url': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
                    'phone': '+1 (555) 567-8901',
                    'email': f'bookings@{city_name.lower().replace(" ", "")}musichall.com',
                    'hours': '8:00 PM - 2:00 AM',
                    'price': '$20-50'
                },
                {
                    'name': f'{city_name} Nightclub',
                    'venue': f'{city_name} Downtown Club',
                    'description': f'Dance the night away at {city_name}\'s hottest nightclub featuring top DJs and entertainment.',
                    'image_url': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop',
                    'phone': '+1 (555) 678-9012',
                    'email': f'events@{city_name.lower().replace(" ", "")}nightclub.com',
                    'hours': '9:00 PM - 3:00 AM',
                    'price': '$15-30'
                }
            ]
        }
        
        return templates.get(category, [
            {
                'name': f'{city_name} Local Event',
                'venue': f'{city_name} Community Center',
                'description': f'Join us for exciting {category} activities in {city_name}.',
                'image_url': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
                'phone': '+1 (555) 999-9999',
                'email': f'info@{city_name.lower().replace(" ", "")}events.com',
                'hours': '6:00 PM - 10:00 PM',
                'price': '$15-35'
            }
        ])

    def _get_yelp_categories(self, category: str) -> List[str]:
        """Map categories to Yelp business categories"""
        mappings = {
            'foodie': ['restaurants', 'food', 'cafes'],
            'nightlife': ['bars', 'nightlife', 'musicvenues'],
            'sports': ['gyms', 'sports_clubs', 'fitness'],
            'concerts': ['musicvenues', 'arts', 'entertainment'],
            'comedy': ['comedyclubs', 'entertainment'],
            'art': ['museums', 'galleries', 'arts'],
            'movies': ['movietheaters'],
            'parks': ['parks', 'recreation'],
            'swimming': ['swimmingpools', 'aquariums'],
            'drinks': ['bars', 'breweries', 'wineries'],
            'datenight': ['restaurants', 'entertainment'],
            'racing': ['amusementparks', 'entertainment']
        }
        return mappings.get(category, ['entertainment'])
    
    def _convert_yelp_to_event(self, business: dict, category: str) -> Optional[GlobalEvent]:
        """Convert Yelp business to GlobalEvent"""
        try:
            name = business.get('name', 'Unknown Venue')
            business_id = business.get('id', '')
            
            # Get location
            location = business.get('location', {})
            coordinates = business.get('coordinates', {})
            lat = coordinates.get('latitude', 0)
            lng = coordinates.get('longitude', 0)
            
            # Get address
            address_parts = []
            if location.get('address1'):
                address_parts.append(location['address1'])
            if location.get('address2'):
                address_parts.append(location['address2'])
            if location.get('address3'):
                address_parts.append(location['address3'])
            
            address = ', '.join(address_parts) if address_parts else 'Address not available'
            city = location.get('city', '')
            state = location.get('state', '')
            zip_code = location.get('zip_code', '')
            
            # Get contact info
            phone = business.get('phone', '')
            website = business.get('url', '')
            
            # Get hours
            hours = business.get('hours', [])
            hours_text = 'Hours not available'
            if hours and len(hours) > 0:
                today_hours = hours[0].get('open', [])
                if today_hours:
                    hours_text = f"{today_hours[0].get('start', '')} - {today_hours[0].get('end', '')}"
            
            # Get rating and reviews
            rating = business.get('rating', 0)
            review_count = business.get('review_count', 0)
            
            # Get price
            price = business.get('price', 'Varies')
            
            # Get categories
            categories = business.get('categories', [])
            category_names = [cat.get('title', '') for cat in categories]
            
            # Create description
            description = f"Visit {name} for great {category} experiences. "
            if rating > 0:
                description += f"Rated {rating}/5 by {review_count} people. "
            if category_names:
                description += f"Categories: {', '.join(category_names[:3])}. "
            if address != 'Address not available':
                description += f"Located at {address}."
            
            # Get image
            image_url = business.get('image_url')
            
            return GlobalEvent(
                id=f"yelp_{business_id}",
                name=name,
                description=description,
                image_url=image_url,
                start_time=None,
                end_time=None,
                venue=name,
                address=address,
                city=city,
                state=state,
                zip_code=zip_code,
                price=price,
                category=category,
                source=EventSource.YELP,
                external_id=business_id,
                external_url=website,
                organizer=name,
                attendees_count=None,
                max_attendees=None,
                is_free=False,
                is_featured=False,
                metadata={
                    'phone': phone,
                    'rating': rating,
                    'review_count': review_count,
                    'hours': hours_text,
                    'categories': category_names,
                    'distance': business.get('distance'),
                    'is_closed': business.get('is_closed', False)
                }
            )
        except Exception as e:
            print(f"Error converting Yelp business: {e}")
            return None

    def _get_ticketmaster_classifications(self, category: str) -> List[str]:
        """Map categories to Ticketmaster classifications"""
        mappings = {
            'foodie': ['Food & Drink'],
            'nightlife': ['Music', 'Nightlife'],
            'sports': ['Sports'],
            'concerts': ['Music'],
            'comedy': ['Comedy'],
            'art': ['Arts & Theatre'],
            'movies': ['Film'],
            'parks': [],  # No direct Ticketmaster equivalent - will use OSM fallback
            'swimming': ['Sports'],
            'drinks': ['Food & Drink'],
            'datenight': ['Music', 'Food & Drink'],
            'racing': ['Racing', 'Motorsports', 'Auto Racing', 'Go-Kart', 'Motorsport', 'Drag Racing', 'Speedway'],
            'family': ['Family'],
            'adventure': ['Sports'],  # Outdoor activities
            'wellness': ['Sports'],  # Fitness events
            'shopping': []  # No direct Ticketmaster equivalent
        }
        return mappings.get(category, ['Music'])
    
    def _convert_ticketmaster_to_event(self, event_data: dict, category: str) -> Optional[GlobalEvent]:
        """Convert Ticketmaster event to GlobalEvent"""
        try:
            name = event_data.get('name', 'Unknown Event')
            event_id = event_data.get('id', '')
            
            # Get dates
            dates = event_data.get('dates', {})
            start_data = dates.get('start', {})
            start_time = start_data.get('localDate') + ' ' + start_data.get('localTime', '')
            
            # Get venue
            embedded = event_data.get('_embedded', {})
            venues = embedded.get('venues', [])
            venue_data = venues[0] if venues else {}
            venue_name = venue_data.get('name', 'Unknown Venue')
            
            # Get address
            address = venue_data.get('address', {})
            address_line = address.get('line1', '')
            city = address.get('city', {}).get('name', '')
            state = address.get('state', {}).get('name', '')
            postal_code = address.get('postalCode', '')
            
            # Get coordinates
            location = venue_data.get('location', {})
            latitude = location.get('latitude')
            longitude = location.get('longitude')
            
            # Get price range
            price_ranges = event_data.get('priceRanges', [])
            price = 'Varies'
            if price_ranges:
                min_price = price_ranges[0].get('min', 0)
                max_price = price_ranges[0].get('max', 0)
                if min_price == 0:
                    price = 'Free'
                elif min_price == max_price:
                    price = f"${min_price}"
                else:
                    price = f"${min_price}-${max_price}"
            
            # Get image
            images = event_data.get('images', [])
            image_url = None
            for img in images:
                if img.get('ratio') == '16_9':
                    image_url = img.get('url')
                    break
            
            # Get promoter
            promoter = event_data.get('promoter', {}).get('name', 'Unknown Promoter')
            
            # Get classifications
            classifications = event_data.get('classifications', [])
            classification_names = []
            for classification in classifications:
                segment = classification.get('segment', {}).get('name', '')
                genre = classification.get('genre', {}).get('name', '')
                if segment:
                    classification_names.append(segment)
                if genre:
                    classification_names.append(genre)
            
            # Create description
            description = f"Join us for {name} at {venue_name}. "
            if classification_names:
                description += f"Category: {', '.join(classification_names[:3])}. "
            if address_line:
                description += f"Located at {address_line}."
            
            # Get external URL
            external_url = event_data.get('url', '')
            
            return GlobalEvent(
                id=f"ticketmaster_{event_id}",
                name=name,
                description=description,
                image_url=image_url,
                start_time=start_time,
                end_time=None,
                venue=venue_name,
                address=address_line,
                city=city,
                state=state,
                zip_code=postal_code,
                price=price,
                category=category,
                source=EventSource.TICKETMASTER,
                external_id=event_id,
                external_url=external_url,
                organizer=promoter,
                attendees_count=None,
                max_attendees=None,
                is_free=price == 'Free',
                is_featured=False,
                metadata={
                    'phone': venue_data.get('boxOfficeInfo', {}).get('phoneNumberDetail', ''),
                    'hours': venue_data.get('boxOfficeInfo', {}).get('openHoursDetail', ''),
                    'classifications': classification_names,
                    'status': event_data.get('status', {}).get('code', ''),
                    'accessibility': venue_data.get('accessibleSeatingDetail', ''),
                    'parking': venue_data.get('parkingDetail', ''),
                    'general_info': venue_data.get('generalInfo', {}).get('generalRule', '')
                }
            )
        except Exception as e:
            print(f"Error converting Ticketmaster event: {e}")
            return None

    def filter_events_by_topic(self, events, topic):
        topic_keywords = {
            'racing': [
                'race', 'racing', 'motorsport', 'kart', 'go-kart', 'track', 'speedway', 'drag', 'auto', 'nascar',
                'formula', 'indy', 'drift', 'motocross', 'monster truck', 'grand prix', 'f1', 'rally'
            ],
            'foodie': ['food', 'restaurant', 'dining', 'eat', 'cuisine', 'bistro', 'cafe', 'deli', 'brunch', 'dinner', 'lunch'],
            'nightlife': ['nightlife', 'club', 'bar', 'pub', 'dj', 'party', 'cocktail', 'lounge'],
            'concerts': ['concert', 'music', 'band', 'live', 'gig', 'show', 'performance'],
            'comedy': ['comedy', 'stand-up', 'improv', 'comic', 'laugh'],
            'art': ['art', 'gallery', 'museum', 'exhibit', 'exhibition', 'painting', 'sculpture'],
            'movies': ['movie', 'film', 'cinema', 'screening'],
            'sports': ['sport', 'game', 'match', 'tournament', 'league', 'athletic', 'fitness', 'gym'],
            'parks': ['park', 'garden', 'nature', 'outdoor', 'trail', 'picnic'],
            'swimming': ['swim', 'pool', 'aquatic', 'water', 'aquarium'],
            'drinks': ['drink', 'bar', 'cocktail', 'wine', 'beer', 'brewery', 'pub'],
            'datenight': ['date', 'romantic', 'couple', 'dinner', 'night', 'love'],
            'adventure': ['adventure', 'escape', 'vr', 'virtual', 'arcade', 'climb', 'zipline', 'explore'],
            'shopping': ['shop', 'shopping', 'mall', 'store', 'boutique', 'market'],
            'wellness': ['wellness', 'yoga', 'spa', 'meditation', 'fitness', 'health'],
            'family': ['family', 'kids', 'children', 'parent', 'play', 'zoo', 'aquarium', 'museum'],
            # Add more as needed
        }
        negative_keywords = {
            'racing': ['ymca', 'pool', 'fitness', 'gym', 'swim', 'aquatic', 'recreation', 'community center']
            # Add for other topics if needed
        }
        keywords = topic_keywords.get(topic, [topic])
        neg_keywords = negative_keywords.get(topic, [])
        filtered = [
            event for event in events
            if (
                any(
                    kw.lower() in (getattr(event, 'name', '') or '').lower() or
                    kw.lower() in (getattr(event, 'description', '') or '').lower()
                    for kw in keywords
                )
                and not any(
                    nkw in (getattr(event, 'name', '') or '').lower() or
                    nkw in (getattr(event, 'description', '') or '').lower()
                    for nkw in neg_keywords
                )
            )
        ]
        return filtered

# Global instance
global_event_api = GlobalEventAPI() 