import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  sub: string;
  email: string;
  contexts: Array<{
    domain: string;
    domain_id: string;
    domain_name: string;
    tenants: Array<{
      tenant_id: string;
      tenant_name: string;
      tenant_slug: string;
      roles: string[];
      permissions: string[];
    }>;
  }>;
  current_context?: {
    domain_id: string;
    tenant_id: string;
  };
  iat?: number;
  exp?: number;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    return null;
  }
};
