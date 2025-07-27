/**
 * Centralized API client for Choosy frontend
 * Ensures type safety and consistent error handling
 */

import { 
  PlanCreateRequest, 
  VoteCreateRequest, 
  EventResponse, 
  ValidationError,
  validatePlanCreate,
  validateVoteCreate 
} from './validation';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PlanResponse {
  success: boolean;
  plan_id: string;
  planId: string;
  id: string;
  message: string;
}

interface VotingStatus {
  plan_id: string;
  topic: string;
  group_size: string;
  host_name: string;
  host_phone: string;
  max_voters: number;
  completed_voters: number;
  total_voters: number;
  active_voters: number;
  total_events: number;
  voting_limit_reached: boolean;
  can_vote: boolean;
  all_voters_completed: boolean;
}

interface PlanResults {
  planId: string;
  plan: {
    topic: string;
    group_size: string;
    zip_code: string;
    host_name: string;
    host_phone: string;
  };
  totalVotes: number;
  participants: string[];
  events: Array<{
    id: string;
    name: string;
    image_url: string;
    votes: number;
    total_votes: number;
    percentage: number;
  }>;
}

export class ChoosyAPI {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          message: data.message || 'Request failed'
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: 'Failed to connect to server'
      };
    }
  }

  // Plan endpoints
  async createPlan(planData: any): Promise<ApiResponse<PlanResponse>> {
    try {
      const validatedPlan = validatePlanCreate(planData);
      return await this.makeRequest<PlanResponse>('/api/createPlan', {
        method: 'POST',
        body: JSON.stringify(validatedPlan)
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: 'Validation failed',
          message: error.message
        };
      }
      throw error;
    }
  }

  async getPlanDetails(planId: string): Promise<ApiResponse<any>> {
    return await this.makeRequest(`/api/plans/${planId}`);
  }

  async getPlanEvents(planId: string): Promise<ApiResponse<{ events: EventResponse[] }>> {
    return await this.makeRequest(`/api/plans/${planId}/events`);
  }

  async getVotingStatus(planId: string): Promise<ApiResponse<VotingStatus>> {
    return await this.makeRequest(`/api/plans/${planId}/voting-status`);
  }

  async getPlanResults(planId: string): Promise<ApiResponse<PlanResults>> {
    return await this.makeRequest(`/api/plans/${planId}/results`);
  }

  // Vote endpoints
  async createVote(voteData: any): Promise<ApiResponse<any>> {
    try {
      const validatedVote = validateVoteCreate(voteData);
      return await this.makeRequest('/api/votes', {
        method: 'POST',
        body: JSON.stringify(validatedVote)
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: 'Validation failed',
          message: error.message
        };
      }
      throw error;
    }
  }

  // Event endpoints
  async getEvents(params: {
    lat: number;
    lng: number;
    category: string;
    radius?: number;
    limit?: number;
  }): Promise<ApiResponse<EventResponse[]>> {
    const queryParams = new URLSearchParams({
      lat: params.lat.toString(),
      lng: params.lng.toString(),
      category: params.category,
      radius: (params.radius || 5000).toString(),
      limit: (params.limit || 20).toString()
    });

    return await this.makeRequest(`/api/events?${queryParams}`);
  }

  // Geocoding endpoints
  async geocodeZip(zipcode: string): Promise<ApiResponse<{ lat: number; lng: number }>> {
    return await this.makeRequest(`/api/geocode?zipcode=${encodeURIComponent(zipcode)}`);
  }

  async geocodeLocation(lat: number, lng: number): Promise<ApiResponse<any>> {
    return await this.makeRequest(`/api/geocode?lat=${lat}&lng=${lng}`);
  }

  // Reservation endpoints
  async makeReservation(reservationData: any): Promise<ApiResponse<any>> {
    return await this.makeRequest('/api/makeReservation', {
      method: 'POST',
      body: JSON.stringify(reservationData)
    });
  }
}

// Export a default instance
export const api = new ChoosyAPI();

// Export error types for convenience
export { ValidationError };
export type { ApiResponse, PlanResponse, VotingStatus, PlanResults, EventResponse }; 