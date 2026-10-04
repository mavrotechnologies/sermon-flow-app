'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  confirmAction,
  forgotPasswordAction,
  loginAction,
  registerAction,
  resendCodeAction,
  resetPasswordAction,
  type AuthResult,
} from '@/app/auth/actions';
import { Button } from '@/components/ui/Button';
import { TextField } from './TextField';

type Mode = 'login' | 'register';

/**
 * `form` is the page's own form. Cognito confirms new accounts and resets
 * passwords with an emailed 6-digit code, so each has a step of its own:
 * `confirm` after sign-up (or logging in before confirming), `reset` after
 * "Forgot password?".
 *
 * PILOT: the `confirm` step is switched off at the source, not here. A Cognito
 * pre sign-up trigger (`sermon-flow-cognito-presignup`) confirms every new
 * account on the spot, so sign-up signs straight in and no code email is sent.
 * The step stays wired up so that removing the trigger is all it takes to
 * bring email confirmation back — see "Logins" in the README. `reset` is still
 * live: a code is the only way to prove someone owns the email they're resetting.
 */
type Step = 'form' | 'confirm' | 'reset';

interface AuthFormProps {
  mode: Mode;
  /** Where to land after success. Already sanitised by the page. */
  next?: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  code?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 8;
const CODE_PATTERN = /^\d{6}$/;

export function AuthForm({ mode, next }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === 'register';

  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [church, setChurch] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const errors: FieldErrors = {};

    if (step === 'form' && isRegister && name.trim().length < 2) {
      errors.name = 'Please tell us your name.';
    }
    if (step === 'form' && !EMAIL_PATTERN.test(email.trim())) {
      errors.email = 'That doesn’t look like a valid email address.';
    }
    if (step !== 'form' && !CODE_PATTERN.test(code.trim())) {
      errors.code = 'Enter the 6-digit code from the email.';
    }
    const settingPassword = (step === 'form' && isRegister) || step === 'reset';
    if (settingPassword && password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    } else if (step === 'form' && !password) {
      errors.password = 'Please enter your password.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  /** Apply what the server said: move to the next step, show an error, or leave. */
  function handle(result: AuthResult) {
    switch (result.status) {
      case 'signed-in':
        router.push(result.redirectTo);
        router.refresh();
        return;
      case 'confirm':
        setStep('confirm');
        setCode('');
        setNotice(`We’ve emailed a 6-digit code to ${email.trim()}. Enter it to finish setting up.`);
        return;
      case 'reset':
        setStep('reset');
        setCode('');
        setPassword('');
        setNotice(`If ${email.trim()} has an account, a reset code is on its way. Enter it with your new password.`);
        return;
      case 'sent':
        setNotice(`A new code is on its way to ${email.trim()}.`);
        return;
      case 'error':
        if (result.field) setFieldErrors({ [result.field]: result.error });
        else setFormError(result.error);
    }
  }

  async function run(action: () => Promise<AuthResult>) {
    setSubmitting(true);
    try {
      handle(await action());
    } catch {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setNotice(null);
    if (!validate()) return;

    if (step === 'confirm') {
      await run(() => confirmAction(email, code, password, next));
    } else if (step === 'reset') {
      await run(() => resetPasswordAction(email, code, password, next));
    } else if (isRegister) {
      await run(() => registerAction({ name, church, email, password, next }));
    } else {
      await run(() => loginAction(email, password, next));
    }
  }

  async function handleForgotPassword() {
    setFormError(null);
    setNotice(null);
    if (!EMAIL_PATTERN.test(email.trim())) {
      setFieldErrors({ email: 'Enter your email address first, then tap reset.' });
      return;
    }
    setFieldErrors({});
    await run(() => forgotPasswordAction(email));
  }

  async function handleResend() {
    setFormError(null);
    setNotice(null);
    await run(() => (step === 'reset' ? forgotPasswordAction(email) : resendCodeAction(email)));
  }

  function backToForm() {
    setStep('form');
    setCode('');
    setFieldErrors({});
    setFormError(null);
    setNotice(null);
  }

  const submitLabel = submitting
    ? 'One moment…'
    : step === 'confirm'
      ? 'Confirm and continue'
      : step === 'reset'
        ? 'Set new password'
        : isRegister
          ? 'Create account'
          : 'Log in';

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && (
        <p role="alert" className="rounded-control border border-danger/25 bg-danger-soft px-3.5 py-3 text-[0.875rem] text-danger">
          {formError}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="rounded-control border border-evergreen/25 bg-evergreen-soft px-3.5 py-3 text-[0.875rem] text-evergreen"
        >
          {notice}
        </p>
      )}

      {/* One `disabled` turns off every control inside while a request is out. */}
      <fieldset disabled={submitting} className="min-w-0 space-y-4">
        {step === 'form' && (
          <>
            {isRegister && (
              <>
                <TextField
                  label="Your name"
                  name="name"
                  autoComplete="name"
                  placeholder="Ama Mensah"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  error={fieldErrors.name}
                  required
                />
                <TextField
                  label="Church name"
                  name="church"
                  autoComplete="organization"
                  placeholder="Grace Chapel"
                  value={church}
                  onChange={(event) => setChurch(event.target.value)}
                  hint="Optional — it appears on your sermon notes."
                />
              </>
            )}

            <TextField
              label="Email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@church.org"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={fieldErrors.email}
              required
            />

            <TextField
              label="Password"
              name="password"
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              placeholder={isRegister ? 'At least 8 characters' : '••••••••'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={fieldErrors.password}
              revealable
              required
            />

            {!isRegister && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[0.875rem] font-semibold text-evergreen transition-opacity hover:opacity-75"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </>
        )}

        {step !== 'form' && (
          <>
            <TextField
              label="6-digit code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              error={fieldErrors.code}
              autoFocus
              required
            />

            {step === 'reset' && (
              <TextField
                label="New password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={fieldErrors.password}
                revealable
                required
              />
            )}

            <div className="flex items-center justify-between gap-3 text-[0.875rem]">
              <button
                type="button"
                onClick={backToForm}
                className="font-medium text-ink-muted transition-colors hover:text-ink"
              >
                Use a different email
              </button>
              <button
                type="button"
                onClick={handleResend}
                className="font-semibold text-evergreen transition-opacity hover:opacity-75"
              >
                Send a new code
              </button>
            </div>
          </>
        )}

        <Button type="submit" size="lg" fullWidth disabled={submitting} className="mt-2">
          {submitLabel}
        </Button>
      </fieldset>

      {isRegister && step === 'form' && (
        <p className="text-center text-[0.8125rem] leading-relaxed text-ink-muted">
          Free tier, no card required. You can delete your account at any time.
        </p>
      )}
    </form>
  );
}
