import { useState, useEffect, useCallback } from 'react';

function Spinner() {
  return (
    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
  );
}

export default function DraftEditorModal({
  post,
  onSave,
  onApprove,
  onRegenerate,
  onClose,
}) {
  const [hook, setHook] = useState('');
  const [body, setBody] = useState('');
  const [callToAction, setCallToAction] = useState('');
  const [savingState, setSavingState] = useState(null);

  useEffect(() => {
    if (post) {
      setHook(post.hook || '');
      setBody(post.body || '');
      setCallToAction(post.call_to_action || '');
      setSavingState(null);
    }
  }, [post]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleSave = async () => {
    setSavingState('saving');
    try {
      await onSave(post.id, { hook, body, call_to_action: callToAction });
      setSavingState(null);
    } catch {
      setSavingState(null);
    }
  };

  const handleApprove = async () => {
    setSavingState('approving');
    try {
      await onSave(post.id, { hook, body, call_to_action: callToAction });
      await onApprove(post.id);
      setSavingState(null);
    } catch {
      setSavingState(null);
    }
  };

  const handleRegenerate = async () => {
    setSavingState('regenerating');
    try {
      await onRegenerate(post.id);
      setSavingState(null);
    } catch {
      setSavingState(null);
    }
  };

  const isDisabled = savingState !== null;

  if (!post) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end"
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-2xl h-full bg-surface overflow-y-auto shadow-ambient animate-slide-in">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="inline-block px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-[10px] font-bold tracking-[0.15em] uppercase">
              Draft Editor
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-surface-container-high transition-colors duration-200"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                close
              </span>
            </button>
          </div>

          {/* AI Insight */}
          {post.ai_insight && (
            <div className="glass rounded-xl p-5 relative overflow-hidden ghost-border">
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
                style={{ background: 'linear-gradient(180deg, #2e0074, #4a2580)' }}
              />
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-tertiary text-[18px]">
                  auto_awesome
                </span>
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  AI Insight
                </span>
              </div>
              <p className="text-on-surface text-sm leading-relaxed italic pl-0.5">
                &ldquo;{post.ai_insight}&rdquo;
              </p>
            </div>
          )}

          {/* Hook Field */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.12em]">
              The Hook
            </label>
            <input
              type="text"
              value={hook}
              onChange={(event) => setHook(event.target.value)}
              placeholder="Write a compelling opening line..."
              className="input-field"
              disabled={isDisabled}
            />
          </div>

          {/* Body Field */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.12em]">
              Body Content
            </label>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write the main content of your post..."
              className="input-field min-h-[200px] resize-y"
              disabled={isDisabled}
            />
          </div>

          {/* CTA Field */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.12em]">
              Call to Action
            </label>
            <input
              type="text"
              value={callToAction}
              onChange={(event) => setCallToAction(event.target.value)}
              placeholder="What do you want your audience to do?"
              className="input-field"
              disabled={isDisabled}
            />
          </div>

          {/* Post metadata tags */}
          {(post.pillar || post.format || post.platform) && (
            <div className="flex flex-wrap gap-2">
              {post.pillar && (
                <span className="px-3 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-xs font-medium">
                  {post.pillar}
                </span>
              )}
              {post.format && (
                <span className="px-3 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-xs font-medium">
                  {post.format}
                </span>
              )}
              {post.platform && (
                <span className="px-3 py-1.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-xs font-medium">
                  {post.platform}
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isDisabled}
              className="btn-outline flex items-center gap-2 text-sm"
            >
              {savingState === 'regenerating' ? (
                <Spinner />
              ) : (
                <span className="material-symbols-outlined text-[18px]">
                  auto_awesome
                </span>
              )}
              Regenerate with AI
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isDisabled}
              className="btn-outline flex items-center gap-2 text-sm"
            >
              {savingState === 'saving' ? <Spinner /> : null}
              Save Draft
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={isDisabled}
              className="btn-primary flex items-center gap-2 text-sm ml-auto"
            >
              {savingState === 'approving' ? <Spinner /> : null}
              Approve &amp; Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
