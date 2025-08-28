interface LocationData {
  zipCode: string;
  city: string;
  state: string;
  country: string;
  fullLocation: string;
  coordinates?: { lat: number; lng: number };
}

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
  };
}

interface GeolocationError {
  code: number;
  message: string;
  PERMISSION_DENIED: number;
  POSITION_UNAVAILABLE: number;
  TIMEOUT: number;
}

class LocationDetectionService {
  private reverseGeocodeCache: Map<string, LocationData> = new Map();

  /**
   * Get user's current location and return zip code + city info
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        console.log('Geolocation not supported');
        return null;
      }

      // Get current position
      const position = await this.getCurrentPosition();
      const { latitude, longitude } = position.coords;

      // Reverse geocode to get address info
      const locationData = await this.reverseGeocode(latitude, longitude);
      
      if (locationData) {
        // Cache the result
        const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
        this.reverseGeocodeCache.set(cacheKey, locationData);
      }

      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Get current position with timeout and error handling
   */
  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position as GeolocationPosition),
        (error: GeolocationError) => {
          console.log('Geolocation error:', error);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('Location permission denied. Please enable location access or enter your zip code manually.'));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error('Location information unavailable. Please enter your zip code manually.'));
              break;
            case error.TIMEOUT:
              reject(new Error('Location request timed out. Please enter your zip code manually.'));
              break;
            default:
              reject(new Error('Unable to get your location. Please enter your zip code manually.'));
          }
        },
        options
      );
    });
  }

  /**
   * Reverse geocode coordinates to get address information using free services
   */
  private async reverseGeocode(lat: number, lng: number): Promise<LocationData | null> {
    try {
      // Primary: Use OpenStreetMap's Nominatim service (completely free)
      const locationData = await this.reverseGeocodeNominatim(lat, lng);
      if (locationData) {
        return locationData;
      }

      // Fallback: Use a simple coordinate-based approximation
      return this.getApproximateLocationFromCoordinates(lat, lng);

    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return this.getApproximateLocationFromCoordinates(lat, lng);
    }
  }

  /**
   * Use OpenStreetMap's Nominatim service for reverse geocoding (FREE)
   */
  private async reverseGeocodeNominatim(lat: number, lng: number): Promise<LocationData | null> {
    try {
      // Use Nominatim with proper headers and rate limiting
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'ChoosyApp/1.0 (https://choosy.app; contact@choosy.app)',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Nominatim request failed');
      }

      const data = await response.json();
      const address = data.address;

      if (!address) {
        throw new Error('No address data returned');
      }

      // Debug: Log what we received
      console.log('📍 Nominatim response:', { lat, lng, address, display_name: data.display_name });

      // Extract postal code (works internationally)
      let zipCode = address.postcode || 
                   address.postal_code || 
                   address.zip;

      // If no postal code in address, try to extract from display_name
      if (!zipCode && data.display_name) {
        const displayName = data.display_name;
        // Look for postal code patterns in display name
        const zipMatch = displayName.match(/\b\d{5}(?:-\d{4})?\b/); // US ZIP codes
        const ukPostcodeMatch = displayName.match(/\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/i); // UK postcodes
        const canadaPostcodeMatch = displayName.match(/\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/i); // Canada postcodes
        
        if (zipMatch) {
          zipCode = zipMatch[0];
        } else if (ukPostcodeMatch) {
          zipCode = ukPostcodeMatch[0];
        } else if (canadaPostcodeMatch) {
          zipCode = canadaPostcodeMatch[0];
        }
      }

      // If still no zip code, use a fallback based on coordinates
      if (!zipCode) {
        zipCode = this.getApproximateZipCode(lat, lng);
      }

      // Extract city (works internationally)
      const city = address.city || 
                   address.town || 
                   address.village || 
                   address.municipality ||
                   address.county ||
                   'Unknown City';

      // Extract state/province (works internationally)
      const state = address.state || 
                    address.province || 
                    address.region ||
                    'Unknown State';

      // Extract country
      const country = address.country || 'Unknown Country';

      // Format full location string
      const locationParts = [city, state, country].filter(Boolean);
      const fullLocation = locationParts.join(', ');

      console.log('📍 Extracted location data:', { zipCode, city, state, country, fullLocation });

      return {
        zipCode,
        city,
        state,
        country,
        fullLocation,
        coordinates: { lat, lng }
      };

    } catch (error) {
      console.error('Nominatim geocoding error:', error);
      return null;
    }
  }

  /**
   * Get approximate zip code based on coordinates (fallback)
   */
  private getApproximateZipCode(lat: number, lng: number): string {
    // This is a very basic approximation for major US cities
    // In a real app, you'd use a more sophisticated geocoding service
    
    // New York City area
    if (lat >= 40.4 && lat <= 40.9 && lng >= -74.3 && lng <= -73.7) {
      return '10001'; // Manhattan
    }
    // Los Angeles area
    if (lat >= 33.7 && lat <= 34.3 && lng >= -118.7 && lng <= -118.1) {
      return '90210'; // Beverly Hills
    }
    // Chicago area
    if (lat >= 41.6 && lat <= 42.1 && lng >= -87.9 && lng <= -87.5) {
      return '60601'; // Downtown Chicago
    }
    // Miami area
    if (lat >= 25.6 && lat <= 26.2 && lng >= -80.4 && lng <= -80.1) {
      return '33101'; // Downtown Miami
    }
    // San Francisco area
    if (lat >= 37.6 && lat <= 37.9 && lng >= -122.6 && lng <= -122.3) {
      return '94102'; // San Francisco
    }
    
    // Default fallback
    return '10001'; // Default to NYC
  }

  /**
   * Fallback method to get approximate location when geocoding fails
   */
  private getApproximateLocationFromCoordinates(lat: number, lng: number): LocationData | null {
    // Simple fallback based on coordinates
    // This is a very basic approximation - in practice, Nominatim should work
    const isUS = lat > 24 && lat < 72 && lng > -180 && lng < -66;
    
    return {
      zipCode: 'Unknown',
      city: 'Unknown City',
      state: 'Unknown State',
      country: isUS ? 'United States' : 'Unknown Country',
      fullLocation: `Location near ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      coordinates: { lat, lng }
    };
  }

  /**
   * Get location from zip code using free services
   */
  async getLocationFromZipCode(zipCode: string): Promise<LocationData | null> {
    try {
      // Use Nominatim to get location from zip code
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(zipCode)}&addressdetails=1&limit=1`,
        {
          headers: {
            'User-Agent': 'ChoosyApp/1.0 (https://choosy.app; contact@choosy.app)',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding API request failed');
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        throw new Error('Invalid zip code');
      }

      const result = data[0];
      const address = result.address;
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);

      // Extract address components
      const city = address.city || 
                   address.town || 
                   address.village || 
                   address.municipality ||
                   address.county ||
                   'Unknown City';

      const state = address.state || 
                    address.province || 
                    address.region ||
                    'Unknown State';

      const country = address.country || 'Unknown Country';

      const locationParts = [city, state, country].filter(Boolean);
      const fullLocation = locationParts.join(', ');

      return {
        zipCode,
        city,
        state,
        country,
        fullLocation,
        coordinates: { lat, lng }
      };

    } catch (error) {
      console.error('Error getting location from zip code:', error);
      return null;
    }
  }

  /**
   * Check if location services are available
   */
  isLocationSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Get cached location data
   */
  getCachedLocation(lat: number, lng: number): LocationData | null {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    return this.reverseGeocodeCache.get(cacheKey) || null;
  }
}

// Export singleton instance
export const locationDetection = new LocationDetectionService();
export type { LocationData }; 