/**
 * Security utilities for input sanitization and validation
 */

// Sanitize user input to prevent XSS
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// Validate phone number format
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  const cleanPhone = phone.replace(/\D/g, '');
  return phoneRegex.test(cleanPhone);
}

// Mask phone number for display (privacy protection)
export function maskPhoneNumber(phone: string): string {
  if (!phone) return '';
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2');
  } else if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{1})\d{3}(\d{3})(\d{4})/, '$1***$2***$3');
  }
  return phone; // Return original if can't mask
}

// Format phone number for display (e.g., (123) 456-7890)
export function formatPhoneForDisplay(phone: string) {
  if (!phone) return '';
  // US format: (XXX) XXX-XXXX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

// Validate name (letters, spaces, hyphens, apostrophes only)
export function validateName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 30) return false;
  
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name)) return false;
  
  // Check for system/test names
  const systemWords = [
    'admin', 'moderator', 'system', 'test', 'fake', 'spam', 'bot', 'robot',
    'anonymous', 'anon', 'unknown', 'nobody', 'someone', 'anyone', 'everyone'
  ];
  
  const lowerName = name.toLowerCase();
  for (const word of systemWords) {
    if (lowerName.includes(word)) return false;
  }
  
  // Check for excessive repetition
  const repeatedChars = /(.)\1{4,}/;
  if (repeatedChars.test(name)) return false;
  
  // Check for excessive spaces
  if (name.includes('  ')) return false;
  
  return true;
}

// Validate ZIP code
export function validateZipCode(zip: string): boolean {
  if (!zip || zip.length < 3 || zip.length > 10) return false;
  const zipRegex = /^[A-Z0-9\s\-]{3,10}$/i;
  return zipRegex.test(zip);
}

// Validate plan ID format (UUID-like)
export function validatePlanId(planId: string): boolean {
  if (!planId || typeof planId !== 'string') return false;
  // Plan IDs should be alphanumeric and reasonable length
  const planIdRegex = /^[a-zA-Z0-9\-_]{8,50}$/;
  return planIdRegex.test(planId);
}

// Sanitize and validate plan data
export function sanitizePlanData(data: {
  topic: string;
  groupSize: string;
  zipCode: string;
  userName: string;
  phoneNumber: string;
}) {
  return {
    topic: sanitizeInput(data.topic),
    groupSize: sanitizeInput(data.groupSize),
    zipCode: sanitizeInput(data.zipCode),
    userName: sanitizeInput(data.userName),
    phoneNumber: data.phoneNumber.replace(/\D/g, '') // Keep only digits
  };
}

// Generate CSRF token
export function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Validate CSRF token
export function validateCSRFToken(token: string, storedToken: string): boolean {
  return token === storedToken;
}

// Check if user has access to plan (basic validation)
export function hasPlanAccess(planId: string, userPhone: string): boolean {
  if (!validatePlanId(planId) || !validatePhoneNumber(userPhone)) {
    return false;
  }
  // In a real app, you'd check database permissions here
  // For now, we just validate the format
  return true;
}