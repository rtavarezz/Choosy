/**
 * Frontend validation utilities that match backend Pydantic models
 */

// Plan validation that matches backend PlanCreate model
export interface PlanCreateRequest {
  topic: string;
  group_size: string;
  zip_code: string;
  host_name: string;
  host_phone: string;
  custom_events?: any[];
}

export interface VoteCreateRequest {
  plan_id: string;
  event_id: string;
  voter_id: string;
  vote_type: 'like' | 'dislike';
}

export interface EventResponse {
  id: string;
  name: string;
  description: string;
  image_url: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  price?: string;
  category?: string;
  source?: string;
  external_id?: string;
  external_url?: string;
  organizer?: string;
  attendees_count?: number;
  max_attendees?: number;
  is_free?: boolean;
  is_featured?: boolean;
  metadata?: any;
}

// Validation functions
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validateTopic = (topic: string): boolean => {
  const validTopics = [
    'concerts', 'nightlife', 'foodie', 'datenight', 'sports', 
    'parks', 'racing', 'swimming', 'drinks', 'movies', 
    'comedy', 'art', 'shopping', 'wellness', 'adventure', 'family'
  ];
  return validTopics.includes(topic);
};

export const validateGroupSize = (groupSize: string): boolean => {
  const validSizes = ['myself', '2', '3+'];
  return validSizes.includes(groupSize);
};

export const validateZipCode = (zipCode: string): boolean => {
  return zipCode && zipCode.length >= 3 && zipCode.length <= 10;
};

export const validateName = (name: string): boolean => {
  return name && name.trim().length >= 2 && name.trim().length <= 30;
};

export const validatePhone = (phone: string): boolean => {
  // Remove all non-digit characters except + at the beginning
  const cleaned = phone.replace(/[^\d+]/g, '');
  // Ensure it starts with + or has at least 10 digits
  return (cleaned.startsWith('+') && cleaned.length >= 11) || 
         (!cleaned.startsWith('+') && cleaned.length >= 10);
};

export const validatePlanCreate = (data: any): PlanCreateRequest => {
  if (!validateTopic(data.topic)) {
    throw new ValidationError(`Invalid topic. Must be one of the allowed topics.`);
  }
  if (!validateGroupSize(data.group_size)) {
    throw new ValidationError(`Invalid group size. Must be 'myself', '2', or '3+'.`);
  }
  if (!validateZipCode(data.zip_code)) {
    throw new ValidationError(`Invalid ZIP code. Must be 3-10 characters.`);
  }
  if (!validateName(data.host_name)) {
    throw new ValidationError(`Invalid name. Must be 2-30 characters.`);
  }
  if (!validatePhone(data.host_phone)) {
    throw new ValidationError(`Invalid phone number.`);
  }

  return {
    topic: data.topic,
    group_size: data.group_size,
    zip_code: data.zip_code,
    host_name: data.host_name.trim(),
    host_phone: data.host_phone,
    custom_events: data.custom_events || []
  };
};

export const validateVoteCreate = (data: any): VoteCreateRequest => {
  if (!data.plan_id || typeof data.plan_id !== 'string') {
    throw new ValidationError('Plan ID is required');
  }
  if (!data.event_id || typeof data.event_id !== 'string') {
    throw new ValidationError('Event ID is required');
  }
  if (!data.voter_id || typeof data.voter_id !== 'string') {
    throw new ValidationError('Voter ID is required');
  }
  if (!['like', 'dislike'].includes(data.vote_type)) {
    throw new ValidationError('Vote type must be "like" or "dislike"');
  }

  return {
    plan_id: data.plan_id,
    event_id: data.event_id,
    voter_id: data.voter_id,
    vote_type: data.vote_type
  };
};

// API response validators
export const validateEventResponse = (data: any): EventResponse => {
  if (!data.id || !data.name) {
    throw new ValidationError('Event must have id and name');
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    image_url: data.image_url || '',
    start_time: data.start_time,
    end_time: data.end_time,
    venue: data.venue,
    address: data.address,
    city: data.city,
    state: data.state,
    zip_code: data.zip_code,
    price: data.price,
    category: data.category,
    source: data.source,
    external_id: data.external_id,
    external_url: data.external_url,
    organizer: data.organizer,
    attendees_count: data.attendees_count,
    max_attendees: data.max_attendees,
    is_free: data.is_free,
    is_featured: data.is_featured,
    metadata: data.metadata
  };
}; 