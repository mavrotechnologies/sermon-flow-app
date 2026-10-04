'use server';

import { cookies } from 'next/headers';
import * as cognito from '@/lib/auth/cognito';
import { CognitoError } from '@/lib/auth/cognito';
import { REFRESH_COOKIE, clearSessionCookies, writeSessionCookies } from '@/lib/auth/session';
import { safeInternalPath } from '@/lib/redirects';

/**
 * Every login step, run on the server so the tokens go straight into httpOnly
 * cookies and never pass through page scripts.
 */

export type AuthResult =
  | { status: 'signed-in'; redirectTo: string }
  /** A confirmation code was emailed; the form asks for it next. */
  | { status: 'confirm' }
  /** A password-reset code was emailed. */
  | { status: 'reset' }
  | { status: 'sent' }
  | { status: 'error'; error: string; field?: 'email' | 'password' | 'code' };

const MESSAGES: Record<string, AuthResult & { status: 'error' }> = {
  NotAuthorizedException: { status: 'error', error: 'That email and password don’t match an account.' },
  UserNotFoundException: { status: 'error', error: 'That email and password don’t match an account.' },
  UsernameExistsException: {
    status: 'error',
    error: 'There’s already an account with that email. Log in instead.',
    field: 'email',
  },
  InvalidPasswordException: { status: 'error', error: 'Use at least 8 characters.', field: 'password' },
  CodeMismatchException: { status: 'error', error: 'That code isn’t right. Check the email and try again.', field: 'code' },
  ExpiredCodeException: { status: 'error', error: 'That code has expired. Send a new one.', field: 'code' },
  LimitExceededException: { status: 'error', error: 'Too many attempts. Wait a few minutes and try again.' },
  TooManyRequestsException: { status: 'error', error: 'Too many attempts. Wait a few minutes and try again.' },
  TooManyFailedAttemptsException: { status: 'error', error: 'Too many attempts. Wait a few minutes and try again.' },
  InvalidParameterException: { status: 'error', error: 'Please check the details and try again.' },
};

function failure(error: unknown): AuthResult {
  if (error instanceof CognitoError) {
    return MESSAGES[error.code] ?? { status: 'error', error: error.message };
  }
  console.error('[auth]', error);
  return { status: 'error', error: 'Something went wrong. Please try again.' };
}

const clean = (email: string) => email.trim().toLowerCase();

async function startSession(email: string, password: string, next?: string): Promise<AuthResult> {
  const tokens = await cognito.signIn(clean(email), password);
  writeSessionCookies(await cookies(), tokens);
  return { status: 'signed-in', redirectTo: safeInternalPath(next) };
}

export async function loginAction(email: string, password: string, next?: string): Promise<AuthResult> {
  try {
    return await startSession(email, password, next);
  } catch (error) {
    // Signed up but never entered the code: send a fresh one and ask for it.
    if (error instanceof CognitoError && error.code === 'UserNotConfirmedException') {
      try {
        await cognito.resendCode(clean(email));
      } catch (resendError) {
        return failure(resendError);
      }
      return { status: 'confirm' };
    }
    return failure(error);
  }
}

export async function registerAction(input: {
  name: string;
  church: string;
  email: string;
  password: string;
  next?: string;
}): Promise<AuthResult> {
  try {
    const result = await cognito.signUp({
      email: clean(input.email),
      password: input.password,
      name: input.name.trim(),
      church: input.church.trim() || null,
    });
    if (result.UserConfirmed) return await startSession(input.email, input.password, input.next);
    return { status: 'confirm' };
  } catch (error) {
    return failure(error);
  }
}

/** Confirms a new account with the emailed code, then signs straight in. */
export async function confirmAction(email: string, code: string, password: string, next?: string): Promise<AuthResult> {
  try {
    await cognito.confirmSignUp(clean(email), code.trim());
    return await startSession(email, password, next);
  } catch (error) {
    return failure(error);
  }
}

export async function resendCodeAction(email: string): Promise<AuthResult> {
  try {
    await cognito.resendCode(clean(email));
    return { status: 'sent' };
  } catch (error) {
    return failure(error);
  }
}

export async function forgotPasswordAction(email: string): Promise<AuthResult> {
  try {
    await cognito.forgotPassword(clean(email));
    return { status: 'reset' };
  } catch (error) {
    return failure(error);
  }
}

/** Sets the new password with the emailed code, then signs straight in. */
export async function resetPasswordAction(
  email: string,
  code: string,
  password: string,
  next?: string
): Promise<AuthResult> {
  try {
    await cognito.confirmForgotPassword(clean(email), code.trim(), password);
    return await startSession(email, password, next);
  } catch (error) {
    return failure(error);
  }
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  clearSessionCookies(store);
  if (refreshToken) {
    // Best effort: the cookies are already gone either way.
    await cognito.revoke(refreshToken).catch((error) => console.warn('[auth] revoke failed', error));
  }
}
