/**
 * Sanitize user input to prevent XSS and injection attacks
 */

export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove HTML tags and scripts
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '');
  
  // Remove common XSS patterns
  sanitized = sanitized
    .replace(/on\w+\s*=/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '');
  
  return sanitized;
}

export function sanitizeFilename(filename: string): string {
  if (!filename) return 'file';
  
  // Remove path traversal characters and special chars
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  // Basic validation for phone numbers (E.164 format)
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}
