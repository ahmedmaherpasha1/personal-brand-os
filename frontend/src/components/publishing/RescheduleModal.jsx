import { useState, useEffect, useCallback } from 'react';

export default function RescheduleModal({ post, onReschedule, onClose }) {
  const existingDate = post.scheduled_at ? new Date(post.scheduled_at) : new Date();

  const [date, setDate] = useState(
    existingDate.toISOString().split('T')[0]
  );
  const [time, setTime] = useState(
    existingDate.toTimeString().slice(0, 5)
  );
  const [isLoading, setIsLoading] = useState(false);

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
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!date || !time) return;

    setIsLoading(true);
    try {
      const scheduledAt = `${date}T${time}:00`;
      await onReschedule(post.id, scheduledAt);
      onClose();
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient max-w-md w-full p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-fixed-variant text-[20px]">
              schedule
            </span>
          </div>
          <h2 className="font-display font-bold text-xl text-on-surface">
            Reschedule Post
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="input-field"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Rescheduling...
                </>
              ) : (
                'Reschedule'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
