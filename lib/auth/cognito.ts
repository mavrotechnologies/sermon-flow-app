import 'server-only';
import { COGNITO_CLIENT_ID, COGNITO_REGION } from './config';

/**
 * A thin client for the Cognito user-pool API. The calls used here (sign-up,
 * sign-in, confirm, password reset, refresh) are public — they need no AWS
 * credentials, only the app client ID — so plain fetch is enough.
 */

const ENDPOINT = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;

export class CognitoError extends Error {
  constructor(
    /** e.g. "NotAuthorizedException", "UserNotConfirmedException" */
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

async function call<T>(action: string, body: Record<string, unknown>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    throw new CognitoError('NetworkError', 'Couldn’t reach the login service. Check your connection and try again.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = String(data.__type ?? 'UnknownError').split('#').pop()!;
    throw new CognitoError(code, data.message ?? 'Something went wrong. Please try again.');
  }
  return data as T;
}

export interface Tokens {
  idToken: string;
  accessToken: string;
  /** Absent on a refresh — Cognito keeps the original refresh token valid. */
  refreshToken?: string;
  expiresIn: number;
}

interface AuthResult {
  AuthenticationResult?: {
    IdToken: string;
    AccessToken: string;
    RefreshToken?: string;
    ExpiresIn: number;
  };
  ChallengeName?: string;
}

function toTokens(result: AuthResult): Tokens {
  const auth = result.AuthenticationResult;
  if (!auth) {
    // e.g. NEW_PASSWORD_REQUIRED for an account an admin created with a temporary password.
    throw new CognitoError(result.ChallengeName ?? 'ChallengeRequired', 'This account needs a new password. Use “Forgot password?” to set one.');
  }
  return {
    idToken: auth.IdToken,
    accessToken: auth.AccessToken,
    refreshToken: auth.RefreshToken,
    expiresIn: auth.ExpiresIn,
  };
}

export async function signIn(email: string, password: string): Promise<Tokens> {
  return toTokens(
    await call<AuthResult>('InitiateAuth', {
      ClientId: COGNITO_CLIENT_ID,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: { USERNAME: email, PASSWORD: password },
    })
  );
}

export async function refresh(refreshToken: string): Promise<Tokens> {
  return toTokens(
    await call<AuthResult>('InitiateAuth', {
      ClientId: COGNITO_CLIENT_ID,
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: { REFRESH_TOKEN: refreshToken },
    })
  );
}

export async function signUp(input: { email: string; password: string; name: string; church: string | null }) {
  const attributes = [{ Name: 'name', Value: input.name }];
  if (input.church) attributes.push({ Name: 'custom:church_name', Value: input.church });

  return call<{ UserConfirmed: boolean; CodeDeliveryDetails?: { Destination?: string } }>('SignUp', {
    ClientId: COGNITO_CLIENT_ID,
    Username: input.email,
    Password: input.password,
    UserAttributes: attributes,
  });
}

export async function confirmSignUp(email: string, code: string) {
  await call('ConfirmSignUp', { ClientId: COGNITO_CLIENT_ID, Username: email, ConfirmationCode: code });
}

export async function resendCode(email: string) {
  await call('ResendConfirmationCode', { ClientId: COGNITO_CLIENT_ID, Username: email });
}

export async function forgotPassword(email: string) {
  await call('ForgotPassword', { ClientId: COGNITO_CLIENT_ID, Username: email });
}

export async function confirmForgotPassword(email: string, code: string, password: string) {
  await call('ConfirmForgotPassword', {
    ClientId: COGNITO_CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
    Password: password,
  });
}

/** Ends the session everywhere it was used: the refresh token and its access tokens stop working. */
export async function revoke(refreshToken: string) {
  await call('RevokeToken', { ClientId: COGNITO_CLIENT_ID, Token: refreshToken });
}
