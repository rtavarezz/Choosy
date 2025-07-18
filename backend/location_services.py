import os
import requests
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

class LocationService:
    def __init__(self):
        # No API keys needed - using free services
        self.user_agent = "ChoosyApp/1.0 (https://choosy.app; contact@choosy.app)"
    
    def get_places_by_zipcode(self, zipcode: str, category: str = None, radius: int = 5000) -> List[Dict]:
        """
        Get real places near a zipcode using free services
        """
        try:
            # First, get coordinates for the zipcode using free geocoding
            coords = self._get_coordinates_from_zipcode(zipcode)
            if not coords:
                return self._get_mock_places(zipcode, category)
            
            lat, lng = coords
            
            # Get places using free services
            places = self._get_places_from_free_apis(lat, lng, category, radius)
            
            if places:
                return self._convert_to_events(places, category)
            else:
                return self._get_mock_places(zipcode, category)
            
        except Exception as e:
            print(f"Error fetching places: {e}")
            return self._get_mock_places(zipcode, category)
    
    def _get_coordinates_from_zipcode(self, zipcode: str) -> Optional[tuple]:
        """Get lat/lng coordinates from zipcode using free Nominatim service"""
        try:
            url = "https://nominatim.openstreetmap.org/search"
            params = {
                'q': zipcode,
                'format': 'json',
                'limit': 1,
                'addressdetails': 1
            }
            headers = {
                'User-Agent': self.user_agent,
                'Accept-Language': 'en-US,en;q=0.9'
            }
            
            response = requests.get(url, params=params, headers=headers)
            if response.status_code == 200:
                data = response.json()
                if data:
                    result = data[0]
                    return (float(result['lat']), float(result['lon']))
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
            'gokart': {'leisure': 'sports_centre'},
            'swimming': {'leisure': 'swimming_pool'},
            'drinks': {'amenity': 'bar'}
        }
        return mapping.get(category, {'amenity': 'restaurant'})
    
    def _convert_osm_element_to_place(self, element: Dict, category: str) -> Optional[Dict]:
        """Convert OSM element to our place format"""
        try:
            tags = element.get('tags', {})
            name = tags.get('name', 'Unknown Place')
            
            # Skip unnamed places
            if name == 'Unknown Place':
                return None
            
            # Get coordinates
            lat = element.get('lat', 0)
            lon = element.get('lon', 0)
            
            # Get additional details
            phone = tags.get('phone', 'N/A')
            website = tags.get('website', 'N/A')
            opening_hours = tags.get('opening_hours', 'Hours not available')
            
            return {
                'id': f"osm_{element.get('id')}",
                'name': name,
                'image': self._get_place_image(category),
                'hours': opening_hours,
                'contact': {
                    'phone': phone,
                    'address': f"{lat:.4f}, {lon:.4f}",
                    'website': website
                },
                'reviews': {
                    'stars': 4.0,  # Default rating for OSM places
                    'count': 0
                },
                'source_type': 'osm',
                'metadata': {
                    'osm_id': element.get('id'),
                    'osm_type': element.get('type'),
                    'tags': tags,
                    'coordinates': {'lat': lat, 'lng': lon}
                }
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
            'gokart': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
            'swimming': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
            'drinks': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop'
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
                'source_type': place.get('source_type', 'osm'),
                'metadata': place.get('metadata', {})
            }
            events.append(event)
        
        return events
    
    def _get_mock_places(self, zipcode: str, category: str) -> List[Dict]:
        """Fallback mock data when free APIs are not available"""
        mock_data = {
            'foodie': [
                {
                    'id': f'mock_food_1_{zipcode}',
                    'name': 'Local Bistro',
                    'image': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
                    'hours': '11:00 AM - 10:00 PM',
                    'contact': {'phone': '(555) 123-4567', 'address': f'{zipcode} Area'},
                    'reviews': {'stars': 4.5, 'count': 127},
                    'source_type': 'mock'
                }
            ],
            'nightlife': [
                {
                    'id': f'mock_night_1_{zipcode}',
                    'name': 'Downtown Lounge',
                    'image': 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop',
                    'hours': '6:00 PM - 2:00 AM',
                    'contact': {'phone': '(555) 234-5678', 'address': f'{zipcode} Area'},
                    'reviews': {'stars': 4.2, 'count': 89},
                    'source_type': 'mock'
                }
            ]
        }
        
        return mock_data.get(category, mock_data['foodie'])

# Global instance
location_service = LocationService() 