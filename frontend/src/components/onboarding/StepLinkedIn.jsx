import { useState } from 'react';
import api from '../../services/api';

export default function StepLinkedIn({ data, onUpdate }) {
  const [linkedinUrl, setLinkedinUrl] = useState(data.linkedin_url ?? '');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(!!data.linkedin_data);
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState('');

  const [headline, setHeadline] = useState(data.manual_headline ?? '');
  const [summary, setSummary] = useState(data.manual_summary ?? '');
  const [posts, setPosts] = useState(data.manual_posts ?? []);
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const handleAnalyze = async () => {
    if (!linkedinUrl.trim()) {
      setError('Please enter your LinkedIn profile URL.');
      return;
    }

    setError('');
    setAnalyzing(true);

    try {
      const { data: responseData } = await api.post('/onboarding/linkedin', {
        linkedin_url: linkedinUrl.trim(),
      });
      onUpdate({
        linkedin_url: linkedinUrl.trim(),
        linkedin_data: responseData,
      });
      setAnalyzed(true);
    } catch (err) {
      const message =
        err.response?.data?.detail ?? 'Failed to analyze profile. Try again or enter manually.';
      setError(message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!headline.trim()) {
      setError('Please enter your headline.');
      return;
    }

    setError('');
    setManualSubmitting(true);

    try {
      const payload = {
        headline: headline.trim(),
        summary: summary.trim(),
        posts: posts.filter((post) => post.trim() !== ''),
      };
      const { data: responseData } = await api.post('/onboarding/linkedin/manual', payload);
      onUpdate({
        linkedin_data: responseData,
        manual_headline: headline,
        manual_summary: summary,
        manual_posts: posts,
      });
      setAnalyzed(true);
      setShowManual(false);
    } catch (err) {
      const message =
        err.response?.data?.detail ?? 'Failed to save profile data. Please try again.';
      setError(message);
    } finally {
      setManualSubmitting(false);
    }
  };

  const addPost = () => {
    setPosts([...posts, '']);
  };

  const updatePost = (index, value) => {
    const updated = posts.map((post, idx) => (idx === index ? value : post));
    setPosts(updated);
  };

  const removePost = (index) => {
    setPosts(posts.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-display font-bold text-3xl text-on-surface">
          Connect Your Profile
        </h2>
        <p className="text-on-surface-variant text-base mt-2 max-w-lg mx-auto">
          Link your LinkedIn to let AI analyze your content style, audience, and
          professional positioning.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-error-container text-error text-sm font-medium text-center">
          {error}
        </div>
      )}

      {analyzed && data.linkedin_data ? (
        <div className="bg-surface-container-lowest rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-surface-tint text-[24px]">
              check_circle
            </span>
            <h3 className="font-display font-semibold text-on-surface">
              Profile Analyzed Successfully
            </h3>
          </div>
          <div className="space-y-3 text-sm text-on-surface-variant">
            {data.linkedin_data.headline && (
              <div>
                <span className="font-medium text-on-surface">Headline: </span>
                {data.linkedin_data.headline}
              </div>
            )}
            {data.linkedin_data.summary && (
              <div>
                <span className="font-medium text-on-surface">Summary: </span>
                <span className="line-clamp-3">{data.linkedin_data.summary}</span>
              </div>
            )}
            {data.linkedin_data.posts_count != null && (
              <div>
                <span className="font-medium text-on-surface">Posts analyzed: </span>
                {data.linkedin_data.posts_count}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setAnalyzed(false);
              onUpdate({ linkedin_data: null });
            }}
            className="text-sm font-medium text-surface-tint hover:text-primary transition-colors"
          >
            Re-analyze or change profile
          </button>
        </div>
      ) : (
        <>
          {/* LinkedIn URL input */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-on-surface" htmlFor="linkedin-url">
                LinkedIn Profile URL
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-sm">
                    linkedin.com/in/
                  </span>
                  <input
                    id="linkedin-url"
                    type="text"
                    value={linkedinUrl}
                    onChange={(event) => setLinkedinUrl(event.target.value)}
                    className="input-field pl-[135px]"
                    placeholder="your-profile"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="btn-primary flex items-center gap-2 whitespace-nowrap"
                >
                  {analyzing ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Profile'
                  )}
                </button>
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowManual(!showManual)}
                className="text-sm font-medium text-surface-tint hover:text-primary transition-colors"
              >
                {showManual ? 'Hide manual form' : 'Skip & Enter Manually'}
              </button>
            </div>
          </div>

          {/* Manual fallback form */}
          {showManual && (
            <div className="bg-surface-container-lowest rounded-xl p-6 space-y-5">
              <h3 className="font-display font-semibold text-on-surface text-lg">
                Enter Profile Details Manually
              </h3>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-on-surface" htmlFor="headline">
                  Headline
                </label>
                <input
                  id="headline"
                  type="text"
                  value={headline}
                  onChange={(event) => setHeadline(event.target.value)}
                  className="input-field"
                  placeholder="e.g. VP of Engineering at TechCorp"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-on-surface" htmlFor="summary">
                  Summary / About
                </label>
                <textarea
                  id="summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  className="input-field min-h-[100px] resize-y"
                  placeholder="A brief summary of your professional background..."
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-on-surface">
                    Sample Posts
                  </label>
                  <button
                    type="button"
                    onClick={addPost}
                    className="text-sm font-medium text-surface-tint hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Add Post
                  </button>
                </div>
                {posts.map((post, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={post}
                      onChange={(event) => updatePost(index, event.target.value)}
                      className="input-field min-h-[80px] resize-y flex-1"
                      placeholder={`Sample post ${index + 1}...`}
                    />
                    <button
                      type="button"
                      onClick={() => removePost(index)}
                      className="text-on-surface-variant hover:text-error transition-colors self-start mt-3"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleManualSubmit}
                disabled={manualSubmitting}
                className="btn-primary flex items-center gap-2"
              >
                {manualSubmitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Profile Data'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function validateLinkedIn(data) {
  if (!data.linkedin_data) {
    return 'Please analyze your LinkedIn profile or enter your details manually.';
  }
  return null;
}
