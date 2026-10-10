import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'crossbar_metro_jwt_secret_key_2026';
export const TOKEN_COOKIE_NAME = 'cma_auth_token';
export const TOKEN_EXPIRY = '30d';

export interface JwtUserPayload {
  userId: string;
  name: string;
  phone: string;
  role: UserRole;
  email?: string;
  playingPosition?: string;
  teamId?: string;
}

/**
 * Sign a JWT token with user payload
 */
export function signJwtToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Verify and decode a JWT token
 */
export function verifyJwtToken(token: string): JwtUserPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtUserPayload;
    return decoded;
  } catch (err) {
    return null;
  }
}

/**
 * Get currently authenticated user from incoming Next.js Request (cookie or Bearer header)
 */
export async function getAuthUserFromRequest(request?: Request): Promise<JwtUserPayload | null> {
  // 1. Check Authorization header
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const verified = verifyJwtToken(token);
      if (verified) return verified;
    }
  }

  // 2. Check cookies
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    if (token) {
      return verifyJwtToken(token);
    }
  } catch {
    // If called outside request context
  }

  return null;
}
