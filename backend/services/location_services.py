import asyncio
import aiohttp
import requests
import os
from typing import List, Dict, Optional
from dotenv import load_dotenv
from services.geocoding_service import geocoding_service 

load_dotenv()

class LocationService:
    def __init__(self):
        # No API keys needed - using free services
        self.user_agent = "ChoosyApp/1.0 (https://choosy.app; contact@choosy.app)"
    
    async def get_places_by_zipcode(self, zipcode: str, category: str = None, radius: int = 5000) -> List[Dict]:
        """
        Get real events near a zipcode using global APIs - NO MOCK DATA
        """
        try:
            # Get real events from global APIs
            events = await self.get_real_events(zipcode, category or 'foodie')
            
            if events:
                return events
            else:
                # Only fallback to venue-based suggestions if no global API events found
                print(f"⚠️ No global API events found, using venue suggestions as fallback")
                coords = await self._get_coordinates_from_zipcode(zipcode)
                if coords:
                    lat, lng = coords
                    places = self._get_places_from_free_apis(lat, lng, category, radius)
                    return self._convert_to_events(places, category)
                else:
                    return []
            
        except Exception as e:
            print(f"Error fetching real events: {e}")
            return []
    
    async def _get_coordinates_from_zipcode(self, zipcode: str) -> Optional[tuple]:
        """Get coordinates from zipcode using geocoding service"""
        try:
            coordinates = await geocoding_service.get_coordinates_from_zipcode(zipcode)
            if coordinates:
                return coordinates
            else:
                print(f"❌ Could not get coordinates for zipcode: {zipcode}")
                return None
        except Exception as e:
            print(f"Error getting coordinates: {e}")
            return None
    
    def _get_places_from_free_apis(self, lat: float, lng: float, category: str, radius: int) -> List[Dict]:
        """Get places using free APIs and services"""
        places = []
        
        try:
            # Use OpenStreetMap's Overpass API for POI data (completely free)
            places.extend(self._get_places_from_overpass(lat, lng, category, radius))
            
            # Use Foursquare's free tier (if available)
            # places.extend(self._get_places_from_foursquare(lat, lng, category, radius))
            
        except Exception as e:
            print(f"Error getting places from free APIs: {e}")
        
        return places
    
    def _get_places_from_overpass(self, lat: float, lng: float, category: str, radius: int) -> List[Dict]:
        """Get places using OpenStreetMap's Overpass API (FREE)"""
        try:
            # Map our categories to OSM tags
            osm_tags = self._map_category_to_osm_tags(category)
            
            places = []
            
            # Special handling for comedy to get more variety
            if category == 'comedy':
                comedy_queries = [
                    ('amenity', 'theatre'),
                    ('amenity', 'nightclub'),
                    ('amenity', 'bar'),
                    ('leisure', 'entertainment')
                ]
                
                for tag_key, tag_value in comedy_queries:
                    # Build Overpass query
                    query = f"""
                    [out:json][timeout:25];
                    (
                      node["{tag_key}"="{tag_value}"](around:{radius},{lat},{lng});
                      way["{tag_key}"="{tag_value}"](around:{radius},{lat},{lng});
                      relation["{tag_key}"="{tag_value}"](around:{radius},{lat},{lng});
                    );
                    out body;
                    >>;
                    out skel qt;
                    """
                    
                    url = "https://overpass-api.de/api/interpreter"
                    response = requests.post(url, data=query, headers={'Content-Type': 'application/x-www-form-urlencoded'})
                    
                    if response.status_code == 200:
                        data = response.json()
                        if data.get('elements'):
                            # Convert OSM elements to our format
                            for element in data['elements'][:3]:  # Limit to 3 per category
                                place = self._convert_osm_element_to_place(element, category)
                                if place:
                                    places.append(place)
            
            # Special handling for racing to get racing-related venues
            elif category == 'racing':
                racing_queries = [
                    ('leisure', 'go_kart_track'),
                    ('sport', 'karting'),
                    ('leisure', 'race_track'),
                    ('leisure', 'sports_centre'),  # Fallback to sports centers
                    ('amenity', 'entertainment')   # Entertainment venues
                ]
                
                for tag_key, tag_value in racing_queries:
                    # Build Overpass query
                    query = f"""
                    [out:json][timeout:25];
                    (
                      node["{tag_key}"="{tag_value}"](around:{radius},{lat},{lng});
                      way["{tag_key}"="{tag_value}"](around:{radius},{lat},{lng});
                      relation["{tag_key}"="{tag_value}"](around:{radius},{lat},{lng});
                    );
                    out body;
                    >>;
                    out skel qt;
                    """
                    
                    url = "https://overpass-api.de/api/interpreter"
                    response = requests.post(url, data=query, headers={'Content-Type': 'application/x-www-form-urlencoded'})
                    
                    if response.status_code == 200:
                        data = response.json()
                        if data.get('elements'):
                            # Convert OSM elements to our format
                            for element in data['elements'][:2]:  # Limit to 2 per category
                                place = self._convert_osm_element_to_place(element, category)
                                if place:
                                    places.append(place)
            
            else:
                # Standard handling for other categories
                for tag_key, tag_value in osm_tags.items():
                    # Build Overpass query
                    query = f"""
                    [out:json][timeout:25];
                    (
                      node["{tag_key}"="{tag_value}"](around:{radius},{lat},{lng});
                      way["{tag_key}"="{tag_value}"](around:{radius},{lat},{lng});
                      relation["{tag_key}"="{tag_value}"](around:{radius},{lat},{lng});
                    );
                    out body;
                    >>;
                    out skel qt;
                    """
                    
                    url = "https://overpass-api.de/api/interpreter"
                    response = requests.post(url, data=query, headers={'Content-Type': 'application/x-www-form-urlencoded'})
                    
                    if response.status_code == 200:
                        data = response.json()
                        if data.get('elements'):
                            # Convert OSM elements to our format
                            for element in data['elements'][:5]:  # Limit to 5 per category
                                place = self._convert_osm_element_to_place(element, category)
                                if place:
                                    places.append(place)
            
            return places
            
        except Exception as e:
            print(f"Error getting places from Overpass: {e}")
            return []
    
    def _map_category_to_osm_tags(self, category: str) -> Dict[str, str]:
        """Map our categories to OpenStreetMap tags"""
        mapping = {
            'foodie': {'amenity': 'restaurant'},
            'nightlife': {'amenity': 'bar'},
            'concerts': {'amenity': 'theatre'},
            'datenight': {'amenity': 'restaurant'},
            'sports': {'leisure': 'sports_centre'},
            'parks': {'leisure': 'park'},
            'racing': {'leisure': 'go_kart_track', 'sport': 'karting', 'leisure': 'race_track'},
            'swimming': {'leisure': 'swimming_pool'},
            'drinks': {'amenity': 'bar'},
            'movies': {'amenity': 'cinema'},
            'comedy': {'amenity': 'theatre'},
            'art': {'amenity': 'museum'},
            'shopping': {'shop': 'mall'},
            'wellness': {'leisure': 'fitness_centre'},
            'adventure': {'leisure': 'park'},
            'family': {'leisure': 'park'}
        }
        return mapping.get(category, {'amenity': 'restaurant'})
    
    def _get_venue_specific_image(self, venue_name: str, category: str) -> str:
        """Get venue-specific image based on name and category"""
        venue_name_lower = venue_name.lower()
        
        # Comedy venues
        if category == 'comedy':
            if 'cellar' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'
            elif 'laugh' in venue_name_lower or 'comedy' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'
            elif 'theatre' in venue_name_lower or 'theater' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'
            elif 'club' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'
            else:
                return 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'
        
        # Food venues
        elif category == 'foodie':
            if 'restaurant' in venue_name_lower or 'bistro' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop'
            elif 'pizza' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
            elif 'sushi' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop'
            elif 'burger' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
            else:
                return 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop'
        
        # Nightlife venues
        elif category == 'nightlife':
            if 'bar' in venue_name_lower or 'pub' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop'
            elif 'club' in venue_name_lower or 'nightclub' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop'
            elif 'lounge' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop'
            else:
                return 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop'
        
        # Concert venues
        elif category == 'concerts':
            if 'theatre' in venue_name_lower or 'theater' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop'
            elif 'arena' in venue_name_lower or 'stadium' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop'
            elif 'hall' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop'
            else:
                return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop'
        
        # Sports venues
        elif category == 'sports':
            if 'gym' in venue_name_lower or 'fitness' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop'
            elif 'tennis' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop'
            elif 'basketball' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop'
            else:
                return 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop'
        
        # Racing venues
        elif category == 'racing':
            if 'kart' in venue_name_lower or 'racing' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop'
            elif 'track' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1464983953574-0892a716854b?w=400&h=300&fit=crop'
            elif 'speed' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop'
            else:
                return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop'
        
        # Parks and outdoor activities
        elif category == 'parks':
            if 'park' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop'
            elif 'garden' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop'
            else:
                return 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop'
        
        # Art and culture
        elif category == 'art':
            if 'museum' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop'
            elif 'gallery' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop'
            else:
                return 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop'
        
        # Movies
        elif category == 'movies':
            if 'cinema' in venue_name_lower or 'theater' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop'
            else:
                return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop'
        
        # Shopping
        elif category == 'shopping':
            if 'mall' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop'
            elif 'store' in venue_name_lower or 'shop' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop'
            else:
                return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop'
        
        # Wellness and spa
        elif category == 'wellness':
            if 'spa' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop'
            elif 'massage' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop'
            else:
                return 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop'
        
        # Adventure activities
        elif category == 'adventure':
            if 'park' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop'
            elif 'trail' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop'
            else:
                return 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop'
        
        # Family activities
        elif category == 'family':
            if 'park' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop'
            elif 'playground' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop'
            else:
                return 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop'
        
        # Date night (restaurants and romantic venues)
        elif category == 'datenight':
            if 'restaurant' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop'
            elif 'cafe' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop'
            else:
                return 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop'
        
        # Drinks (bars and lounges)
        elif category == 'drinks':
            if 'bar' in venue_name_lower or 'pub' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop'
            elif 'wine' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop'
            else:
                return 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop'
        
        # Racing venues
        elif category == 'racing':
            if 'kart' in venue_name_lower or 'racing' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop'
            elif 'track' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1464983953574-0892a716854b?w=400&h=300&fit=crop'
            elif 'speed' in venue_name_lower:
                return 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop'
            else:
                return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop'
        
        # Default to category image
        return self._get_place_image(category)

    def _convert_osm_element_to_place(self, element: Dict, category: str) -> Optional[Dict]:
        """Convert OSM element to place format"""
        try:
            if element.get('type') == 'node' or element.get('type') == 'way':
                tags = element.get('tags', {})
                name = tags.get('name') or tags.get('brand') or tags.get('operator') or 'Unknown Venue'
                
                # Get coordinates
                lat = element.get('lat') or element.get('center', {}).get('lat')
                lon = element.get('lon') or element.get('center', {}).get('lon')
                
                if not lat or not lon:
                    return None
                
                # Get address components
                address = tags.get('addr:street', '')
                city = tags.get('addr:city', '') or tags.get('city', '')
                state = tags.get('addr:state', '') or tags.get('state', '')
                zip_code = tags.get('addr:postcode', '') or tags.get('postcode', '')
                
                # Get phone if available
                phone = tags.get('phone') or tags.get('contact:phone', '')
                
                # Get hours if available
                hours = tags.get('opening_hours') or tags.get('hours', 'Hours not available')
                
                return {
                    'id': f"osm_{element.get('id')}",
                    'name': name,
                    'venue': name,
                    'address': address,
                    'city': city,
                    'state': state,
                    'zip_code': zip_code,
                    'phone': phone,
                    'hours': hours,
                    'source': 'google',  # Using google as the source type
                    'source_type': 'google',  # Using google as the source type
                    'category': category,
                    'image_url': self._get_place_image(category),
                    'price': 'Varies',
                    'description': f"Visit {name} for {category} activities. Located at {address}."
                }
        except Exception as e:
            print(f"Error converting OSM element: {e}")
            return None
    
    def _get_place_image(self, category: str) -> str:
        """Get a relevant image for the category"""
        images = {
            'foodie': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
            'nightlife': 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop',
            'concerts': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
            'datenight': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop',
            'sports': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
            'parks': 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop',
            'swimming': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
            'drinks': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
            'movies': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop',
            'comedy': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
            'art': 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
            'shopping': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
            'wellness': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
            'adventure': 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop',
            'family': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
            'racing': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop'
        }
        return images.get(category, images['foodie'])
    
    def _convert_to_events(self, places: List[Dict], category: str) -> List[Dict]:
        """Convert places to our event format"""
        events = []
        
        for place in places:
            event = {
                'id': place.get('id'),
                'name': place.get('name', 'Unknown'),
                'image': place.get('image'),
                'hours': place.get('hours', 'Hours not available'),
                'contact': place.get('contact', {}),
                'reviews': place.get('reviews', {'stars': 4.0, 'count': 0}),
                'source_type': place.get('source_type', 'google'),
                'metadata': place.get('metadata', {})
            }
            events.append(event)
        
        return events
    
    async def get_real_events(self, zipcode: str, category: str) -> List[Dict]:
        """Get real events from global APIs - NO MOCK DATA"""
        try:
            # Get coordinates from zipcode
            coords = await self._get_coordinates_from_zipcode(zipcode)
            if not coords:
                print(f"❌ Could not get coordinates for zipcode: {zipcode}")
                return []
            
            lat, lng = coords
            print(f"📍 Coordinates: {lat}, {lng}")
            
            # Use the global event API to get real events
            try:
                from services.global_event_apis import GlobalEventAPI
                global_event_api = GlobalEventAPI()
                events = await global_event_api.get_events_for_location(
                    lat=lat, 
                    lng=lng, 
                    category=category, 
                    radius=5000,  # 5km radius
                    limit=20
                )
                
                if events:
                    print(f"✅ Found {len(events)} real events from APIs for {category}")
                    return [self._convert_global_event_to_dict(event) for event in events]
                else:
                    print(f"⚠️ No events found from global APIs for {category}")
                    return []
            except Exception as e:
                print(f"Global event APIs not available: {e}")
                return []
            
        except Exception as e:
            print(f"❌ Error getting real events: {e}")
            return []
    
    def _convert_global_event_to_dict(self, event) -> Dict:
        """Convert GlobalEvent to dictionary format for frontend"""
        return {
            'id': event.id,
            'name': event.name,
            'description': event.description,
            'image_url': event.image_url,
            'start_time': event.start_time if isinstance(event.start_time, str) else (event.start_time.isoformat() if event.start_time else None),
            'end_time': event.end_time if isinstance(event.end_time, str) else (event.end_time.isoformat() if event.end_time else None),
            'venue': event.venue,
            'address': event.address,
            'city': event.city,
            'state': event.state,
            'zip_code': event.zip_code,
            'price': event.price,
            'category': event.category,
            'source': event.source.value if event.source else 'unknown',
            'external_id': event.external_id,
            'external_url': event.external_url,
            'organizer': event.organizer,
            'attendees_count': event.attendees_count,
            'max_attendees': event.max_attendees,
            'is_free': event.is_free,
            'is_featured': event.is_featured,
            # Include metadata fields for contact info and hours
            'phone': event.metadata.get('phone') if event.metadata else None,
    
            'hours': event.metadata.get('hours') if event.metadata else None,
            # Include all metadata for fun activities
            'metadata': event.metadata if event.metadata else {},
        }

    def _get_hardcoded_racing_venues(self, zipcode: str) -> List[Dict]:
        """Get hardcoded racing venues for major cities"""
        # Map zip codes to nearby racing venues
        racing_venues = {
            # NYC area
            '10001': [
                {
                    'id': 'racing_nyc_1',
                    'name': 'New York Karting Association',
                    'image': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop',
                    'hours': '10:00 AM - 10:00 PM',
                    'contact': {
                        'phone': '(718) 389-0000',
                        'address': 'Brooklyn, NY',
                        'website': 'https://nyka.com'
                    },
                    'reviews': {'stars': 4.5, 'count': 234},
                    'source_type': 'hardcoded',
                    'metadata': {'distance': '15 min drive'}
                },
                {
                    'id': 'racing_nyc_2',
                    'name': 'Jersey Shore Karting',
                    'image': 'https://images.unsplash.com/photo-1464983953574-0892a716854b?w=400&h=300&fit=crop',
                    'hours': '11:00 AM - 9:00 PM',
                    'contact': {
                        'phone': '(732) 449-0000',
                        'address': 'Jersey Shore, NJ',
                        'website': 'https://jerseyshorekarting.com'
                    },
                    'reviews': {'stars': 4.3, 'count': 156},
                    'source_type': 'hardcoded',
                    'metadata': {'distance': '45 min drive'}
                }
            ],
            # Chicago area
            '60601': [
                {
                    'id': 'racing_chi_1',
                    'name': 'Joliet Speedway',
                    'image': 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop',
                    'hours': '9:00 AM - 6:00 PM',
                    'contact': {
                        'phone': '(815) 727-0000',
                        'address': 'Joliet, IL',
                        'website': 'https://jolietspeedway.com'
                    },
                    'reviews': {'stars': 4.7, 'count': 445},
                    'source_type': 'hardcoded',
                    'metadata': {'distance': '40 min drive'}
                },
                {
                    'id': 'racing_chi_2',
                    'name': 'Chicago Indoor Racing',
                    'image': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop',
                    'hours': '12:00 PM - 10:00 PM',
                    'contact': {
                        'phone': '(312) 555-0000',
                        'address': 'Chicago, IL',
                        'website': 'https://chicagoindoorracing.com'
                    },
                    'reviews': {'stars': 4.4, 'count': 189},
                    'source_type': 'hardcoded',
                    'metadata': {'distance': '20 min drive'}
                }
            ],
            # LA area
            '90210': [
                {
                    'id': 'racing_la_1',
                    'name': 'K1 Speed Los Angeles',
                    'image': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop',
                    'hours': '11:00 AM - 11:00 PM',
                    'contact': {
                        'phone': '(310) 555-0000',
                        'address': 'Los Angeles, CA',
                        'website': 'https://k1speed.com'
                    },
                    'reviews': {'stars': 4.6, 'count': 312},
                    'source_type': 'hardcoded',
                    'metadata': {'distance': '25 min drive'}
                }
            ]
        }
        
        return racing_venues.get(zipcode, [])

    def _get_hardcoded_venues(self, zipcode: str, category: str) -> List[Dict]:
        """Get hardcoded venues for major cities and categories"""
        venues = {
            # NYC area (10001)
            '10001': {
                'foodie': [
                    {
                        'id': 'foodie_nyc_1',
                        'name': 'Katz\'s Delicatessen',
                        'image': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
                        'hours': '8:00 AM - 10:00 PM',
                        'contact': {
                            'phone': '(212) 254-2246',
                            'address': '205 E Houston St, New York, NY',
                            'website': 'https://katzsdelicatessen.com'
                        },
                        'reviews': {'stars': 4.5, 'count': 1250},
                        'source_type': 'hardcoded',
                        'metadata': {'distance': '5 min walk'}
                    },
                    {
                        'id': 'foodie_nyc_2',
                        'name': 'Joe\'s Pizza',
                        'image': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
                        'hours': '11:00 AM - 11:00 PM',
                        'contact': {
                            'phone': '(212) 366-1182',
                            'address': '123 4th Ave, New York, NY',
                            'website': 'https://joespizzanyc.com'
                        },
                        'reviews': {'stars': 4.3, 'count': 890},
                        'source_type': 'hardcoded',
                        'metadata': {'distance': '8 min walk'}
                    }
                ],
                'nightlife': [
                    {
                        'id': 'nightlife_nyc_1',
                        'name': 'The Dead Rabbit',
                        'image': 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop',
                        'hours': '5:00 PM - 2:00 AM',
                        'contact': {
                            'phone': '(646) 422-7906',
                            'address': '30 Water St, New York, NY',
                            'website': 'https://deadrabbitnyc.com'
                        },
                        'reviews': {'stars': 4.7, 'count': 567},
                        'source_type': 'hardcoded',
                        'metadata': {'distance': '10 min walk'}
                    },
                    {
                        'id': 'nightlife_nyc_2',
                        'name': 'McSorley\'s Old Ale House',
                        'image': 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop',
                        'hours': '11:00 AM - 1:00 AM',
                        'contact': {
                            'phone': '(212) 473-9148',
                            'address': '15 E 7th St, New York, NY',
                            'website': 'https://mcsorleysoldalehouse.nyc'
                        },
                        'reviews': {'stars': 4.4, 'count': 1234},
                        'source_type': 'hardcoded',
                        'metadata': {'distance': '15 min walk'}
                    }
                ],
                'sports': [
                    {
                        'id': 'sports_nyc_1',
                        'name': 'Chelsea Piers',
                        'image': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
                        'hours': '6:00 AM - 11:00 PM',
                        'contact': {
                            'phone': '(212) 336-6666',
                            'address': '62 Chelsea Piers, New York, NY',
                            'website': 'https://chelseapiers.com'
                        },
                        'reviews': {'stars': 4.6, 'count': 789},
                        'source_type': 'hardcoded',
                        'metadata': {'distance': '20 min walk'}
                    },
                    {
                        'id': 'sports_nyc_2',
                        'name': 'Equinox Fitness',
                        'image': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
                        'hours': '5:30 AM - 11:00 PM',
                        'contact': {
                            'phone': '(212) 750-0000',
                            'address': '200 W 13th St, New York, NY',
                            'website': 'https://equinox.com'
                        },
                        'reviews': {'stars': 4.5, 'count': 456},
                        'source_type': 'hardcoded',
                        'metadata': {'distance': '12 min walk'}
                    }
                ],
                'concerts': [
                    {
                        'id': 'concerts_nyc_1',
                        'name': 'Madison Square Garden',
                        'image': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
                        'hours': 'Varies by event',
                        'contact': {
                            'phone': '(212) 465-6741',
                            'address': '4 Pennsylvania Plaza, New York, NY',
                            'website': 'https://msg.com'
                        },
                        'reviews': {'stars': 4.8, 'count': 2345},
                        'source_type': 'hardcoded',
                        'metadata': {'distance': '15 min walk'}
                    },
                    {
                        'id': 'concerts_nyc_2',
                        'name': 'Brooklyn Steel',
                        'image': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
                        'hours': 'Varies by event',
                        'contact': {
                            'phone': '(718) 942-0030',
                            'address': '319 Frost St, Brooklyn, NY',
                            'website': 'https://brooklynsteel.com'
                        },
                        'reviews': {'stars': 4.6, 'count': 1234},
                        'source_type': 'hardcoded',
                        'metadata': {'distance': '25 min subway'}
                    }
                ],
                'comedy': [
                    {
                        'id': 'comedy_nyc_1',
                        'name': 'Comedy Cellar',
                        'image': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
                        'hours': '7:00 PM - 12:00 AM',
                        'contact': {
                            'phone': '(212) 254-3480',
                            'address': '117 MacDougal St, New York, NY',
                            'website': 'https://comedycellar.com'
                        },
                        'reviews': {'stars': 4.7, 'count': 2345},
                        'source_type': 'hardcoded',
                        'metadata': {'distance': '8 min walk'}
                    },
                    {
                        'id': 'comedy_nyc_2',
                        'name': 'Gotham Comedy Club',
                        'image': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
                        'hours': '7:30 PM - 11:00 PM',
                        'contact': {
                            'phone': '(212) 367-9000',
                            'address': '208 W 23rd St, New York, NY',
                            'website': 'https://gothamcomedyclub.com'
                        },
                        'reviews': {'stars': 4.5, 'count': 1234},
                        'source_type': 'hardcoded',
                        'metadata': {'distance': '18 min walk'}
                    }
                ],
                'art': [
                    {
                        'id': 'art_nyc_1',
                        'name': 'The Metropolitan Museum of Art',
                        'image': 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
                        'hours': '10:00 AM - 5:30 PM',
                        'contact': {
                            'phone': '(212) 535-7710',
                            'address': '1000 5th Ave, New York, NY',
                            'website': 'https://metmuseum.org'
                        },
                        'reviews': {'stars': 4.8, 'count': 4567},
                        'source_type': 'hardcoded',
                        'metadata': {'distance': '25 min subway'}
                    },
                    {
                        'id': 'art_nyc_2',
                        'name': 'MoMA',
                        'image': 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
                        'hours': '10:30 AM - 5:30 PM',
                        'contact': {
                            'phone': '(212) 708-9400',
                            'address': '11 W 53rd St, New York, NY',
                            'website': 'https://moma.org'
                        },
                        'reviews': {'stars': 4.7, 'count': 3456},
                        'source_type': 'hardcoded',
                        'metadata': {'distance': '20 min subway'}
                    }
                ],
                'movies': [
                    {
                        'id': 'movies_nyc_1',
                        'name': 'AMC Empire 25',
                        'image': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop',
                        'hours': '10:00 AM - 12:00 AM',
                        'contact': {
                            'phone': '(212) 398-2597',
                            'address': '234 W 42nd St, New York, NY',
                            'website': 'https://amctheatres.com'
                        },
                        'reviews': {'stars': 4.3, 'count': 2345},
                        'source_type': 'hardcoded',
                        'metadata': {'distance': '12 min walk'}
                    },
                    {
                        'id': 'movies_nyc_2',
                        'name': 'Angelika Film Center',
                        'image': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop',
                        'hours': '11:00 AM - 11:00 PM',
                        'contact': {
                            'phone': '(212) 995-2000',
                            'address': '18 W Houston St, New York, NY',
                            'website': 'https://angelikafilmcenter.com'
                        },
                        'reviews': {'stars': 4.4, 'count': 1234},
                        'source_type': 'hardcoded',
                        'metadata': {'distance': '10 min walk'}
                    }
                ]
            }
        }
        
        return venues.get(zipcode, {}).get(category, [])

# Global instance
location_service = LocationService() 