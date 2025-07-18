import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Mock friend data for avatar display
const MOCK_FRIENDS = {
  friendA: { name: 'Sarah', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face' },
  friendB: { name: 'Mike', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face' },
  friendC: { name: 'Emma', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face' }
};

export default function ResultsPage() {
  const router = useRouter();
  const { planId, topic, groupSize, zip, winningEvent: winningEventParam } = router.query;
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReserving, setIsReserving] = useState(false);
  const [reservationResult, setReservationResult] = useState(null);
  const [allVotersCompleted, setAllVotersCompleted] = useState(false);
  const [expectedVoters, setExpectedVoters] = useState(1);
  const [completedVoters, setCompletedVoters] = useState(0);

  // Live refresh to check for new completed voters
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      // Check for updated completed voters count
      const storedCompletedVoters = localStorage.getItem(`completed_voters_${planId}`);
      if (storedCompletedVoters) {
        const newCompletedCount = parseInt(storedCompletedVoters);
        if (newCompletedCount !== completedVoters) {
          setCompletedVoters(newCompletedCount);
          // Re-check if all voters completed
          const groupSizeStr = Array.isArray(groupSize) ? groupSize[0] : groupSize;
          const voterCount = groupSizeStr === 'solo' ? 1 : groupSizeStr === 'date' ? 2 : 5;
          if (newCompletedCount >= voterCount) {
            setAllVotersCompleted(true);
            // Reload results when all voters complete
            window.location.reload();
          }
        }
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(refreshInterval);
  }, [planId, completedVoters, groupSize]);

  // Load results data
  useEffect(() => {
    const loadResults = async () => {
      try {
        // Parse winning event from URL params
        let parsedWinningEvent = null;
        if (winningEventParam && typeof winningEventParam === 'string') {
          try {
            parsedWinningEvent = JSON.parse(winningEventParam);
          } catch (e) {
            console.error('Failed to parse winning event:', e);
          }
        }

        // Check if this is a demo or real plan
        const isDemo = Array.isArray(planId) ? planId[0] === 'demo' : planId === 'demo';
        
        // Set expected voters based on group size - will be updated from API
        let voterCount = 5; // Default fallback
        const groupSizeStr = Array.isArray(groupSize) ? groupSize[0] : groupSize;
        if (groupSizeStr) {
          voterCount = groupSizeStr === 'solo' ? 1 : (groupSizeStr === 'date' || groupSizeStr === 'friend') ? 2 : 5;
        }
        setExpectedVoters(voterCount);
        
        // Get completed voters count
        const storedCompletedVoters = localStorage.getItem(`completed_voters_${planId}`);
        let completedVotersCount = storedCompletedVoters ? parseInt(storedCompletedVoters) : 0;
        
        // For "Choose for me" flow, if we have a winning event in URL, mark as completed
        if (parsedWinningEvent && Object.keys(parsedWinningEvent).length > 0) {
          completedVotersCount = voterCount; // Mark all voters as completed
        }
        
        setCompletedVoters(completedVotersCount);
        
        // Check if all voters have completed
        // For "Choose for me" flow, if we have a winning event in URL, bypass the voting check
        const hasWinningEventInUrl = parsedWinningEvent && Object.keys(parsedWinningEvent).length > 0;
        const allCompleted = hasWinningEventInUrl || completedVotersCount >= voterCount;
        setAllVotersCompleted(allCompleted);
        
        // For real plans, get results from backend API
        if (!isDemo) {
          try {
            const planIdStr = Array.isArray(planId) ? planId[0] : planId;
            const response = await fetch(`http://127.0.0.1:8000/api/plans/${planIdStr}/results`);
            if (response.ok) {
              const apiResults = await response.json();
              
              // Get expected voters from API group size
              const apiGroupSize = apiResults.plan.groupSize;
              const apiVoterCount = apiGroupSize === 'solo' ? 1 : (apiGroupSize === 'date' || apiGroupSize === 'friend') ? 2 : 5;
              
              // Transform API results to match frontend format
              const transformedResults = {
                planId: planIdStr,
                topic: apiResults.plan.topic,
                groupSize: apiResults.plan.groupSize,
                zip: apiResults.plan.zipCode,
                winningEvent: apiResults.events.length > 0 ? {
                  id: apiResults.events[0].id,
                  name: apiResults.events[0].name,
                  votes: apiResults.events[0].votes,
                  image: `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop`,
                  hours: "2 hours",
                  contact: { phone: '(555) 123-4567', email: 'info@event.com' }
                } : null,
                plan: {
                  userName: apiResults.plan.userName,
                  phoneNumber: apiResults.plan.phoneNumber,
                  topic: apiResults.plan.topic,
                  groupSize: apiResults.plan.groupSize,
                  zipCode: apiResults.plan.zipCode
                },
                totalVotes: apiResults.totalVotes,
                participants: apiResults.participants,
                allEvents: apiResults.events.map(event => ({
                  id: event.id,
                  name: event.name,
                  votes: event.votes,
                  total_votes: event.total_votes,
                  percentage: event.percentage,
                  image: `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop`,
                  hours: "2 hours",
                  contact: { phone: '(555) 123-4567', email: 'info@event.com' }
                })),
                allVotersCompleted: allCompleted,
                expectedVoters: apiVoterCount,
                completedVoters: completedVotersCount
              };
              
              // Update expected voters state with correct value from API
              setExpectedVoters(apiVoterCount);
              
              setResults(transformedResults);
              return;
            }
          } catch (error) {
            console.error('Failed to load API results:', error);
            // Fall back to mock data if API fails
          }
        }
        
        // For demo plans or if API fails, use mock data
        // Get real vote counts from localStorage
        const storedVotes = localStorage.getItem(`votes_${planId}`);
        const voteCounts = storedVotes ? JSON.parse(storedVotes) : {};
        
        // Get all events for this topic and group size
        const topicStr = Array.isArray(topic) ? topic[0] : topic;
        const groupSizeStr2 = Array.isArray(groupSize) ? groupSize[0] : groupSize;
        
        // Import the MOCK_EVENTS data (this would normally come from a shared file)
        const MOCK_EVENTS = {
          concerts: {
            solo: [
              { id: '1', name: 'Taylor Swift Concert', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop', contact: { phone: '(555) 123-4567', email: 'info@madisonsquaregarden.com' } },
              { id: '2', name: 'Jazz Night at Blue Note', image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop', contact: { phone: '(555) 234-5678', email: 'reservations@bluenote.com' } },
              { id: '3', name: 'Rock Concert at Central Park', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop', contact: { phone: '(555) 345-6789', email: 'info@centralpark.com' } },
              { id: '4', name: 'Classical Symphony', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop', contact: { phone: '(555) 456-7890', email: 'symphony@classical.com' } },
              { id: '5', name: 'Indie Rock Show', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'indie@rock.com' } }
            ],
            date: [
              { id: '1', name: 'Romantic Jazz Duo', image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop', contact: { phone: '(555) 234-5678', email: 'reservations@romanticjazz.com' } },
              { id: '2', name: 'Acoustic Love Songs', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop', contact: { phone: '(555) 345-6789', email: 'info@acousticlove.com' } },
              { id: '3', name: 'Piano Bar Duet', image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop', contact: { phone: '(555) 456-7890', email: 'piano@bar.com' } },
              { id: '4', name: 'Smooth Jazz Evening', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'jazz@smooth.com' } },
              { id: '5', name: 'Romantic Guitar Duo', image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop', contact: { phone: '(555) 678-9012', email: 'guitar@romantic.com' } }
            ],
            group: [
              { id: '1', name: 'Rock Festival in Central Park', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop', contact: { phone: '(555) 345-6789', email: 'events@centralpark.com' } },
              { id: '2', name: 'Pop Concert at Stadium', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop', contact: { phone: '(555) 456-7890', email: 'tickets@stadium.com' } },
              { id: '3', name: 'Indie Music Festival', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'indie@festival.com' } },
              { id: '4', name: 'Country Music Night', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop', contact: { phone: '(555) 678-9012', email: 'country@night.com' } },
              { id: '5', name: 'Electronic Dance Music', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop', contact: { phone: '(555) 789-0123', email: 'edm@electronic.com' } }
            ]
          },
          sports: {
            solo: [
              { id: '1', name: 'Solo Tennis Session', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop', contact: { phone: '(555) 123-4567', email: 'tennis@solo.com' } },
              { id: '2', name: 'Solo Basketball Practice', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop', contact: { phone: '(555) 234-5678', email: 'basketball@solo.com' } },
              { id: '3', name: 'Solo Swimming Laps', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', contact: { phone: '(555) 345-6789', email: 'swimming@solo.com' } },
              { id: '4', name: 'Solo Golf Round', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop', contact: { phone: '(555) 456-7890', email: 'golf@solo.com' } },
              { id: '5', name: 'Solo Rock Climbing', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'climbing@solo.com' } }
            ],
            date: [
              { id: '1', name: 'Couples Tennis Match', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop', contact: { phone: '(555) 234-5678', email: 'tennis@couples.com' } },
              { id: '2', name: 'Couples Golf Date', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop', contact: { phone: '(555) 345-6789', email: 'golf@couples.com' } },
              { id: '3', name: 'Couples Rock Climbing', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop', contact: { phone: '(555) 456-7890', email: 'climbing@couples.com' } },
              { id: '4', name: 'Couples Swimming', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'swimming@couples.com' } },
              { id: '5', name: 'Couples Basketball', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop', contact: { phone: '(555) 678-9012', email: 'basketball@couples.com' } }
            ],
            group: [
              { id: '1', name: 'Basketball Tournament', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop', contact: { phone: '(555) 345-6789', email: 'basketball@tournament.com' } },
              { id: '2', name: 'Group Tennis Tournament', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop', contact: { phone: '(555) 456-7890', email: 'tennis@tournament.com' } },
              { id: '3', name: 'Group Golf Outing', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'golf@group.com' } },
              { id: '4', name: 'Group Rock Climbing', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop', contact: { phone: '(555) 678-9012', email: 'climbing@group.com' } },
              { id: '5', name: 'Group Swimming Meet', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', contact: { phone: '(555) 789-0123', email: 'swimming@group.com' } }
            ]
          },
          swimming: {
            solo: [
              { id: '1', name: 'Solo Swim Session', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', contact: { phone: '(555) 123-4567', email: 'swim@solo.com' } },
              { id: '2', name: 'Solo Lap Swimming', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', contact: { phone: '(555) 234-5678', email: 'laps@solo.com' } },
              { id: '3', name: 'Solo Water Aerobics', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', contact: { phone: '(555) 345-6789', email: 'aerobics@solo.com' } },
              { id: '4', name: 'Solo Diving Practice', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', contact: { phone: '(555) 456-7890', email: 'diving@solo.com' } },
              { id: '5', name: 'Solo Water Polo', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'polo@solo.com' } }
            ],
            date: [
              { id: '1', name: 'Couples Pool Day', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', contact: { phone: '(555) 234-5678', email: 'pool@couples.com' } },
              { id: '2', name: 'Couples Lap Swimming', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', contact: { phone: '(555) 345-6789', email: 'laps@couples.com' } },
              { id: '3', name: 'Couples Water Aerobics', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', contact: { phone: '(555) 456-7890', email: 'aerobics@couples.com' } },
              { id: '4', name: 'Couples Diving', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'diving@couples.com' } },
              { id: '5', name: 'Couples Water Polo', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', contact: { phone: '(555) 678-9012', email: 'polo@couples.com' } }
            ],
            group: [
              { id: '1', name: 'Group Pool Party', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', contact: { phone: '(555) 345-6789', email: 'party@pool.com' } },
              { id: '2', name: 'Group Lap Swimming', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', contact: { phone: '(555) 456-7890', email: 'laps@group.com' } },
              { id: '3', name: 'Group Water Aerobics', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'aerobics@group.com' } },
              { id: '4', name: 'Group Diving Competition', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', contact: { phone: '(555) 678-9012', email: 'diving@group.com' } },
              { id: '5', name: 'Group Water Polo Match', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', contact: { phone: '(555) 789-0123', email: 'polo@group.com' } }
            ]
          },
          gokart: {
            solo: [
              { id: '1', name: 'Solo Go Kart Racing', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop', contact: { phone: '(555) 123-4567', email: 'racing@gokart.com' } },
              { id: '2', name: 'Solo Drift Racing', image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?w=400&h=300&fit=crop', contact: { phone: '(555) 234-5678', email: 'drift@gokart.com' } },
              { id: '3', name: 'Solo Speed Racing', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop', contact: { phone: '(555) 345-6789', email: 'speed@gokart.com' } },
              { id: '4', name: 'Solo Endurance Race', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop', contact: { phone: '(555) 456-7890', email: 'endurance@gokart.com' } },
              { id: '5', name: 'Solo Time Trial', image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'timetrial@gokart.com' } }
            ],
            date: [
              { id: '1', name: 'Couples Go Kart Race', image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?w=400&h=300&fit=crop', contact: { phone: '(555) 234-5678', email: 'couples@gokart.com' } },
              { id: '2', name: 'Couples Drift Competition', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop', contact: { phone: '(555) 345-6789', email: 'drift@couples.com' } },
              { id: '3', name: 'Couples Speed Challenge', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop', contact: { phone: '(555) 456-7890', email: 'speed@couples.com' } },
              { id: '4', name: 'Couples Endurance Race', image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'endurance@couples.com' } },
              { id: '5', name: 'Couples Time Trial', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop', contact: { phone: '(555) 678-9012', email: 'timetrial@couples.com' } }
            ],
            group: [
              { id: '1', name: 'Group Go Kart Championship', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop', contact: { phone: '(555) 345-6789', email: 'championship@gokart.com' } },
              { id: '2', name: 'Group Drift Championship', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop', contact: { phone: '(555) 456-7890', email: 'drift@championship.com' } },
              { id: '3', name: 'Group Speed Championship', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'speed@championship.com' } },
              { id: '4', name: 'Group Endurance Championship', image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?w=400&h=300&fit=crop', contact: { phone: '(555) 678-9012', email: 'endurance@championship.com' } },
              { id: '5', name: 'Group Time Trial Championship', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop', contact: { phone: '(555) 789-0123', email: 'timetrial@championship.com' } }
            ]
          },
          drinks: {
            solo: [
              { id: '1', name: 'Solo Craft Beer Tasting', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 123-4567', email: 'beer@solo.com' } },
              { id: '2', name: 'Solo Wine Tasting', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 234-5678', email: 'wine@solo.com' } },
              { id: '3', name: 'Solo Cocktail Making', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 345-6789', email: 'cocktails@solo.com' } },
              { id: '4', name: 'Solo Whiskey Tasting', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 456-7890', email: 'whiskey@solo.com' } },
              { id: '5', name: 'Solo Tequila Tasting', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'tequila@solo.com' } }
            ],
            date: [
              { id: '1', name: 'Couples Wine Tasting', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 234-5678', email: 'wine@couples.com' } },
              { id: '2', name: 'Couples Craft Beer Tasting', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 345-6789', email: 'beer@couples.com' } },
              { id: '3', name: 'Couples Cocktail Making', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 456-7890', email: 'cocktails@couples.com' } },
              { id: '4', name: 'Couples Whiskey Tasting', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'whiskey@couples.com' } },
              { id: '5', name: 'Couples Tequila Tasting', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 678-9012', email: 'tequila@couples.com' } }
            ],
            group: [
              { id: '1', name: 'Group Cocktail Night', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 345-6789', email: 'cocktails@group.com' } },
              { id: '2', name: 'Group Wine Tasting', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 456-7890', email: 'wine@group.com' } },
              { id: '3', name: 'Group Craft Beer Tasting', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'beer@group.com' } },
              { id: '4', name: 'Group Whiskey Tasting', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 678-9012', email: 'whiskey@group.com' } },
              { id: '5', name: 'Group Tequila Tasting', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 789-0123', email: 'tequila@group.com' } }
            ]
          },
          foodie: {
            solo: [
              { id: '1', name: 'Food Truck Festival', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop', contact: { phone: '(555) 123-4567', email: 'info@foodtruckfest.com' } },
              { id: '2', name: 'Solo Ramen Adventure', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop', contact: { phone: '(555) 234-5678', email: 'ramen@solo.com' } },
              { id: '3', name: 'Solo Pizza Night', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop', contact: { phone: '(555) 345-6789', email: 'pizza@solo.com' } },
              { id: '4', name: 'Solo Ice Cream Tour', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop', contact: { phone: '(555) 456-7890', email: 'icecream@solo.com' } },
              { id: '5', name: 'Solo Coffee Crawl', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'coffee@solo.com' } }
            ],
            date: [
              { id: '1', name: 'Romantic Sushi Master', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop', contact: { phone: '(555) 678-9012', email: 'reservations@sushimaster.com' } },
              { id: '2', name: 'Farm-to-Table Bistro', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop', contact: { phone: '(555) 789-0123', email: 'hello@farmtable.com' } },
              { id: '3', name: 'Romantic Italian Dinner', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop', contact: { phone: '(555) 890-1234', email: 'italian@romantic.com' } },
              { id: '4', name: 'Couples Cooking Class', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop', contact: { phone: '(555) 901-2345', email: 'cooking@couples.com' } },
              { id: '5', name: 'Dessert Date Night', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop', contact: { phone: '(555) 012-3456', email: 'dessert@date.com' } }
            ],
            group: [
              { id: '1', name: 'Group BBQ Experience', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop', contact: { phone: '(555) 890-1234', email: 'bbq@group.com' } },
              { id: '2', name: 'Group Pizza Party', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop', contact: { phone: '(555) 901-2345', email: 'pizza@group.com' } },
              { id: '3', name: 'Group Taco Night', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop', contact: { phone: '(555) 012-3456', email: 'tacos@group.com' } },
              { id: '4', name: 'Group Sushi Feast', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop', contact: { phone: '(555) 123-4567', email: 'sushi@group.com' } },
              { id: '5', name: 'Group Burger Bash', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop', contact: { phone: '(555) 234-5678', email: 'burger@group.com' } }
            ]
          },
          nightlife: {
            solo: [
              { id: '1', name: 'Solo Bar Hopping', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 123-4567', email: 'info@solobar.com' } },
              { id: '2', name: 'Cocktail Lounge', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 234-5678', email: 'cocktails@lounge.com' } },
              { id: '3', name: 'Wine Bar Experience', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 345-6789', email: 'wine@bar.com' } },
              { id: '4', name: 'Speakeasy Night', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 456-7890', email: 'speakeasy@night.com' } }
            ],
            date: [
              { id: '1', name: 'Skyline Rooftop Bar', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 456-7890', email: 'reservations@skylinebar.com' } },
              { id: '2', name: 'Jazz Club Date Night', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'jazz@club.com' } },
              { id: '3', name: 'Craft Beer Tasting', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 678-9012', email: 'beer@craft.com' } },
              { id: '4', name: 'Salsa Dancing Night', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 789-0123', email: 'salsa@dancing.com' } }
            ],
            group: [
              { id: '1', name: 'Underground Club', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'info@undergroundclub.com' } },
              { id: '2', name: 'Group Karaoke Night', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 678-9012', email: 'karaoke@group.com' } },
              { id: '3', name: 'Group Pub Crawl', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 789-0123', email: 'pubcrawl@group.com' } },
              { id: '4', name: 'Group Comedy Night', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop', contact: { phone: '(555) 890-1234', email: 'comedy@group.com' } },
              { id: '5', name: 'Group Dance Party', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 901-2345', email: 'dance@group.com' } }
            ]
          },
          parks: {
            solo: [
              { id: '1', name: 'Solo Hiking Trail', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop', contact: { phone: '(555) 123-4567', email: 'info@hikingtrail.com' } },
              { id: '2', name: 'Peaceful Garden Walk', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop', contact: { phone: '(555) 234-5678', email: 'info@gardenwalk.com' } },
              { id: '3', name: 'Solo Bird Watching', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop', contact: { phone: '(555) 345-6789', email: 'birdwatching@solo.com' } },
              { id: '4', name: 'Solo Photography Walk', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop', contact: { phone: '(555) 456-7890', email: 'photography@solo.com' } },
              { id: '5', name: 'Solo Meditation Spot', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'meditation@solo.com' } }
            ],
            date: [
              { id: '1', name: 'Romantic Park Picnic', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop', contact: { phone: '(555) 345-6789', email: 'picnic@park.com' } },
              { id: '2', name: 'Couples Nature Trail', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop', contact: { phone: '(555) 456-7890', email: 'trail@nature.com' } },
              { id: '3', name: 'Romantic Sunset View', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'sunset@romantic.com' } },
              { id: '4', name: 'Couples Bike Ride', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop', contact: { phone: '(555) 678-9012', email: 'bike@couples.com' } },
              { id: '5', name: 'Romantic Lake Walk', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop', contact: { phone: '(555) 789-0123', email: 'lake@romantic.com' } }
            ],
            group: [
              { id: '1', name: 'Group Park Games', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'games@park.com' } },
              { id: '2', name: 'Group Hiking Adventure', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop', contact: { phone: '(555) 678-9012', email: 'hiking@group.com' } },
              { id: '3', name: 'Group Picnic Party', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop', contact: { phone: '(555) 789-0123', email: 'picnic@group.com' } },
              { id: '4', name: 'Group Sports Day', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop', contact: { phone: '(555) 890-1234', email: 'sports@group.com' } },
              { id: '5', name: 'Group Nature Photography', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop', contact: { phone: '(555) 901-2345', email: 'photography@group.com' } }
            ]
          },
          datenight: {
            solo: [
              { id: '1', name: 'Self-Care Spa Day', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop', contact: { phone: '(555) 123-4567', email: 'spa@wellness.com' } },
              { id: '2', name: 'Solo Art Workshop', image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop', contact: { phone: '(555) 234-5678', email: 'art@workshop.com' } },
              { id: '3', name: 'Solo Wine Tasting', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 345-6789', email: 'wine@solo.com' } },
              { id: '4', name: 'Solo Cooking Class', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop', contact: { phone: '(555) 456-7890', email: 'cooking@solo.com' } },
              { id: '5', name: 'Solo Movie Night', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'movie@solo.com' } }
            ],
            date: [
              { id: '1', name: 'Romantic Candlelit Dinner', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop', contact: { phone: '(555) 345-6789', email: 'picnic@park.com' } },
              { id: '2', name: 'Couples Massage', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop', contact: { phone: '(555) 456-7890', email: 'massage@couples.com' } },
              { id: '3', name: 'Sunset Rooftop Drinks', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 567-8901', email: 'drinks@rooftop.com' } },
              { id: '4', name: 'Romantic Movie Night', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop', contact: { phone: '(555) 678-9012', email: 'movie@romantic.com' } },
              { id: '5', name: 'Couples Art Class', image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop', contact: { phone: '(555) 789-0123', email: 'art@couples.com' } }
            ],
            group: [
              { id: '1', name: 'Group Cooking Class', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop', contact: { phone: '(555) 678-9012', email: 'cooking@group.com' } },
              { id: '2', name: 'Wine Tasting Experience', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', contact: { phone: '(555) 789-0123', email: 'wine@tasting.com' } },
              { id: '3', name: 'Group Game Night', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop', contact: { phone: '(555) 890-1234', email: 'games@group.com' } },
              { id: '4', name: 'Group Movie Night', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop', contact: { phone: '(555) 901-2345', email: 'movie@group.com' } },
              { id: '5', name: 'Group Art Workshop', image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop', contact: { phone: '(555) 012-3456', email: 'art@group.com' } }
            ]
          }
        };
        
        // Get all events for this topic and group size
        const allEvents = MOCK_EVENTS[topicStr]?.[groupSizeStr2] || [];
        
        // Create results with real vote counts
        const eventsWithVotes = allEvents.map(event => ({
          ...event,
          votes: voteCounts[event.id] || 0
        }));
        
        // Sort by vote count (highest first)
        eventsWithVotes.sort((a, b) => b.votes - a.votes);
        
        // Get winning event - use URL event for "Choose for me" flow, otherwise use highest votes
        const winningEvent = parsedWinningEvent || (allCompleted ? eventsWithVotes[0] : null);
        
        // Calculate total votes
        const totalVotes = Object.values(voteCounts).reduce((sum: number, count: any) => sum + (count as number), 0);
        
        const mockResults = {
          planId: Array.isArray(planId) ? planId[0] : planId,
          topic: Array.isArray(topic) ? topic[0] : topic,
          groupSize: Array.isArray(groupSize) ? groupSize[0] : groupSize,
          zip: Array.isArray(zip) ? zip[0] : zip,
          winningEvent: winningEvent,
          // For real plans, include plan data; for demo, omit it
          plan: isDemo ? null : {
            userName: 'John Smith', // This would come from the actual plan data
            phoneNumber: '(555) 123-4567', // This would come from the actual plan data
            topic: Array.isArray(topic) ? topic[0] : topic,
            groupSize: Array.isArray(groupSize) ? groupSize[0] : groupSize,
            zipCode: Array.isArray(zip) ? zip[0] : zip
          },
          totalVotes: totalVotes,
          participants: ['friendA', 'friendB', 'friendC'],
          allEvents: eventsWithVotes,
          allVotersCompleted: allCompleted,
          expectedVoters: voterCount,
          completedVoters: completedVotersCount
        };

        setResults(mockResults);
      } catch (error) {
        console.error('Failed to load results:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (planId) {
      loadResults();
    }
  }, [planId, topic, groupSize, zip, winningEventParam]);

  // Handle phone call
  const handleCall = (phoneNumber) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  // Handle reservation
  const handleReservation = async () => {
    if (!results?.winningEvent) return;
    
    // Check if this is a demo
    const isDemo = Array.isArray(planId) ? planId[0] === 'demo' : planId === 'demo';
    
    if (isDemo || !results.plan?.userName || !results.plan?.phoneNumber) {
      alert('This is a demo! Create a real plan to make reservations.');
      return;
    }
    
    setIsReserving(true);
    try {
      const response = await fetch('/api/makeReservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: results.topic,
          eventName: results.winningEvent.name,
          userName: results.plan?.userName || 'John Smith', // Get from plan data
          phoneNumber: results.plan?.phoneNumber || results.winningEvent.contact.phone,
          groupSize: results.groupSize,
          eventTime: results.winningEvent.hours?.split(' - ')[0] || '7:00 PM',
          eventDate: new Date().toISOString().split('T')[0]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setReservationResult(data.reservation);
      } else {
        alert('Failed to make reservation. Please try again.');
      }
    } catch (error) {
      console.error('Reservation error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsReserving(false);
    }
  };

  // Handle share functionality
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/vote/${planId}?topic=${results.topic}&groupSize=${results.groupSize}&zip=${results.zip}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join our plan on Choosy!',
          text: `Vote on ${results.topic} events near ${results.zip}`,
          url: shareUrl
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Copy failed:', error);
      }
    }
  };

  // Render star rating
  const renderStars = (stars) => {
    return '⭐'.repeat(Math.floor(stars)) + '☆'.repeat(5 - Math.floor(stars));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Results Not Found</h1>
          <p className="text-gray-600 mb-6">The voting session may have expired or doesn't exist.</p>
          <button
            onClick={() => router.push('/create')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200"
          >
            Create New Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Voting Results - Choosy</title>
        <meta name="description" content="See the results of your group voting" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-violet-100 to-blue-100 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {results.allVotersCompleted ? '🎉 Voting Complete!' : '⏳ Still Waiting...'}
            </h1>
            <p className="text-gray-600">
              {results.topic === 'datenight' ? 'Date Night' : results.topic} • {results.groupSize === 'solo' ? 'Solo' : results.groupSize === 'date' ? 'Date or Friend Night' : 'Group'} • {results.zip}
            </p>
            
            {/* Voter progress */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mt-4">
              <span className="text-lg font-bold">👥</span>
              <span className="font-semibold">{results.completedVoters}/{results.expectedVoters} finished voting</span>
            </div>
          </div>

          {/* Waiting for all voters */}
          {!results.allVotersCompleted && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 mb-8">
              <div className="text-center">
                <div className="text-6xl mb-4">⏳</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Waiting for All Votes</h2>
                <p className="text-gray-600 mb-4">
                  {results.completedVoters} out of {results.expectedVoters} people have finished voting.
                </p>
                <p className="text-sm text-gray-500">
                  Results will be available when everyone is done!
                </p>
                <button
                  onClick={() => router.push(`/vote/${planId}?topic=${results.topic}&groupSize=${results.groupSize}&zip=${results.zip}`)}
                  className="mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200"
                >
                  Back to Voting
                </button>
              </div>
            </div>
          )}

          {/* Winner announcement - only show if all voters completed */}
          {results.allVotersCompleted && results.winningEvent && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 mb-8">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Winner!</h2>
                <p className="text-gray-600">Your group chose this event</p>
              </div>

              {/* Winner card */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200">
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={results.winningEvent.image} 
                    alt={results.winningEvent.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{results.winningEvent.name}</h3>
                    <p className="text-gray-600">{results.winningEvent.hours}</p>
                    <p className="text-sm text-purple-600 font-semibold">{results.winningEvent.votes} votes</p>
                  </div>
                </div>

                {/* Contact information */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5">📞</span>
                    <span className="text-gray-700">{results.winningEvent.contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5">✉️</span>
                    <span className="text-gray-700">{results.winningEvent.contact.email}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleCall(results.winningEvent.contact.phone)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                  >
                    <span className="text-xl font-bold">📞</span>
                    <span>Call Now</span>
                  </button>
                  
                  <button
                    onClick={handleReservation}
                    disabled={isReserving}
                    className={`flex-1 font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                      (Array.isArray(planId) ? planId[0] === 'demo' : planId === 'demo') || !results.plan?.userName || !results.plan?.phoneNumber
                        ? 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                    }`}
                  >
                    <span className="text-xl">
                      {isReserving ? '⏳' : ((Array.isArray(planId) ? planId[0] === 'demo' : planId === 'demo') || !results.plan?.userName || !results.plan?.phoneNumber) ? '🔒' : '🎫'}
                    </span>
                    <span>
                      {isReserving 
                        ? 'Reserving...' 
                        : ((Array.isArray(planId) ? planId[0] === 'demo' : planId === 'demo') || !results.plan?.userName || !results.plan?.phoneNumber) 
                          ? 'Demo Mode' 
                          : 'Reserve Now'
                      }
                    </span>
                  </button>
                </div>

                {/* Reservation result */}
                {reservationResult && (
                  <>
                    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-200">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">✅</span>
                        <h4 className="font-semibold text-green-800">Reservation {reservationResult.status === 'confirmed' ? 'Confirmed!' : 'Submitted!'}</h4>
                      </div>
                      <p className="text-sm text-green-700 mb-2">{reservationResult.message}</p>
                      <div className="text-xs text-green-600 space-y-1">
                        <p>Confirmation #: {reservationResult.confirmationNumber}</p>
                        <p>Provider: {reservationResult.provider}</p>
                        {reservationResult.requiresConfirmation && (
                          <p className="font-medium">📞 You'll receive a confirmation call soon!</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => router.push('/')}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 mt-2"
                      >
                        Return Home
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* All results - only show if all voters completed */}
          {results.allVotersCompleted && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">All Results</h3>
              <div className="space-y-4">
                {results.allEvents.slice(0, 4).map((event, index) => (
                  <div key={event.id} className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                    index === 0 ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-white'
                  }`}>
                    <div className="flex items-center gap-4">
                      <img 
                        src={event.image} 
                        alt={event.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">{event.name}</h4>
                        <p className="text-sm text-gray-600">{event.hours}</p>
                        <p className="text-sm text-purple-600 font-semibold">{event.votes} votes</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {index === 0 && (
                        <div className="text-2xl mb-1">🥇</div>
                      )}
                      {index === 1 && (
                        <div className="text-2xl mb-1">🥈</div>
                      )}
                      {index === 2 && (
                        <div className="text-2xl mb-1">🥉</div>
                      )}
                      <div className="text-sm text-gray-500">#{index + 1}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <button
              onClick={handleShare}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <span className="text-xl font-bold">📤</span>
              <span>Share Results</span>
            </button>
            
            <button
              onClick={() => router.push('/create')}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <span className="text-xl">✨</span>
              <span>Create New Plan</span>
            </button>
          </div>

          {/* Home button */}
          <div className="text-center">
            <button
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 px-8 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 mx-auto"
            >
              <span className="text-xl">🏠</span>
              <span>Go Home</span>
            </button>
          </div>

          {/* Vote again button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push(`/vote/${planId}?topic=${results.topic}&groupSize=${results.groupSize}&zip=${results.zip}`)}
              className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-300"
            >
              Vote Again
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 