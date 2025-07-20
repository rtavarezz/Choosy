# API Keys Setup Guide

## 🎯 **Required API Keys for Global Event Discovery**

To get **real events** from around the world, you need these industry-standard API keys:

## 1. **Eventbrite API** (Primary - 180+ countries)
**Get it here**: https://www.eventbrite.com/platform/api-keys

```bash
# Add to your .env file
EVENTBRITE_API_KEY=your_eventbrite_private_token
```

**Steps:**
1. Go to https://www.eventbrite.com/platform/api-keys
2. Create a new app
3. Get your **Private Token** (not the public key)
4. Free tier: 10,000 requests/day

## 2. **Meetup API** (Primary - 190+ countries)
**Get it here**: https://www.meetup.com/api/oauth/list/

```bash
# Add to your .env file
MEETUP_API_KEY=your_meetup_api_key
```

**Steps:**
1. Go to https://www.meetup.com/api/oauth/list/
2. Create a new OAuth Consumer
3. Get your **API Key**
4. Free tier: 5,000 requests/day

## 3. **Facebook Events API** (Primary - Global)
**Get it here**: https://developers.facebook.com/

```bash
# Add to your .env file
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

**Steps:**
1. Go to https://developers.facebook.com/
2. Create a new app
3. Add "Events" permission
4. Get your **App ID** and **App Secret**
5. Free tier: 200 requests/hour

## 4. **Google Places API** (Secondary - Global)
**Get it here**: https://console.cloud.google.com/

```bash
# Add to your .env file
GOOGLE_PLACES_API_KEY=your_google_places_api_key
```

**Steps:**
1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable "Places API"
4. Create credentials (API Key)
5. Free tier: 100,000 requests/day

## 🚫 **APIs You DON'T Need (Avoid These)**

### **Yelp API** ❌
- **Why**: US-only, limited to restaurants
- **Alternative**: Use for venue reviews only (US)

### **Foursquare API** ❌
- **Why**: Limited event data, mostly venues
- **Alternative**: Use for venue discovery only

### **OpenStreetMap** ❌
- **Why**: No event data, only static places
- **Alternative**: Use for venue locations only

## 🔧 **Complete .env Setup**

```bash
# Database
DATABASE_URL=your_supabase_connection_string
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# Global Event APIs (Primary)
EVENTBRITE_API_KEY=your_eventbrite_private_token
MEETUP_API_KEY=your_meetup_api_key
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Venue APIs (Secondary)
GOOGLE_PLACES_API_KEY=your_google_places_api_key

# Partner API
PARTNER_JWT_SECRET_KEY=your_partner_jwt_secret

# JWT
JWT_SECRET_KEY=your_jwt_secret
```

## 🚀 **Quick Start**

### **Step 1: Get Eventbrite API Key (Most Important)**
1. Go to https://www.eventbrite.com/platform/api-keys
2. Sign up/login
3. Create a new app
4. Copy your **Private Token**
5. Add to `.env` file

### **Step 2: Test the Integration**
```bash
# Test with a real zip code
curl "http://localhost:8000/api/events?zipcode=33139&category=foodie"
```

### **Step 3: Add More APIs**
- Add Meetup API for social events
- Add Facebook Events for local events
- Add Google Places for venue details

## 📊 **Expected Results**

### **With Eventbrite Only:**
- **Urban areas**: 20-50 events per category
- **Suburban areas**: 10-20 events per category
- **Global coverage**: 180+ countries

### **With All APIs:**
- **Urban areas**: 50-200 events per category
- **Suburban areas**: 20-50 events per category
- **Global coverage**: 190+ countries

## 💰 **Cost Breakdown**

### **Free Tier (MVP)**
- **Eventbrite**: 10,000 requests/day (FREE)
- **Meetup**: 5,000 requests/day (FREE)
- **Facebook**: 200 requests/hour (FREE)
- **Google**: 100,000 requests/day (FREE)

### **Paid Tier (Scale)**
- **Eventbrite**: $99/month for 100,000 requests
- **Meetup**: $99/month for 50,000 requests
- **Google**: $0.017 per 1,000 requests

## 🎯 **Priority Order**

1. **Eventbrite** (Start here - easiest, most events)
2. **Meetup** (Add for social events)
3. **Facebook Events** (Add for local events)
4. **Google Places** (Add for venue details)

## 🔍 **Testing Different Locations**

Test with these zip codes to verify global coverage:

```bash
# US - Miami
curl "http://localhost:8000/api/events?zipcode=33139&category=foodie"

# UK - London
curl "http://localhost:8000/api/events?zipcode=SW1A1AA&category=foodie"

# Canada - Toronto
curl "http://localhost:8000/api/events?zipcode=M5V3A8&category=foodie"

# Australia - Sydney
curl "http://localhost:8000/api/events?zipcode=2000&category=foodie"
```

---

**Start with Eventbrite API - it's the easiest and covers 180+ countries!** 🚀 