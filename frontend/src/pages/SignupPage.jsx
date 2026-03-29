import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);

    try {
      await signup(email, password);
      navigate('/brand-analysis', { replace: true });
    } catch (err) {
      const message = err.response?.data?.detail ?? 'Could not create account. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - same as login */}
      <div
        className="hidden lg:flex w-[45%] flex-col justify-between p-10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #f7f9fb 0%, #f2f4f6 100%)',
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">B</span>
            </div>
            <span className="font-display font-bold text-on-surface">Personal Brand OS</span>
          </div>
        </div>

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

        <p className="text-xs text-on-surface-variant/60">
          Trusted by 2,000+ elite brand curators worldwide
        </p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-container-lowest">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="font-display font-bold text-2xl text-on-surface">
              Create your account
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Start building your AI-powered personal brand
            </p>
          </div>

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
              <label className="text-sm font-medium text-on-surface" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input-field"
                placeholder="Min 8 characters"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-on-surface" htmlFor="confirm-password">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="input-field"
                placeholder="Re-enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-surface-tint hover:text-primary transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
