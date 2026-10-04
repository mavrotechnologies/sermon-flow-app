/**
 * AWS Cognito user pool "sermon-flow" (carrycome account, eu-west-1). These are
 * public identifiers, not secrets — the app client has no secret — so they have
 * working defaults and the env vars only exist to point at a different pool.
 */
export const COGNITO_REGION = process.env.NEXT_PUBLIC_COGNITO_REGION || 'eu-west-1';
export const COGNITO_USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'eu-west-1_sgPMhuE0p';
export const COGNITO_CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '4lm8prl7f3oq3l07sadidgf4hl';

/** The SermonFlow backend on the ChristChurch Server. */
export const API_URL = (
  process.env.NEXT_PUBLIC_SERMONFLOW_API_URL || 'https://sermon-flow.63-35-64-133.sslip.io'
).replace(/\/+$/, '');
