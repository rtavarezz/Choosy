"""
Choosy Global Event Discovery System
Copyright (c) 2024 rtavarezz

Comprehensive real-time event discovery using multiple API sources.
Licensed under MIT License - see LICENSE file.

This proprietary system aggregates events from multiple global APIs
with intelligent deduplication and ranking algorithms.
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
from .api_config import api_template_manager, EventType
from core.cache_manager import cache_manager

# Use centralized environment configuration
from config.environment import env_config

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
        # Initialize API keys from centralized configuration
        self.api_keys = env_config.get_api_keys()
        self.rate_limits = {}
        
        # Get API configurations from template manager and add rate limits
        for api_name, config in api_template_manager.api_configs.items():
            if config.enabled:
                # Use centralized config first, fallback to direct env lookup
                if api_name not in self.api_keys:
                    self.api_keys[api_name] = os.getenv(config.api_key_env) if config.api_key_env else None
                self.rate_limits[api_name] = {
                    'requests': 0, 
                    'limit': config.rate_limit, 
                    'reset_time': datetime.now()
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
        Uses template-based configuration for easy API management
        """
        events = []
        
        # Get topic configuration from template manager
        topic_config = api_template_manager.get_topic_config(category)
        if not topic_config:
            print(f"❌ No configuration found for topic: {category}")
            return events
        
        print(f"🎯 Fetching {category} events using {len(topic_config.api_sources)} API sources")
        
        # Fetch from configured APIs based on topic configuration
        tasks = []
        
        for api_name in topic_config.api_sources:
            api_config = api_template_manager.get_api_config(api_name)
            if not api_config or not api_config.enabled:
                continue
                
            if not self.api_keys.get(api_name) and api_name not in ['openstreetmap']:
                print(f"⚠️ API {api_name} not configured (missing API key)")
                continue
            
            # Create fetch task based on API name
            if api_name == 'eventbrite':
                tasks.append(self._fetch_eventbrite_events(lat, lng, category, radius))
            elif api_name == 'ticketmaster':
                tasks.append(self._fetch_ticketmaster_events(lat, lng, category, radius))
            elif api_name == 'meetup':
                tasks.append(self._fetch_meetup_events(lat, lng, category, radius))
            elif api_name == 'google_places':
                tasks.append(self._fetch_google_places_events(lat, lng, category, radius))
            elif api_name == 'openstreetmap':
                tasks.append(self._fetch_osm_events(lat, lng, category, radius))
            elif api_name == 'yelp':
                tasks.append(self._fetch_yelp_events(lat, lng, category, radius))
            elif api_name == 'facebook':
                tasks.append(self._fetch_facebook_events(lat, lng, category, radius))
        
        # Execute all tasks concurrently
        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Combine results
            for result in results:
                if isinstance(result, list):
                    events.extend(result)
                elif isinstance(result, Exception):
                    print(f"⚠️ API source failed: {result}")
                    continue
        
        # Deduplicate and rank
        events = self._deduplicate_events(events)
        events = self._rank_events_by_relevance(events, category)
        
        # Apply strong topic filtering
        print(f"🎯 DEBUG: Applying topic filtering for category='{category}', {len(events)} events before filtering")
        events = await self.filter_events_by_topic(events, category, limit)
        print(f"✅ Topic filtering complete: {len(events)} events after filtering")

        # --- Fun Activities Fallback for low results ---
        # DISABLED: Prioritize real events over fallback activities
        print(f"🚫 Fallback activities disabled - using only real events: {len(events)} found")
        if False and len(events) < topic_config.min_events_threshold and topic_config.fallback_activities:
            print(f"🎮 Adding fun offline activities for {category} (only {len(events)} real events found)")
            
            # Add fun offline activities and TikTok trends
            fun_activities = self._create_fun_offline_activities(category)
            events.extend(fun_activities)
            
            # If still low on events, add a suggestion to search Google
            if len(events) < 3:
                city_name = self._get_city_from_coordinates(lat, lng)
                google_url = self.get_google_search_url(category, city_name)
                suggestion_event = GlobalEvent(
                    id=f'suggestion_google_{category}_{city_name.replace(" ", "_")}',
                    name=f'Search for more {category} events',
                    description=(
                        f"Want more options? Search Google for '{category} near {city_name}' "
                        f"or try our fun offline activities above! "
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
        # --------------------------------------
        
        # Enrich a subset with place details where missing (ratings/hours/address)
        try:
            enriched_events = await self._enrich_events_with_places(events, lat, lng)
        except Exception as e:
            print(f"Enrichment skipped due to error: {e}")
            enriched_events = events

        print(f"✅ Found {len(enriched_events)} total events for {category}")
        return enriched_events[:limit]

    async def _enrich_events_with_places(self, events: List[GlobalEvent], lat: float, lng: float) -> List[GlobalEvent]:
        """Enrich top events with venue details.
        Regional priority:
          - US/EU: Yelp → Foursquare → Google Places
          - Else:  Foursquare → Google Places → Yelp
        Cached per venue and area.
        """
        fsq_available = bool(self.api_keys.get('foursquare')) or bool(self.api_keys.get('FOURSQUARE')) or bool(os.getenv('FOURSQUARE_API_KEY'))
        g_places_available = bool(self.api_keys.get('google_places'))
        yelp_available = bool(os.getenv('YELP_API_KEY') or self.api_keys.get('yelp'))
        if not fsq_available and not g_places_available:
            return events
        # Limit enrichment to first 10 to control rate
        targets = [e for e in events if (not e.metadata or not e.metadata.get('rating') or not e.metadata.get('hours'))]
        targets = targets[:10]
        if not targets:
            return events
        import aiohttp

        async def enrich_with_foursquare(session: aiohttp.ClientSession, ev: GlobalEvent):
            try:
                name = ev.venue or ev.name
                if not name:
                    return False
                cache_key = f"fsq_enrich:{name}:{round(lat,4)}:{round(lng,4)}"
                cached = cache_manager.get(cache_key)
                if cached:
                    ev.metadata = {**(ev.metadata or {}), **cached}
                    if not ev.address and cached.get('address'): ev.address = cached.get('address')
                    return True
                base = "https://api.foursquare.com/v3/places"
                headers = {"Authorization": os.getenv('FOURSQUARE_API_KEY') or self.api_keys.get('foursquare'), "Accept": "application/json"}
                params = {"query": name, "ll": f"{lat},{lng}", "radius": 5000, "limit": 1}
                async with session.get(f"{base}/search", headers=headers, params=params, timeout=10) as r:
                    js = await r.json()
                results = js.get('results') or []
                if not results:
                    return False
                fsq_id = results[0].get('fsq_id')
                if not fsq_id:
                    return False
                fields = "rating,popularity,hours,location,tel,website,name"
                async with session.get(f"{base}/{fsq_id}", headers=headers, params={"fields": fields}, timeout=10) as r2:
                    det = await r2.json()
                # Map FS data
                rating10 = det.get('rating')
                rating5 = (rating10 / 2.0) if isinstance(rating10, (int, float)) else None
                hours = det.get('hours', {})
                display_hours = hours.get('display') if isinstance(hours, dict) else None
                location = det.get('location', {})
                merged = {
                    'rating': rating5,
                    'review_count': det.get('popularity'),
                    'opening_hours': display_hours,
                    'address': location.get('formatted_address'),
                    'website': det.get('website'),
                    'phone': det.get('tel')
                }
                ev.metadata = {**(ev.metadata or {}), **{k: v for k, v in merged.items() if v is not None}}
                if not ev.address and merged.get('address'):
                    ev.address = merged['address']
                cache_manager.set(cache_key, ev.metadata, ttl=43200)
                return True
            except Exception as e:
                print(f"Foursquare enrichment error for '{ev.name}': {e}")
                return False

        async def enrich_with_places(session: aiohttp.ClientSession, ev: GlobalEvent):
            name = ev.venue or ev.name
            if not name:
                return False
            key = f"places_enrich:{name}:{round(lat,4)}:{round(lng,4)}"
            cached = cache_manager.get(key)
            if cached:
                ev.metadata = {**(ev.metadata or {}), **cached}
                # Fill common fields if empty
                if not ev.city and cached.get('address'): ev.address = cached.get('address')
                return True
            try:
                base = "https://maps.googleapis.com/maps/api/place"
                # Text search near location
                params = {
                    'query': name,
                    'location': f"{lat},{lng}",
                    'radius': 5000,
                    'key': self.api_keys['google_places']
                }
                async with session.get(f"{base}/textsearch/json", params=params, timeout=10) as r:
                    js = await r.json()
                    candidate = (js.get('results') or [None])[0]
                if not candidate:
                    return False
                place_id = candidate.get('place_id')
                fields = 'rating,user_ratings_total,price_level,opening_hours,formatted_address,website,name'
                async with session.get(f"{base}/details/json", params={'place_id': place_id, 'fields': fields, 'key': self.api_keys['google_places']}, timeout=10) as r2:
                    det = await r2.json()
                result = det.get('result', {})
                merged = {
                    'rating': result.get('rating'),
                    'review_count': result.get('user_ratings_total'),
                    'price_level': result.get('price_level'),
                    'opening_hours': result.get('opening_hours', {}).get('weekday_text'),
                    'address': result.get('formatted_address'),
                    'website': result.get('website')
                }
                # Merge into event metadata and basic fields
                ev.metadata = {**(ev.metadata or {}), **{k:v for k,v in merged.items() if v is not None}}
                if not ev.address and merged.get('address'):
                    ev.address = merged['address']
                # Try place photo as image_url if none present
                if not ev.image_url:
                    photos = result.get('photos') or []
                    if photos:
                        ref = photos[0].get('photo_reference')
                        if ref:
                            ev.image_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference={ref}&key={self.api_keys['google_places']}"
                # Cache for 12 hours
                cache_manager.set(key, ev.metadata, ttl=43200)
                return True
            except Exception as e:
                print(f"Places enrichment error for '{name}': {e}")
                return False

        # Lightweight region detect (approx bounding boxes)
        def is_us(lat: float, lng: float) -> bool:
            # Continental US rough bounding box
            return 24.0 <= lat <= 49.5 and -125.0 <= lng <= -66.0
        def is_canada(lat: float, lng: float) -> bool:
            # Canada rough bounding box
            return 41.7 <= lat <= 83.1 and -141.0 <= lng <= -52.6
        def is_europe(lat: float, lng: float) -> bool:
            # Europe rough bounding box (excludes parts of Russia/Turkey for simplicity)
            return 35.0 <= lat <= 71.0 and -10.0 <= lng <= 40.0
        in_us_ca = is_us(lat, lng) or is_canada(lat, lng)
        in_eu = is_europe(lat, lng)

        async with aiohttp.ClientSession() as session:
            async def enrich_one(ev: GlobalEvent):
                yelp_key = (os.getenv('YELP_API_KEY') or self.api_keys.get('yelp')) if yelp_available else None
                if in_us_ca:
                    # Yelp first in US/Canada
                    if yelp_key:
                        oky = await self._enrich_with_yelp(session, ev, lat, lng, yelp_key)
                        if oky:
                            return
                    if fsq_available:
                        ok = await enrich_with_foursquare(session, ev)
                        if ok:
                            return
                    if g_places_available:
                        await enrich_with_places(session, ev)
                elif in_eu:
                    # Europe: Foursquare first, then Places, Yelp last
                    if fsq_available:
                        ok = await enrich_with_foursquare(session, ev)
                        if ok:
                            return
                    if g_places_available:
                        okp = await enrich_with_places(session, ev)
                        if okp:
                            return
                    if yelp_key:
                        await self._enrich_with_yelp(session, ev, lat, lng, yelp_key)
                else:
                    # Rest of world
                    if fsq_available:
                        ok = await enrich_with_foursquare(session, ev)
                        if ok:
                            return
                    if g_places_available:
                        okp = await enrich_with_places(session, ev)
                        if okp:
                            return
                    if yelp_key:
                        await self._enrich_with_yelp(session, ev, lat, lng, yelp_key)
            await asyncio.gather(*(enrich_one(ev) for ev in targets))
        return events

    async def _enrich_with_yelp(self, session, ev: GlobalEvent, lat: float, lng: float, api_key: str) -> bool:
        try:
            name = ev.venue or ev.name
            if not name:
                return False
            cache_key = f"yelp_enrich:{name}:{round(lat,4)}:{round(lng,4)}"
            cached = cache_manager.get(cache_key)
            if cached:
                ev.metadata = {**(ev.metadata or {}), **cached}
                if not ev.address and cached.get('address'): ev.address = cached.get('address')
                if not ev.image_url and cached.get('image_url'): ev.image_url = cached.get('image_url')
                return True
            headers = {"Authorization": f"Bearer {api_key}", "Accept": "application/json"}
            params = {"term": name, "latitude": lat, "longitude": lng, "radius": 5000, "limit": 1}
            async with session.get("https://api.yelp.com/v3/businesses/search", headers=headers, params=params, timeout=10) as r:
                js = await r.json()
            businesses = js.get('businesses') or []
            if not businesses:
                return False
            biz = businesses[0]
            biz_id = biz.get('id')
            # details
            async with session.get(f"https://api.yelp.com/v3/businesses/{biz_id}", headers=headers, timeout=10) as r2:
                det = await r2.json()
            merged = {
                'rating': det.get('rating'),
                'review_count': det.get('review_count'),
                'price': det.get('price'),
                'address': ", ".join(det.get('location', {}).get('display_address') or []),
                'website': det.get('url'),
                'phone': det.get('display_phone'),
                'reservations_accepted': 'restaurant_reservation' in (det.get('transactions') or [])
            }
            if not ev.image_url and det.get('image_url'):
                merged['image_url'] = det.get('image_url')
                ev.image_url = det.get('image_url')
            ev.metadata = {**(ev.metadata or {}), **{k: v for k, v in merged.items() if v is not None}}
            if not ev.address and merged.get('address'):
                ev.address = merged['address']
            cache_manager.set(cache_key, ev.metadata, ttl=43200)
            return True
        except Exception as e:
            print(f"Yelp enrichment error for '{ev.name}': {e}")
            return False
    
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
        
        # DISABLED: Force real events only
        print(f"🚫 Location-specific fallbacks disabled")
        if False and category == 'adventure':
            local_adventure_events = self._create_location_specific_events(lat, lng, category)
            events.extend(local_adventure_events)
            print(f"🎯 Adventure: Added {len(local_adventure_events)} local adventure templates")
        
        # DISABLED: Only use real API events
        if not events:
            print(f"📍 No real events found from APIs - returning empty list instead of fallbacks")
            events = []
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
        """Convert Google Places result to GlobalEvent, with Unsplash fallback image"""
        try:
            from services.unsplash_service import get_unsplash_fallback
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
            
            # Try to get a photo reference (if available)
            image_url = None
            photos = place.get('photos')
            if photos and isinstance(photos, list) and len(photos) > 0:
                photo_ref = photos[0].get('photo_reference')
                if photo_ref and self.api_keys.get('google_places'):
                    image_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference={photo_ref}&key={self.api_keys['google_places']}"
            # If no image, use Unsplash fallback
            if not image_url:
                unsplash = get_unsplash_fallback(category)
                if unsplash:
                    image_url = unsplash.get('image_url')
            
            return GlobalEvent(
                id=f"google_{place_id}",
                name=name,
                description=description,
                image_url=image_url,
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
    
    def _estimate_venue_price(self, tags: dict, amenity: str, leisure: str, shop: str, tourism: str) -> str:
        """Estimate venue price based on OSM tags"""
        # Check if there's an explicit fee tag
        fee = tags.get('fee', '').lower()
        if fee == 'no':
            return 'Free'
        elif fee == 'yes':
            return 'Paid admission'
        
        # Estimate based on venue type
        if amenity in ['library', 'place_of_worship', 'community_centre', 'park']:
            return 'Free'
        elif amenity in ['restaurant', 'cafe', 'bar', 'pub']:
            return '$10-30 per person'
        elif amenity in ['cinema', 'theatre']:
            return '$8-15 per ticket'
        elif leisure in ['park', 'playground', 'garden', 'nature_reserve']:
            return 'Free'
        elif leisure in ['fitness_centre', 'sports_centre']:
            return '$5-20 per visit'
        elif leisure in ['bowling_alley', 'miniature_golf']:
            return '$8-25 per person'
        elif shop:
            return 'Varies by purchase'
        elif tourism in ['museum', 'gallery']:
            return '$5-15 per ticket'
        elif tourism in ['attraction', 'theme_park']:
            return '$10-50 per ticket'
        elif tourism == 'viewpoint':
            return 'Free'
        else:
            return 'Varies'
    
    def _convert_osm_element_to_event(self, element: dict, category: str) -> Optional[GlobalEvent]:
        """Convert OpenStreetMap element to GlobalEvent, with Unsplash fallback image"""
        try:
            from services.unsplash_service import get_unsplash_fallback
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
            
            # Create unique, diverse descriptions based on OSM tags
            amenity = tags.get('amenity', '')
            leisure = tags.get('leisure', '')
            shop = tags.get('shop', '')
            tourism = tags.get('tourism', '')
            cuisine = tags.get('cuisine', '')
            
            # Generate varied description patterns
            descriptions = []
            
            if amenity == 'restaurant':
                if cuisine:
                    descriptions.append(f"Enjoy authentic {cuisine.replace('_', ' ')} cuisine at {name}.")
                    descriptions.append(f"Indulge in delicious {cuisine.replace('_', ' ')} dishes at this local favorite.")
                else:
                    descriptions.append(f"Savor great food and atmosphere at {name}.")
                    descriptions.append(f"Experience quality dining at this popular restaurant.")
            elif amenity == 'cafe':
                descriptions.append(f"Relax with coffee and light bites at {name}.")
                descriptions.append(f"Perfect spot for coffee dates and casual meetings.")
            elif amenity == 'bar' or amenity == 'pub':
                descriptions.append(f"Unwind with drinks and good vibes at {name}.")
                descriptions.append(f"Local favorite for evening drinks and socializing.")
            elif amenity == 'fast_food':
                descriptions.append(f"Quick and tasty meals at {name}.")
                descriptions.append(f"Convenient dining option for a fast bite.")
            elif leisure:
                descriptions.append(f"Enjoy {leisure.replace('_', ' ')} activities at {name}.")
                descriptions.append(f"Great place for recreational fun and entertainment.")
            elif tourism:
                descriptions.append(f"Discover this {tourism.replace('_', ' ')} attraction.")
                descriptions.append(f"Must-visit destination for culture and exploration.")
            else:
                descriptions.append(f"Visit {name} for a unique local experience.")
                descriptions.append(f"Discover what makes {name} special.")
            
            # Pick a random description pattern to add variety
            import random
            base_description = random.choice(descriptions)
            
            # Add specific details
            details = []
            if address:
                details.append(f"Located at {address}")
            if tags.get('outdoor_seating') == 'yes':
                details.append("offers outdoor seating")
            if tags.get('wifi') == 'yes':
                details.append("provides free WiFi")
            if tags.get('wheelchair') == 'yes':
                details.append("wheelchair accessible")
            if tags.get('takeaway') == 'yes':
                details.append("takeaway available")
            
            if details:
                if len(details) == 1:
                    description = f"{base_description} {details[0].capitalize()}."
                else:
                    description = f"{base_description} {', '.join(details[:-1])}, and {details[-1]}."
            else:
                description = base_description
            
            # Try to get an image from tags (rare)
            image_url = tags.get('image')
            # If no image, use Unsplash fallback
            if not image_url:
                unsplash = get_unsplash_fallback(category)
                if unsplash:
                    image_url = unsplash.get('image_url')
            
            return GlobalEvent(
                id=f"osm_{element.get('id', '')}",
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
                price=self._estimate_venue_price(tags, amenity, leisure, shop, tourism),
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
                    'osm_tags': tags
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
            
            # Get description - create diverse patterns for meetups
            import random
            raw_description = event.get('description', '').replace('<p>', '').replace('</p>', '')[:200]
            
            if raw_description and len(raw_description) > 20:
                description = raw_description
            else:
                # Generate varied meetup descriptions
                meetup_patterns = [
                    f"Connect with like-minded people at this {category} meetup.",
                    f"Join fellow enthusiasts for an engaging {category} gathering.",
                    f"Network and learn at this exciting {category} meetup event.",
                    f"Discover new connections at this {category} community event.",
                    f"Share experiences and ideas at this {category} meetup.",
                    f"Meet amazing people who share your passion for {category}.",
                    f"Build meaningful connections at this {category} social event."
                ]
                description = random.choice(meetup_patterns)
            
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
            'adventure': [('leisure', 'amusement_arcade'), ('amenity', 'entertainment'), ('tourism', 'attraction'), ('amenity', 'escape_room')],
            'bored': [('amenity', 'cafe'), ('leisure', 'park'), ('leisure', 'garden'), ('amenity', 'library'), ('leisure', 'fitness_centre')]
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

    def _create_fun_offline_activities(self, category: str) -> List[GlobalEvent]:
        """Create fun, free offline activities and TikTok trends based on category"""
        activities = []
        
        # Get fun activities for the category
        fun_activities = self._get_fun_activity_templates(category)
        
        for i, activity in enumerate(fun_activities):
            event_id = f"fun_{category}_{i}_{int(datetime.now().timestamp())}"
            
            event = GlobalEvent(
                id=event_id,
                name=activity['name'],
                description=activity['description'],
                image_url=activity['image_url'],
                start_time=None,
                end_time=None,
                venue=activity['venue'],
                address="Anywhere you want!",
                city="Your Area",
                state="",
                zip_code="",
                price="FREE",
                category=category,
                source=EventSource.LOCAL,
                external_id=event_id,
                external_url=None,
                organizer="Fun Ideas",
                attendees_count=None,
                max_attendees=None,
                is_free=True,
                is_featured=True,
                metadata={
                    'phone': 'N/A',
                    'email': 'fun@choosy.com',
                    'hours': '24/7',
                    'offline_activity': True,
                    'tiktok_trend': activity.get('tiktok_trend', False),
                    'cultural_game': activity.get('cultural_game', False),
                    'free_activity': True,
                    'difficulty': activity.get('difficulty', 'Easy'),
                    'duration': activity.get('duration', '1-2 hours'),
                    'materials_needed': activity.get('materials_needed', 'None')
                }
            )
            activities.append(event)
        
        return activities
    
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
    
    async def filter_events_by_topic(self, events: List, category: str, limit: int = 20) -> List:
        """Filter events to match the selected topic more precisely"""
        
        # Topic-specific keywords for filtering
        topic_keywords = {
            'comedy': ['comedy', 'laugh', 'humor', 'stand-up', 'improv', 'funny', 'joke', 'entertainment'],
            'foodie': ['restaurant', 'food', 'dining', 'cuisine', 'cook', 'chef', 'eat', 'taste', 'culinary'],
            'adventure': ['adventure', 'climb', 'escape', 'outdoor', 'thrill', 'explore', 'active', 'challenge'],
            'parks': ['park', 'garden', 'nature', 'outdoor', 'walk', 'trail', 'botanical', 'green'],
            'concerts': ['music', 'concert', 'band', 'singer', 'performance', 'live music', 'venue'],
            'art': ['art', 'gallery', 'museum', 'exhibit', 'painting', 'sculpture', 'creative', 'culture'],
            'movies': ['movie', 'film', 'cinema', 'theater', 'screening', 'premiere'],
            'sports': ['sport', 'game', 'team', 'athletic', 'fitness', 'competition', 'stadium'],
            'nightlife': ['bar', 'club', 'night', 'drinks', 'party', 'lounge', 'cocktail'],
            'shopping': ['shop', 'store', 'mall', 'boutique', 'market', 'retail', 'fashion'],
            'bored': ['cafe', 'coffee', 'library', 'bookstore', 'park', 'walk', 'simple', 'easy']
        }
        
        keywords = topic_keywords.get(category, [])
        if not keywords:
            return events[:limit]
        
        # Score events based on topic relevance
        scored_events = []
        for event in events:
            score = 0
            # Handle both GlobalEvent objects and dictionaries
            if hasattr(event, 'name'):
                # GlobalEvent object
                event_name = getattr(event, 'name', '') or ''
                event_description = getattr(event, 'description', '') or ''
                event_venue = getattr(event, 'venue', '') or ''
            else:
                # Dictionary
                event_name = event.get('name', '')
                event_description = event.get('description', '')
                event_venue = event.get('venue', '')
            
            text_to_search = f"{event_name} {event_description} {event_venue}".lower()
            
            # Count keyword matches
            for keyword in keywords:
                if keyword in text_to_search:
                    score += 1
            
            scored_events.append((score, event))
        
        # Sort by score (highest first) and return top events
        scored_events.sort(key=lambda x: x[0], reverse=True)
        return [event for score, event in scored_events[:limit]]

    def _get_fun_activity_templates(self, category: str) -> List[dict]:
        """Get fun, free offline activities and TikTok trends based on category"""
        templates = {
            'foodie': [
                {
                    'name': '🍕 TikTok Pizza Challenge',
                    'venue': 'Your Kitchen',
                    'description': 'Try the viral TikTok pizza hack! Use a tortilla, add your favorite toppings, and create a crispy personal pizza. Perfect for solo cooking or group fun!',
                    'image_url': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
                    'tiktok_trend': True,
                    'cultural_game': False,
                    'difficulty': 'Easy',
                    'duration': '30 minutes',
                    'materials_needed': 'Tortillas, cheese, toppings, pan'
                },
                {
                    'name': '🌮 Taco Tuesday Challenge',
                    'venue': 'Any Kitchen',
                    'description': 'Create the most creative taco! Use unusual ingredients, try fusion flavors, or make it Instagram-worthy. Share your creation!',
                    'image_url': 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop',
                    'tiktok_trend': True,
                    'cultural_game': False,
                    'difficulty': 'Medium',
                    'duration': '1 hour',
                    'materials_needed': 'Tortillas, ingredients, creativity'
                },
                {
                    'name': '🍰 Cake Decorating Battle',
                    'venue': 'Home Kitchen',
                    'description': 'Buy a plain cake and decorate it with friends! Use candy, sprinkles, and creativity. Vote on the best design!',
                    'image_url': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Easy',
                    'duration': '1-2 hours',
                    'materials_needed': 'Plain cake, decorations, creativity'
                },
                {
                    'name': '🍳 TikTok Cooking Challenge',
                    'venue': 'Kitchen',
                    'description': 'Try viral cooking hacks and recipes! Film your cooking process and share your culinary creations.',
                    'image_url': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
                    'tiktok_trend': True,
                    'cultural_game': False,
                    'difficulty': 'Medium',
                    'duration': '1-2 hours',
                    'materials_needed': 'Ingredients, cooking tools, camera'
                },
                {
                    'name': '🍹 Mocktail Mixing Party',
                    'venue': 'Home',
                    'description': 'Create fancy mocktails with friends! Use fresh fruits, herbs, and creative garnishes.',
                    'image_url': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Easy',
                    'duration': '1 hour',
                    'materials_needed': 'Fruits, herbs, glasses, creativity'
                },
                {
                    'name': '🍪 Cookie Decorating Contest',
                    'venue': 'Kitchen',
                    'description': 'Bake cookies and have a decorating contest! Use icing, sprinkles, and edible decorations.',
                    'image_url': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Easy',
                    'duration': '1-2 hours',
                    'materials_needed': 'Cookies, icing, decorations'
                }
            ],
            'datenight': [
                {
                    'name': '💕 TikTok Couple Challenge',
                    'venue': 'Your Home',
                    'description': 'Try the viral couple challenges! Blindfolded makeup, synchronized dancing, or the "what\'s in my partner\'s phone" game.',
                    'image_url': 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=300&fit=crop',
                    'tiktok_trend': True,
                    'cultural_game': False,
                    'difficulty': 'Easy',
                    'duration': '1 hour',
                    'materials_needed': 'Phone, camera, creativity'
                },
                {
                    'name': '🎭 Improv Comedy Night',
                    'venue': 'Living Room',
                    'description': 'Create your own comedy show! Take turns making up stories, acting out scenarios, or playing "Yes, And" improv games.',
                    'image_url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Medium',
                    'duration': '1-2 hours',
                    'materials_needed': 'Imagination, sense of humor'
                },
                {
                    'name': '🕯️ Candlelit Board Game Night',
                    'venue': 'Home',
                    'description': 'Turn off the lights, light some candles, and play your favorite board games by candlelight. Romantic and fun!',
                    'image_url': 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Easy',
                    'duration': '2-3 hours',
                    'materials_needed': 'Board games, candles, blankets'
                }
            ],
            'concerts': [
                {
                    'name': '🎤 TikTok Karaoke Challenge',
                    'venue': 'Your Living Room',
                    'description': 'Sing your heart out to trending TikTok songs! Use apps like Smule or just sing along to YouTube. Record and share!',
                    'image_url': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
                    'tiktok_trend': True,
                    'cultural_game': False,
                    'difficulty': 'Easy',
                    'duration': '1-2 hours',
                    'materials_needed': 'Phone, music app, microphone (optional)'
                },
                {
                    'name': '🥁 Kitchen Band Jam',
                    'venue': 'Kitchen',
                    'description': 'Turn kitchen items into instruments! Use pots, pans, spoons, and create your own band. Record a music video!',
                    'image_url': 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop',
                    'tiktok_trend': True,
                    'cultural_game': False,
                    'difficulty': 'Easy',
                    'duration': '1 hour',
                    'materials_needed': 'Kitchen items, creativity'
                },
                {
                    'name': '🎵 Lip Sync Battle',
                    'venue': 'Any Room',
                    'description': 'Classic lip sync battle! Choose songs, practice your moves, and compete for the best performance.',
                    'image_url': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Medium',
                    'duration': '1-2 hours',
                    'materials_needed': 'Music, camera, costumes'
                }
            ],
            'comedy': [
                {
                    'name': '😂 TikTok Comedy Skits',
                    'venue': 'Your Home',
                    'description': 'Recreate viral TikTok comedy skits! Act out funny scenarios, use popular sound effects, and create your own content.',
                    'image_url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
                    'tiktok_trend': True,
                    'cultural_game': False,
                    'difficulty': 'Medium',
                    'duration': '1-2 hours',
                    'materials_needed': 'Phone, camera, creativity'
                },
                {
                    'name': '🎭 Stand-Up Comedy Night',
                    'venue': 'Living Room',
                    'description': 'Write and perform your own stand-up comedy! Take turns telling jokes, stories, or doing impressions.',
                    'image_url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Hard',
                    'duration': '1-2 hours',
                    'materials_needed': 'Jokes, confidence, audience'
                },
                {
                    'name': '🎪 Improv Games Night',
                    'venue': 'Any Space',
                    'description': 'Play classic improv games like "Yes, And", "Freeze Tag", or "Props". Great for groups and building creativity!',
                    'image_url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Medium',
                    'duration': '1-2 hours',
                    'materials_needed': 'Imagination, energy'
                }
            ],
            'sports': [
                {
                    'name': '🏀 TikTok Basketball Tricks',
                    'venue': 'Driveway/Park',
                    'description': 'Try viral basketball trick shots! Set up creative obstacles, use household items, and film your attempts.',
                    'image_url': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
                    'tiktok_trend': True,
                    'cultural_game': False,
                    'difficulty': 'Hard',
                    'duration': '1-2 hours',
                    'materials_needed': 'Basketball, hoop, obstacles'
                },
                {
                    'name': '⚽ Backyard Soccer Tournament',
                    'venue': 'Backyard/Park',
                    'description': 'Organize a mini soccer tournament! Use cones for goals, create teams, and play quick matches.',
                    'image_url': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Medium',
                    'duration': '2-3 hours',
                    'materials_needed': 'Soccer ball, cones, friends'
                },
                {
                    'name': '🏓 Ping Pong Championship',
                    'venue': 'Garage/Basement',
                    'description': 'Set up a ping pong table and have a tournament! Create brackets, keep score, and crown a champion.',
                    'image_url': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Medium',
                    'duration': '1-2 hours',
                    'materials_needed': 'Ping pong table, paddles, balls'
                },
                {
                    'name': '🏃‍♂️ TikTok Fitness Challenge',
                    'venue': 'Home/Gym',
                    'description': 'Try viral fitness challenges! Plank challenges, wall sits, or create your own workout routine.',
                    'image_url': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
                    'tiktok_trend': True,
                    'cultural_game': False,
                    'difficulty': 'Medium',
                    'duration': '30-60 minutes',
                    'materials_needed': 'Yoga mat, timer, motivation'
                },
                {
                    'name': '🎾 Tennis Wall Practice',
                    'venue': 'Tennis Court',
                    'description': 'Find a tennis wall and practice your strokes! Perfect for solo practice or friendly competitions.',
                    'image_url': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Easy',
                    'duration': '1-2 hours',
                    'materials_needed': 'Tennis racket, balls, wall'
                },
                {
                    'name': '🏊‍♀️ Pool Workout',
                    'venue': 'Local Pool',
                    'description': 'Try water aerobics or swimming laps! Great low-impact exercise that\'s fun and refreshing.',
                    'image_url': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Easy',
                    'duration': '1 hour',
                    'materials_needed': 'Swimsuit, towel, pool access'
                },
                {
                    'name': '🚴‍♂️ Bike Ride Adventure',
                    'venue': 'Neighborhood',
                    'description': 'Go on a bike ride and explore your area! Find new routes, take photos, and enjoy the outdoors.',
                    'image_url': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Easy',
                    'duration': '1-3 hours',
                    'materials_needed': 'Bike, helmet, water'
                },
                {
                    'name': '🏋️‍♀️ Home Gym Circuit',
                    'venue': 'Home',
                    'description': 'Create a circuit workout using household items! Use chairs, water bottles, and bodyweight exercises.',
                    'image_url': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
                    'tiktok_trend': True,
                    'cultural_game': False,
                    'difficulty': 'Medium',
                    'duration': '45 minutes',
                    'materials_needed': 'Household items, timer, space'
                }
            ],
            'parks': [
                {
                    'name': '🌳 TikTok Nature Walk',
                    'venue': 'Local Park',
                    'description': 'Go on a nature walk and film TikTok-style content! Find interesting plants, animals, or scenic spots.',
                    'image_url': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
                    'tiktok_trend': True,
                    'cultural_game': False,
                    'difficulty': 'Easy',
                    'duration': '1-2 hours',
                    'materials_needed': 'Phone, camera, walking shoes'
                },
                {
                    'name': '🧺 Picnic Games',
                    'venue': 'Park',
                    'description': 'Pack a picnic and bring classic games! Frisbee, cards, board games, or create your own outdoor activities.',
                    'image_url': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Easy',
                    'duration': '2-3 hours',
                    'materials_needed': 'Picnic food, games, blanket'
                },
                {
                    'name': '🎯 Outdoor Scavenger Hunt',
                    'venue': 'Park/Neighborhood',
                    'description': 'Create a scavenger hunt! Make a list of items to find, take photos, and compete with friends.',
                    'image_url': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Medium',
                    'duration': '1-2 hours',
                    'materials_needed': 'List, camera, creativity'
                }
            ],
            'adventure': [
                {
                    'name': '🗺️ TikTok Geocaching',
                    'venue': 'Your Area',
                    'description': 'Try geocaching with a TikTok twist! Film your treasure hunts, create clues, and share your finds.',
                    'image_url': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
                    'tiktok_trend': True,
                    'cultural_game': False,
                    'difficulty': 'Medium',
                    'duration': '2-3 hours',
                    'materials_needed': 'Phone, GPS, small treasures'
                },
                {
                    'name': '🏠 Neighborhood Explorer',
                    'venue': 'Your Neighborhood',
                    'description': 'Explore your neighborhood like a tourist! Take photos, discover hidden spots, and learn local history.',
                    'image_url': 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Easy',
                    'duration': '1-2 hours',
                    'materials_needed': 'Camera, walking shoes, curiosity'
                },
                {
                    'name': '🎪 Backyard Obstacle Course',
                    'venue': 'Backyard',
                    'description': 'Create an obstacle course using household items! Time each other, add challenges, and have fun.',
                    'image_url': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Medium',
                    'duration': '1-2 hours',
                    'materials_needed': 'Household items, timer, creativity'
                }
            ],
            'shopping': [
                {
                    'name': '🛍️ TikTok Thrift Flip',
                    'venue': 'Thrift Store + Home',
                    'description': 'Buy something from a thrift store and transform it! Paint, modify, or style it for a before/after video.',
                    'image_url': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
                    'tiktok_trend': True,
                    'cultural_game': False,
                    'difficulty': 'Medium',
                    'duration': '2-3 hours',
                    'materials_needed': 'Thrift items, craft supplies, creativity'
                },
                {
                    'name': '👗 Fashion Show Night',
                    'venue': 'Home',
                    'description': 'Have a fashion show with your clothes! Create outfits, walk the runway, and rate each other\'s style.',
                    'image_url': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Easy',
                    'duration': '1-2 hours',
                    'materials_needed': 'Clothes, accessories, music'
                },
                {
                    'name': '🎨 DIY Craft Market',
                    'venue': 'Home',
                    'description': 'Create crafts and have a mini market! Make jewelry, art, or decorations and "sell" to each other.',
                    'image_url': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Medium',
                    'duration': '2-3 hours',
                    'materials_needed': 'Craft supplies, creativity, imagination'
                }
            ],
            'wellness': [
                {
                    'name': '🧘 TikTok Yoga Challenge',
                    'venue': 'Home',
                    'description': 'Try viral yoga poses and challenges! Follow TikTok yoga trends, create flows, and share your practice.',
                    'image_url': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
                    'tiktok_trend': True,
                    'cultural_game': False,
                    'difficulty': 'Medium',
                    'duration': '30-60 minutes',
                    'materials_needed': 'Yoga mat, phone, space'
                },
                {
                    'name': '🌿 DIY Spa Night',
                    'venue': 'Bathroom',
                    'description': 'Create your own spa experience! Face masks, bubble baths, meditation, and relaxation techniques.',
                    'image_url': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Easy',
                    'duration': '1-2 hours',
                    'materials_needed': 'Spa supplies, candles, music'
                },
                {
                    'name': '🚶‍♀️ Mindful Walking',
                    'venue': 'Neighborhood',
                    'description': 'Go for a mindful walk! Focus on your surroundings, practice gratitude, and enjoy the present moment.',
                    'image_url': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Easy',
                    'duration': '30-60 minutes',
                    'materials_needed': 'Walking shoes, mindfulness'
                }
            ],
            'family': [
                {
                    'name': '👨‍👩‍👧‍👦 TikTok Family Dance',
                    'venue': 'Living Room',
                    'description': 'Learn and perform viral TikTok dances as a family! Create your own choreography and film it.',
                    'image_url': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop',
                    'tiktok_trend': True,
                    'cultural_game': False,
                    'difficulty': 'Medium',
                    'duration': '1-2 hours',
                    'materials_needed': 'Music, camera, energy'
                },
                {
                    'name': '🎮 Family Game Tournament',
                    'venue': 'Home',
                    'description': 'Have a family game tournament! Board games, card games, or create your own family challenges.',
                    'image_url': 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Easy',
                    'duration': '2-3 hours',
                    'materials_needed': 'Games, snacks, family'
                },
                {
                    'name': '🎨 Family Art Project',
                    'venue': 'Home',
                    'description': 'Create a family art project! Paint, draw, or craft together. Display your masterpiece proudly!',
                    'image_url': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Easy',
                    'duration': '1-2 hours',
                    'materials_needed': 'Art supplies, creativity, family'
                }
            ],
            'racing': [
                {
                    'name': '🏁 TikTok Go-Kart Challenge',
                    'venue': 'Local Go-Kart Track',
                    'description': 'Try viral go-kart tricks and challenges! Film your fastest lap, drift attempts, or create obstacle courses.',
                    'image_url': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop',
                    'tiktok_trend': True,
                    'cultural_game': False,
                    'difficulty': 'Medium',
                    'duration': '1-2 hours',
                    'materials_needed': 'Go-kart track, camera, friends'
                },
                {
                    'name': '🏎️ Remote Control Car Racing',
                    'venue': 'Driveway/Park',
                    'description': 'Set up a remote control car race! Create tracks, obstacles, and compete for the fastest time.',
                    'image_url': 'https://images.unsplash.com/photo-1464983953574-0892a716854b?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Easy',
                    'duration': '1-2 hours',
                    'materials_needed': 'RC cars, batteries, track materials'
                },
                {
                    'name': '🏁 DIY Race Track',
                    'venue': 'Backyard',
                    'description': 'Create your own race track using chalk, cones, or household items! Race toy cars or bikes.',
                    'image_url': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Easy',
                    'duration': '1 hour',
                    'materials_needed': 'Chalk, cones, toy cars, creativity'
                },
                {
                    'name': '🏃‍♂️ TikTok Speed Challenge',
                    'venue': 'Park/Track',
                    'description': 'Try viral speed challenges! Sprint races, obstacle courses, or timed challenges.',
                    'image_url': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop',
                    'tiktok_trend': True,
                    'cultural_game': False,
                    'difficulty': 'Medium',
                    'duration': '30-60 minutes',
                    'materials_needed': 'Timer, space, energy'
                },
                {
                    'name': '🏁 Mario Kart Tournament',
                    'venue': 'Home',
                    'description': 'Host a Mario Kart tournament! Set up brackets, choose tracks, and crown a champion.',
                    'image_url': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Easy',
                    'duration': '2-3 hours',
                    'materials_needed': 'Gaming console, Mario Kart, friends'
                },
                {
                    'name': '🏎️ Hot Wheels Championship',
                    'venue': 'Home',
                    'description': 'Build elaborate Hot Wheels tracks and race! Create loops, jumps, and obstacles.',
                    'image_url': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop',
                    'tiktok_trend': False,
                    'cultural_game': True,
                    'difficulty': 'Easy',
                    'duration': '1-2 hours',
                    'materials_needed': 'Hot Wheels cars, track pieces, creativity'
                }
            ]
        }
        
        return templates.get(category, [
            {
                'name': '🎉 Fun Activity Night',
                'venue': 'Your Home',
                'description': 'Create your own fun! Pick a random activity, game, or challenge and enjoy quality time together.',
                'image_url': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
                'tiktok_trend': False,
                'cultural_game': True,
                'difficulty': 'Easy',
                'duration': '1-2 hours',
                'materials_needed': 'Creativity, energy, fun'
            }
        ])

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
            start_time = None
            if start_data.get('localDate'):
                try:
                    date_str = start_data.get('localDate')
                    time_str = start_data.get('localTime', '00:00:00')
                    datetime_str = f"{date_str} {time_str}"
                    start_time = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M:%S')
                except (ValueError, TypeError):
                    start_time = None
            
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
            
            # Get price range and currency
            price_ranges = event_data.get('priceRanges', [])
            price = 'Varies'
            currency = None
            price_min = None
            price_max = None
            if price_ranges:
                min_price = price_ranges[0].get('min', 0)
                max_price = price_ranges[0].get('max', 0)
                currency = price_ranges[0].get('currency')
                price_min = min_price
                price_max = max_price
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
            
            # Create diverse descriptions for Ticketmaster events
            import random
            
            # Generate varied description patterns based on event type
            description_patterns = []
            
            # Check if it's a comedy event
            is_comedy = any('comedy' in cls.lower() for cls in classification_names)
            is_music = any(cls.lower() in ['music', 'concerts', 'pop', 'rock', 'jazz', 'classical'] for cls in classification_names)
            is_sports = any('sports' in cls.lower() for cls in classification_names)
            is_theatre = any(cls.lower() in ['theatre', 'theater', 'arts'] for cls in classification_names)
            
            if is_comedy:
                description_patterns = [
                    f"Get ready to laugh at {name}! An evening of hilarious comedy awaits.",
                    f"Don't miss {name} - guaranteed laughs and great entertainment.",
                    f"Join the fun at {name} for an unforgettable comedy experience.",
                    f"Laugh out loud at {name} featuring top-notch comedic talent.",
                    f"Experience side-splitting humor at {name}."
                ]
            elif is_music:
                description_patterns = [
                    f"Experience amazing live music at {name}.",
                    f"Don't miss {name} - an incredible musical performance.",
                    f"Enjoy fantastic live entertainment at {name}.",
                    f"Immerse yourself in great music at {name}.",
                    f"Catch {name} for an unforgettable musical journey."
                ]
            elif is_sports:
                description_patterns = [
                    f"Cheer on your team at {name}!",
                    f"Experience the excitement of {name}.",
                    f"Don't miss the action at {name}.",
                    f"Join the crowd for {name} - sports at its finest.",
                    f"Feel the energy at {name}."
                ]
            elif is_theatre:
                description_patterns = [
                    f"Be captivated by {name} - exceptional theatrical performance.",
                    f"Experience the magic of {name}.",
                    f"Don't miss this stunning production of {name}.",
                    f"Immerse yourself in the artistry of {name}.",
                    f"Witness brilliant performances at {name}."
                ]
            else:
                description_patterns = [
                    f"Join us for {name} - an exciting event you won't want to miss.",
                    f"Experience {name} at its finest.",
                    f"Don't miss out on {name}.",
                    f"Be part of {name} - great entertainment awaits.",
                    f"Discover what makes {name} special."
                ]
            
            # Pick a random pattern
            base_description = random.choice(description_patterns)
            
            # Add venue and location details
            if venue_name and venue_name != 'Unknown Venue':
                base_description += f" Taking place at {venue_name}"
                if address_line:
                    base_description += f" on {address_line}"
                base_description += "."
            elif address_line:
                base_description += f" Located at {address_line}."
            
            description = base_description
            
            # Get external URL and seat map
            external_url = event_data.get('url', '')
            seatmap_url = event_data.get('seatmap', {}).get('staticUrl', '')
            
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
                    'general_info': venue_data.get('generalInfo', {}).get('generalRule', ''),
                    'purchase_url': external_url,
                    'seatmap_url': seatmap_url,
                    'price_min': price_min,
                    'price_max': price_max,
                    'currency': currency,
                    'price_text': price
                }
            )
        except Exception as e:
            print(f"Error converting Ticketmaster event: {e}")
            return None



# Global instance
global_event_api = GlobalEventAPI()
