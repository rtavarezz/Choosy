"""
API Configuration Template
Easy-to-update configuration for all topic categories and API integrations
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

class EventType(Enum):
    REAL_EVENT = "real_event"      # Real events from APIs
    REAL_VENUE = "real_venue"      # Real venues from APIs  
    FUN_ACTIVITY = "fun_activity"  # Fun offline activities (clearly marked)
    IDEA = "idea"                  # Creative ideas (clearly marked)
    MIXED = "mixed"               # Mixed activities (e.g., family fun, bored)

@dataclass
class APIConfig:
    """Configuration for a single API source"""
    name: str
    api_key_env: str
    base_url: str
    enabled: bool = True
    priority: int = 1  # Lower number = higher priority
    rate_limit: int = 1000
    timeout: int = 30

@dataclass
class TopicConfig:
    """Configuration for a single topic category"""
    key: str
    label: str
    icon: str
    description: str
    event_type: EventType
    api_sources: List[str]  # List of API source names
    search_keywords: List[str]
    exclude_keywords: List[str]
    fallback_activities: bool = True
    min_events_threshold: int = 2  # Only fallback if we have 0-1 real events

class APITemplateManager:
    """Template manager for easy API integration"""
    
    def __init__(self):
        self.api_configs = self._initialize_api_configs()
        self.topic_configs = self._initialize_topic_configs()
    
    def _initialize_api_configs(self) -> Dict[str, APIConfig]:
        """Initialize all API configurations"""
        return {
            'eventbrite': APIConfig(
                name='Eventbrite',
                api_key_env='EVENTBRITE_API_KEY',
                base_url='https://www.eventbriteapi.com/v3',
                enabled=True,
                priority=1,
                rate_limit=10000
            ),
            'ticketmaster': APIConfig(
                name='Ticketmaster',
                api_key_env='TICKETMASTER_API_KEY',
                base_url='https://app.ticketmaster.com/discovery/v2',
                enabled=True,
                priority=2,
                rate_limit=5000
            ),
            'meetup': APIConfig(
                name='Meetup',
                api_key_env='MEETUP_API_KEY',
                base_url='https://api.meetup.com',
                enabled=True,
                priority=3,
                rate_limit=5000
            ),
            'google_places': APIConfig(
                name='Google Places',
                api_key_env='GOOGLE_PLACES_API_KEY',
                base_url='https://maps.googleapis.com/maps/api/place',
                enabled=True,
                priority=4,
                rate_limit=100000
            ),
            'openstreetmap': APIConfig(
                name='OpenStreetMap',
                api_key_env='',  # No API key needed
                base_url='https://overpass-api.de/api/interpreter',
                enabled=True,
                priority=5,
                rate_limit=10000
            ),
            'yelp': APIConfig(
                name='Yelp',
                api_key_env='YELP_API_KEY',
                base_url='https://api.yelp.com/v3',
                enabled=False,  # Disabled by default
                priority=6,
                rate_limit=5000
            ),
            'facebook': APIConfig(
                name='Facebook',
                api_key_env='FACEBOOK_API_KEY',
                base_url='https://graph.facebook.com/v18.0',
                enabled=False,  # Disabled by default
                priority=7,
                rate_limit=200
            )
        }
    
    def _initialize_topic_configs(self) -> Dict[str, TopicConfig]:
        """Initialize all topic configurations with real API mappings"""
        return {
            'foodie': TopicConfig(
                key='foodie',
                label='Food & Dining',
                icon='🍔',
                description='Restaurants, food festivals, cooking classes, and culinary experiences',
                event_type=EventType.REAL_EVENT,
                api_sources=['eventbrite', 'meetup', 'google_places', 'yelp'],
                search_keywords=['food', 'restaurant', 'dining', 'eat', 'cuisine', 'bistro', 'cafe', 'deli', 'brunch', 'dinner', 'lunch', 'food festival', 'cooking class'],
                exclude_keywords=['gym', 'fitness', 'workout'],
                fallback_activities=True,
                min_events_threshold=2
            ),
            'datenight': TopicConfig(
                key='datenight',
                label='Date Night',
                icon='💕',
                description='Romantic restaurants, couples activities, and intimate experiences',
                event_type=EventType.REAL_EVENT,
                api_sources=['eventbrite', 'meetup', 'google_places', 'yelp'],
                search_keywords=['date', 'romantic', 'couple', 'dinner', 'night', 'love', 'romance', 'intimate'],
                exclude_keywords=['family', 'kids', 'children'],
                fallback_activities=True,
                min_events_threshold=2
            ),
            'concerts': TopicConfig(
                key='concerts',
                label='Concerts & Music',
                icon='🎵',
                description='Live music, concerts, music festivals, and performances',
                event_type=EventType.REAL_EVENT,
                api_sources=['eventbrite', 'ticketmaster', 'meetup', 'google_places'],
                search_keywords=['concert', 'music', 'band', 'live', 'gig', 'show', 'performance', 'festival', 'musician'],
                exclude_keywords=['movie', 'film', 'cinema'],
                fallback_activities=True,
                min_events_threshold=2
            ),
            'comedy': TopicConfig(
                key='comedy',
                label='Comedy & Entertainment',
                icon='😂',
                description='Stand-up comedy, improv shows, and entertainment events',
                event_type=EventType.REAL_EVENT,
                api_sources=['eventbrite', 'ticketmaster', 'meetup', 'google_places'],
                search_keywords=['comedy', 'stand-up', 'improv', 'comic', 'laugh', 'humor', 'entertainment'],
                exclude_keywords=['sport', 'fitness', 'workout'],
                fallback_activities=True,
                min_events_threshold=2
            ),
            'racing': TopicConfig(
                key='racing',
                label='Racing & Motorsports',
                icon='🏁',
                description='Go-kart racing, motorsports events, and racing experiences',
                event_type=EventType.REAL_EVENT,
                api_sources=['eventbrite', 'ticketmaster', 'meetup', 'google_places', 'openstreetmap'],
                search_keywords=['race', 'racing', 'motorsport', 'kart', 'go-kart', 'track', 'speedway', 'drag', 'auto', 'nascar', 'formula', 'indy', 'drift', 'motocross', 'monster truck', 'grand prix', 'f1', 'rally'],
                exclude_keywords=['ymca', 'pool', 'fitness', 'gym', 'swim', 'aquatic', 'recreation', 'community center'],
                fallback_activities=True,
                min_events_threshold=2
            ),
            'movies': TopicConfig(
                key='movies',
                label='Movies & Film',
                icon='🎬',
                description='Movie theaters, film festivals, and cinema experiences',
                event_type=EventType.REAL_VENUE,
                api_sources=['google_places', 'yelp', 'openstreetmap'],
                search_keywords=['movie', 'film', 'cinema', 'screening', 'theater', 'theatre'],
                exclude_keywords=['live', 'concert', 'music'],
                fallback_activities=True,
                min_events_threshold=2
            ),
            'shopping': TopicConfig(
                key='shopping',
                label='Shopping & Retail',
                icon='🛍️',
                description='Shopping centers, boutiques, markets, and retail experiences',
                event_type=EventType.REAL_VENUE,
                api_sources=['google_places', 'yelp', 'openstreetmap'],
                search_keywords=['shop', 'shopping', 'mall', 'store', 'boutique', 'market', 'retail', 'fashion'],
                exclude_keywords=['food', 'restaurant', 'dining'],
                fallback_activities=True,
                min_events_threshold=2
            ),
            'parks': TopicConfig(
                key='parks',
                label='Parks & Outdoors',
                icon='🌳',
                description='Parks, gardens, outdoor activities, and nature experiences',
                event_type=EventType.REAL_VENUE,
                api_sources=['google_places', 'openstreetmap', 'meetup'],
                search_keywords=['park', 'garden', 'nature', 'outdoor', 'trail', 'picnic', 'hiking', 'walking'],
                exclude_keywords=['indoor', 'gym', 'fitness'],
                fallback_activities=True,
                min_events_threshold=2
            ),
            'adventure': TopicConfig(
                key='adventure',
                label='Adventure & Thrills',
                icon='🧗',
                description='Escape rooms, VR experiences, adventure activities, and thrill-seeking',
                event_type=EventType.REAL_EVENT,
                api_sources=['eventbrite', 'meetup', 'google_places', 'openstreetmap'],
                search_keywords=['adventure', 'escape', 'vr', 'virtual', 'arcade', 'climb', 'zipline', 'explore', 'thrill', 'adrenaline'],
                exclude_keywords=['relax', 'spa', 'wellness'],
                fallback_activities=True,
                min_events_threshold=2
            ),
            'nightlife': TopicConfig(
                key='nightlife',
                label='Nightlife & Clubs',
                icon='🌙',
                description='Bars, clubs, nightlife venues, and evening entertainment',
                event_type=EventType.REAL_VENUE,
                api_sources=['google_places', 'yelp', 'meetup', 'openstreetmap'],
                search_keywords=['nightlife', 'club', 'bar', 'pub', 'dj', 'party', 'cocktail', 'lounge', 'night'],
                exclude_keywords=['family', 'kids', 'children', 'day'],
                fallback_activities=True,
                min_events_threshold=2
            ),
            'sports': TopicConfig(
                key='sports',
                label='Sports & Fitness',
                icon='⚽',
                description='Sports events, fitness activities, gyms, and athletic experiences',
                event_type=EventType.REAL_EVENT,
                api_sources=['eventbrite', 'meetup', 'google_places', 'openstreetmap'],
                search_keywords=['sport', 'game', 'match', 'tournament', 'league', 'athletic', 'fitness', 'gym', 'workout', 'training'],
                exclude_keywords=['food', 'restaurant', 'dining'],
                fallback_activities=True,
                min_events_threshold=2
            ),
            'wellness': TopicConfig(
                key='wellness',
                label='Wellness & Relaxation',
                icon='🧘',
                description='Yoga, spa experiences, meditation, and wellness activities',
                event_type=EventType.REAL_EVENT,
                api_sources=['eventbrite', 'meetup', 'google_places', 'yelp'],
                search_keywords=['wellness', 'yoga', 'spa', 'meditation', 'fitness', 'health', 'relax', 'mindfulness'],
                exclude_keywords=['adventure', 'thrill', 'adrenaline'],
                fallback_activities=True,
                min_events_threshold=2
            ),
            'family': TopicConfig(
                key='family',
                label='Family Fun',
                icon='👨‍👩‍👧‍👦',
                description='Family-friendly activities and bonding experiences',
                event_type=EventType.MIXED,
                api_sources=['google_places', 'eventbrite', 'mock_local'],
                search_keywords=['family', 'kids', 'children', 'playground', 'zoo', 'museum'],
                exclude_keywords=['bar', 'club', 'adult', 'nightlife'],
                fallback_activities=True,
                min_events_threshold=2
            ),
            'bored': TopicConfig(
                key='bored',
                label='I\'m Bored 🤷‍♀️',
                icon='🤷‍♀️',
                description='Quick, easy activities when you don\'t know what to do',
                event_type=EventType.MIXED,
                api_sources=['google_places', 'mock_local'],
                search_keywords=['park', 'walk', 'coffee', 'gym', 'library', 'bookstore'],
                exclude_keywords=['expensive', 'reservation', 'formal'],
                fallback_activities=True,
                min_events_threshold=3  # Lower threshold for immediate suggestions
            ),
            'drinks': TopicConfig(
                key='drinks',
                label='Drinks & Bars',
                icon='🍹',
                description='Bars, breweries, wineries, and drink-focused venues',
                event_type=EventType.REAL_VENUE,
                api_sources=['google_places', 'yelp', 'openstreetmap'],
                search_keywords=['drink', 'bar', 'cocktail', 'wine', 'beer', 'brewery', 'pub', 'liquor'],
                exclude_keywords=['family', 'kids', 'children'],
                fallback_activities=True,
                min_events_threshold=2
            ),
            'art': TopicConfig(
                key='art',
                label='Art & Culture',
                icon='🖼️',
                description='Art galleries, museums, cultural events, and creative experiences',
                event_type=EventType.REAL_EVENT,
                api_sources=['eventbrite', 'meetup', 'google_places', 'openstreetmap'],
                search_keywords=['art', 'gallery', 'museum', 'exhibit', 'exhibition', 'painting', 'sculpture', 'culture', 'creative'],
                exclude_keywords=['sport', 'fitness', 'workout'],
                fallback_activities=True,
                min_events_threshold=2
            )
        }
    
    def get_topic_config(self, topic_key: str) -> Optional[TopicConfig]:
        """Get configuration for a specific topic"""
        return self.topic_configs.get(topic_key)
    
    def get_api_config(self, api_name: str) -> Optional[APIConfig]:
        """Get configuration for a specific API"""
        return self.api_configs.get(api_name)
    
    def get_enabled_apis(self) -> List[APIConfig]:
        """Get all enabled API configurations"""
        return [config for config in self.api_configs.values() if config.enabled]
    
    def get_all_topics(self) -> List[TopicConfig]:
        """Get all topic configurations"""
        return list(self.topic_configs.values())
    
    def add_api_source(self, name: str, config: APIConfig) -> None:
        """Add a new API source to the configuration"""
        self.api_configs[name] = config
    
    def add_topic(self, key: str, config: TopicConfig) -> None:
        """Add a new topic to the configuration"""
        self.topic_configs[key] = config
    
    def update_api_mapping(self, topic_key: str, api_sources: List[str]) -> None:
        """Update API sources for a specific topic"""
        if topic_key in self.topic_configs:
            self.topic_configs[topic_key].api_sources = api_sources
    
    def get_topic_api_sources(self, topic_key: str) -> List[str]:
        """Get API sources for a specific topic"""
        config = self.get_topic_config(topic_key)
        return config.api_sources if config else []
    
    def validate_configuration(self) -> Dict[str, Any]:
        """Validate the current configuration and return status"""
        validation = {
            'valid': True,
            'errors': [],
            'warnings': [],
            'api_status': {},
            'topic_status': {}
        }
        
        # Validate API configurations
        for api_name, config in self.api_configs.items():
            api_status = {
                'enabled': config.enabled,
                'has_key_env': bool(config.api_key_env),
                'valid_url': bool(config.base_url)
            }
            validation['api_status'][api_name] = api_status
            
            if config.enabled and not config.api_key_env and api_name not in ['openstreetmap']:
                validation['warnings'].append(f"API {api_name} enabled but no API key environment variable set")
        
        # Validate topic configurations
        for topic_key, config in self.topic_configs.items():
            topic_status = {
                'has_apis': bool(config.api_sources),
                'api_count': len(config.api_sources),
                'has_keywords': bool(config.search_keywords)
            }
            validation['topic_status'][topic_key] = topic_status
            
            if not config.api_sources:
                validation['errors'].append(f"Topic {topic_key} has no API sources configured")
        
        validation['valid'] = len(validation['errors']) == 0
        return validation

# Global instance
api_template_manager = APITemplateManager() 