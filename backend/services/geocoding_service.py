#!/usr/bin/env python3
"""
Geocoding service to convert zip codes to coordinates
Uses free APIs for location conversion
"""

import aiohttp
import asyncio
import os
from typing import Optional, Tuple
from dotenv import load_dotenv

load_dotenv()

class GeocodingService:
    def __init__(self):
        self.api_keys = {
            'openstreetmap': None,  # Free, no API key needed
            'nominatim': None,      # Free, no API key needed
            'google': os.getenv('GOOGLE_GEOCODING_API_KEY')  # Optional, for better accuracy
        }
    
    async def get_coordinates_from_zipcode(self, zipcode: str) -> Optional[Tuple[float, float]]:
        """Convert zip code to latitude/longitude coordinates"""
        try:
            # Try multiple geocoding services
            coordinates = await self._try_nominatim_geocoding(zipcode)
            if coordinates:
                return coordinates
            
            coordinates = await self._try_openstreetmap_geocoding(zipcode)
            if coordinates:
                return coordinates
            
            if self.api_keys.get('google'):
                coordinates = await self._try_google_geocoding(zipcode)
                if coordinates:
                    return coordinates
            
            print(f"❌ Could not geocode zipcode: {zipcode}")
            return None
            
        except Exception as e:
            print(f"Geocoding error: {e}")
            return None
    
    async def _try_nominatim_geocoding(self, zipcode: str) -> Optional[Tuple[float, float]]:
        """Try Nominatim (OpenStreetMap) geocoding - FREE"""
        try:
            url = "https://nominatim.openstreetmap.org/search"
            params = {
                'postalcode': zipcode,
                'country': 'US',  # Focus on US zip codes
                'format': 'json',
                'limit': 1
            }
            
            headers = {
                'User-Agent': 'ChoosyApp/1.0'  # Required by Nominatim
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data and len(data) > 0:
                            result = data[0]
                            lat = float(result.get('lat', 0))
                            lon = float(result.get('lon', 0))
                            if lat != 0 and lon != 0:
                                print(f"📍 Nominatim geocoded {zipcode} to {lat}, {lon}")
                                return (lat, lon)
            
            return None
            
        except Exception as e:
            print(f"Nominatim geocoding error: {e}")
            return None
    
    async def _try_openstreetmap_geocoding(self, zipcode: str) -> Optional[Tuple[float, float]]:
        """Try OpenStreetMap geocoding - FREE"""
        try:
            url = "https://nominatim.openstreetmap.org/search"
            params = {
                'q': f"{zipcode}, USA",
                'format': 'json',
                'limit': 1
            }
            
            headers = {
                'User-Agent': 'ChoosyApp/1.0'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data and len(data) > 0:
                            result = data[0]
                            lat = float(result.get('lat', 0))
                            lon = float(result.get('lon', 0))
                            if lat != 0 and lon != 0:
                                print(f"📍 OpenStreetMap geocoded {zipcode} to {lat}, {lon}")
                                return (lat, lon)
            
            return None
            
        except Exception as e:
            print(f"OpenStreetMap geocoding error: {e}")
            return None
    
    async def _try_google_geocoding(self, zipcode: str) -> Optional[Tuple[float, float]]:
        """Try Google Geocoding API (if API key available)"""
        if not self.api_keys.get('google'):
            return None
            
        try:
            url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {
                'address': f"{zipcode}, USA",
                'key': self.api_keys['google']
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        results = data.get('results', [])
                        if results:
                            location = results[0].get('geometry', {}).get('location', {})
                            lat = location.get('lat', 0)
                            lng = location.get('lng', 0)
                            if lat != 0 and lng != 0:
                                print(f"📍 Google geocoded {zipcode} to {lat}, {lng}")
                                return (lat, lng)
            
            return None
            
        except Exception as e:
            print(f"Google geocoding error: {e}")
            return None
    
    async def get_zipcode_from_coordinates(self, lat: float, lng: float) -> Optional[str]:
        """Reverse geocode lat/lng to zipcode using Nominatim (OpenStreetMap)"""
        try:
            url = "https://nominatim.openstreetmap.org/reverse"
            params = {
                'lat': lat,
                'lon': lng,
                'format': 'json',
                'addressdetails': 1
            }
            headers = {
                'User-Agent': 'ChoosyApp/1.0'
            }
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        address = data.get('address', {})
                        zipcode = address.get('postcode')
                        if zipcode:
                            print(f"📦 Reverse geocoded {lat},{lng} to {zipcode}")
                            return zipcode
            return None
        except Exception as e:
            print(f"Reverse geocoding error: {e}")
            return None
    
    def get_city_from_coordinates(self, lat: float, lng: float) -> str:
        """Get city name from coordinates (simplified)"""
        # This is a simplified version - in production you'd use reverse geocoding
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
        elif 29.7 <= lat <= 29.8 and -95.4 <= lng <= -95.3:
            return "Houston"
        elif 39.9 <= lat <= 40.0 and -75.2 <= lng <= -75.1:
            return "Philadelphia"
        elif 33.7 <= lat <= 33.8 and -84.4 <= lng <= -84.3:
            return "Atlanta"
        elif 42.3 <= lat <= 42.4 and -83.1 <= lng <= -83.0:
            return "Detroit"
        elif 47.6 <= lat <= 47.7 and -122.4 <= lng <= -122.3:
            return "Seattle"
        else:
            return "Local Area"

# Global instance
geocoding_service = GeocodingService() 