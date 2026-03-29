import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      // Check onboarding status after login to determine redirect
      try {
        const { data } = await api.get('/onboarding/status');
        if (data.is_complete) {
          navigate('/brand-analysis', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      } catch {
        navigate('/onboarding', { replace: true });
      }
    } catch (err) {
      const message = err.response?.data?.detail ?? 'Invalid email or password. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div
        className="hidden lg:flex w-[45%] flex-col justify-between p-10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #f7f9fb 0%, #f2f4f6 100%)',
        }}
      >
        {/* Logo */}
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">B</span>
            </div>
            <span className="font-display font-bold text-on-surface">Personal Brand OS</span>
          </div>
        </div>

        {/* Center content */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-fixed/40">
            <span className="material-symbols-outlined text-primary text-[16px]">auto_awesome</span>
            <span className="text-xs font-semibold text-on-primary-fixed-variant tracking-wide uppercase">
              The Digital Curator
            </span>
          </div>

          <h1 className="font-display font-800 text-4xl xl:text-5xl leading-tight text-on-surface">
            Your brand,{' '}
            <span className="italic" style={{ color: '#001674' }}>
              powered
            </span>{' '}
            by AI.
          </h1>

          <p className="text-on-surface-variant text-base leading-relaxed max-w-md">
            Build, manage, and scale your personal brand with AI-powered insights,
            content planning, and automated publishing workflows.
          </p>

          {/* AI Insight Card */}
          <div className="glass ghost-border rounded-2xl p-5 max-w-sm shadow-ambient">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-surface-tint text-[18px]">
                psychology
              </span>
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                AI Insight
              </span>
            </div>
            <p className="text-sm text-on-surface leading-relaxed">
              &ldquo;Professionals who actively curate their personal brand receive{' '}
              <span className="font-semibold text-primary">5.7x more</span> inbound
              opportunities than those who don&rsquo;t.&rdquo;
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-on-surface-variant/60">
          Trusted by 2,000+ elite brand curators worldwide
        </p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-container-lowest">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="font-display font-bold text-2xl text-on-surface">Welcome back</h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* OAuth buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled
              className="btn-outline flex items-center justify-center gap-2 text-sm opacity-50 cursor-not-allowed"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
            <button
              disabled
              className="btn-outline flex items-center justify-center gap-2 text-sm opacity-50 cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="#191c1e" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-outline-variant/20" />
            <span className="text-xs font-medium text-on-surface-variant/60 uppercase tracking-wider">
              Or email
            </span>
            <div className="flex-1 h-px bg-outline-variant/20" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="px-4 py-3 rounded-lg bg-error-container text-error text-sm font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-on-surface" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-on-surface" htmlFor="password">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-surface-tint hover:text-primary transition-colors"
                >
                  Forgot?
                </button>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input-field"
                placeholder="Enter your password"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(event) => setKeepSignedIn(event.target.checked)}
                className="w-4 h-4 rounded border-outline-variant/30 text-primary focus:ring-surface-tint"
              />
              <span className="text-sm text-on-surface-variant">
                Keep me signed in for 30 days
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                'Sign in to Dashboard'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-on-surface-variant">
            New to Personal Brand OS?{' '}
            <Link
              to="/signup"
              className="font-semibold text-surface-tint hover:text-primary transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
