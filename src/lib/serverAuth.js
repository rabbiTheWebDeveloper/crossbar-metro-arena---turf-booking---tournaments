import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
const JWT_SECRET = process.env.JWT_SECRET || 'crossbar_metro_jwt_secret_key_2026';
export const TOKEN_COOKIE_NAME = 'cma_auth_token';
export const TOKEN_EXPIRY = '30d';
/**
 * Sign a JWT token with user payload
 */
export function signJwtToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}
/**
 * Verify and decode a JWT token
 */
export function verifyJwtToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    }
    catch (err) {
        return null;
    }
}
/**
 * Get currently authenticated user from incoming Next.js Request (cookie or Bearer header)
 */
export async function getAuthUserFromRequest(request) {
    // 1. Check Authorization header
    if (request) {
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const verified = verifyJwtToken(token);
            if (verified)
                return verified;
        }
    }
    // 2. Check cookies
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
        if (token) {
            return verifyJwtToken(token);
        }
    }
    catch {
        // If called outside request context
    }
    return null;
}
