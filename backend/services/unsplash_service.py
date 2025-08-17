import requests
import time
import hashlib
from core.cache_manager import cache_manager
from config import env_config

UNSPLASH_ACCESS_KEY = env_config.unsplash_access_key

# Cache TTL in seconds (1 hour)
CACHE_TTL = 3600

# Rate limit: max 50 requests/hour (Unsplash demo mode)
RATE_LIMIT = 50
RATE_LIMIT_WINDOW = 3600  # seconds

# In-memory rate limit tracker (per process)
_last_reset = 0
_request_count = 0

UNSPLASH_IMAGES_PER_TOPIC = 7  # Number of images to cache per topic

def _rate_limited():
    global _last_reset, _request_count
    now = int(time.time())
    if now - _last_reset > RATE_LIMIT_WINDOW:
        _last_reset = now
        _request_count = 0
    if _request_count >= RATE_LIMIT:
        return True
    _request_count += 1
    return False

def get_unsplash_fallback(topic: str, event_id: str = None):
    """
    Fetch a fallback Unsplash image for a given topic, with caching and rate limiting.
    Returns dict with image_url, photographer, photographer_url, unsplash_url, attribution_html.
    If event_id is provided, returns a different image for each event (deterministically).
    """
    if not UNSPLASH_ACCESS_KEY:
        return None
    topic = topic.lower().strip()
    cache_key = f"unsplash_fallback_list:{topic}"
    cached_list = cache_manager.get(cache_key)
    if cached_list and isinstance(cached_list, list) and len(cached_list) >= UNSPLASH_IMAGES_PER_TOPIC:
        images = cached_list
    else:
        if _rate_limited():
            return None
        images = []
        for _ in range(UNSPLASH_IMAGES_PER_TOPIC):
            url = "https://api.unsplash.com/photos/random"
            params = {
                "query": topic,
                "orientation": "landscape",
                "content_filter": "high",
                "client_id": UNSPLASH_ACCESS_KEY
            }
            try:
                resp = requests.get(url, params=params, timeout=5)
                if resp.status_code == 200:
                    data = resp.json()
                    result = {
                        "image_url": data["urls"]["regular"],
                        "photographer": data["user"]["name"],
                        "photographer_url": data["user"]["links"]["html"],
                        "unsplash_url": data["links"]["html"],
                        "attribution_html": f'<a href="{data["user"]["links"]["html"]}" target="_blank" rel="noopener">{data["user"]["name"]}</a> on <a href="https://unsplash.com" target="_blank" rel="noopener">Unsplash</a>'
                    }
                    # Avoid duplicates
                    if result["image_url"] not in [img["image_url"] for img in images]:
                        images.append(result)
                else:
                    continue
            except Exception:
                continue
        if images:
            cache_manager.set(cache_key, images, ttl=CACHE_TTL)
        else:
            return None
    # Pick image for this event
    if not images:
        return None
    if event_id:
        # Deterministically pick an image based on event_id
        idx = int(hashlib.sha256(event_id.encode()).hexdigest(), 16) % len(images)
        return images[idx]
    else:
        # Just return the first image
        return images[0]
