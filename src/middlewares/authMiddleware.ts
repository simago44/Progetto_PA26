import { auth } from 'express-oauth2-jwt-bearer';

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN as string;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE as string;

// Configure JWT validation middleware
export const checkJwt = auth({
  issuerBaseURL: `https://${AUTH0_DOMAIN}`,
  audience: AUTH0_AUDIENCE,
});