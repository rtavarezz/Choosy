"""
Choosy API Examples
Demonstrates how to interact with the Choosy API for event planning
"""

import requests
import json
from typing import Dict, List

class ChoosyAPI:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session_token = None
        self.headers = {"Content-Type": "application/json"}
    
    def register_user(self, phone: str, name: str, email: str = None) -> Dict:
        """Register a new user"""
        data = {
            "phone": phone,
            "name": name,
            "email": email
        }
        
        response = requests.post(f"{self.base_url}/api/users/register", 
                               json=data, headers=self.headers)
        return response.json()
    
    def login_user(self, phone: str) -> Dict:
        """Login user and get session token"""
        data = {"phone": phone}
        
        response = requests.post(f"{self.base_url}/api/users/login", 
                               json=data, headers=self.headers)
        result = response.json()
        
        if result.get("success"):
            self.session_token = result["session_token"]
            self.headers["Authorization"] = f"Bearer {self.session_token}"
        
        return result
    
    def create_plan(self, topic: str, group_size: str, zip_code: str, 
                   host_name: str, host_phone: str) -> Dict:
        """Create a new event plan"""
        data = {
            "topic": topic,
            "group_size": group_size,
            "zip_code": zip_code,
            "host_name": host_name,
            "host_phone": host_phone,
            "custom_events": []
        }
        
        response = requests.post(f"{self.base_url}/api/plans", 
                               json=data, headers=self.headers)
        return response.json()
    
    def get_plan_events(self, plan_id: str) -> Dict:
        """Get events for a specific plan"""
        response = requests.get(f"{self.base_url}/api/plans/{plan_id}/events")
        return response.json()
    
    def vote_on_event(self, plan_id: str, event_id: str, 
                     voter_id: str, vote_type: str) -> Dict:
        """Vote on an event"""
        data = {
            "plan_id": plan_id,
            "event_id": event_id,
            "voter_id": voter_id,
            "vote_type": vote_type
        }
        
        response = requests.post(f"{self.base_url}/api/votes", 
                               json=data, headers=self.headers)
        return response.json()
    
    def get_plan_results(self, plan_id: str) -> Dict:
        """Get voting results for a plan"""
        response = requests.get(f"{self.base_url}/api/plans/{plan_id}/results")
        return response.json()
    
    def get_recommendations(self, category: str = None, limit: int = 10) -> Dict:
        """Get AI-powered personalized recommendations"""
        params = {"limit": limit}
        if category:
            params["category"] = category
        
        response = requests.get(f"{self.base_url}/api/users/recommendations", 
                              params=params, headers=self.headers)
        return response.json()
    
    def record_interaction(self, event_id: str, interaction_type: str, 
                          interaction_data: Dict = None) -> Dict:
        """Record user interaction for AI learning"""
        data = {
            "event_id": event_id,
            "interaction_type": interaction_type,
            "interaction_data": interaction_data or {}
        }
        
        response = requests.post(f"{self.base_url}/api/users/interactions", 
                               json=data, headers=self.headers)
        return response.json()
    
    def get_user_stats(self) -> Dict:
        """Get user gamification statistics"""
        response = requests.get(f"{self.base_url}/api/users/stats", 
                              headers=self.headers)
        return response.json()
    
    def get_achievements(self) -> Dict:
        """Get user achievements"""
        response = requests.get(f"{self.base_url}/api/users/achievements", 
                              headers=self.headers)
        return response.json()
    
    def get_leaderboard(self, limit: int = 10) -> Dict:
        """Get top users leaderboard"""
        response = requests.get(f"{self.base_url}/api/users/leaderboard", 
                              params={"limit": limit})
        return response.json()

# Example usage
def main():
    """Demonstrate Choosy API usage"""
    api = ChoosyAPI()
    
    print("🚀 Choosy API Examples")
    print("=" * 50)
    
    # 1. Register and login user
    print("\n1. Registering user...")
    register_result = api.register_user(
        phone="+1234567890",
        name="John Doe",
        email="john@example.com"
    )
    print(f"Registration: {register_result}")
    
    print("\n2. Logging in user...")
    login_result = api.login_user("+1234567890")
    print(f"Login: {login_result}")
    
    if not login_result.get("success"):
        print("❌ Login failed")
        return
    
    # 3. Create an adventure plan
    print("\n3. Creating adventure plan...")
    plan_result = api.create_plan(
        topic="adventure",
        group_size="group",
        zip_code="10001",
        host_name="John Doe",
        host_phone="+1234567890"
    )
    print(f"Plan created: {plan_result}")
    
    if plan_result.get("plan_id"):
        plan_id = plan_result["plan_id"]
        
        # 4. Get plan events
        print(f"\n4. Getting events for plan {plan_id}...")
        events_result = api.get_plan_events(plan_id)
        print(f"Events: {len(events_result.get('events', []))} found")
        
        # 5. Vote on an event
        if events_result.get("events"):
            event = events_result["events"][0]
            print(f"\n5. Voting on event: {event['name']}")
            vote_result = api.vote_on_event(
                plan_id=plan_id,
                event_id=event["id"],
                voter_id="+1234567890",
                vote_type="like"
            )
            print(f"Vote result: {vote_result}")
            
            # 6. Record interaction for AI learning
            print(f"\n6. Recording interaction for AI learning...")
            interaction_result = api.record_interaction(
                event_id=event["id"],
                interaction_type="liked",
                interaction_data={"context": "plan_voting"}
            )
            print(f"Interaction recorded: {interaction_result}")
    
    # 7. Get AI recommendations
    print("\n7. Getting AI recommendations...")
    recommendations = api.get_recommendations(category="adventure", limit=5)
    print(f"AI Recommendations: {len(recommendations.get('recommendations', []))} found")
    
    # 8. Get user stats
    print("\n8. Getting user statistics...")
    stats = api.get_user_stats()
    print(f"User Stats: {stats}")
    
    # 9. Get achievements
    print("\n9. Getting achievements...")
    achievements = api.get_achievements()
    print(f"Achievements: {len(achievements.get('achievements', []))} available")
    
    # 10. Get leaderboard
    print("\n10. Getting leaderboard...")
    leaderboard = api.get_leaderboard(limit=5)
    print(f"Leaderboard: {leaderboard}")

if __name__ == "__main__":
    main() 