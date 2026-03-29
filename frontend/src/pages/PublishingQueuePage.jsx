import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getPublishingQueue, reschedulePost, markAsCopied } from '../services/publishingApi';
import RescheduleModal from '../components/publishing/RescheduleModal';
import { useToast } from '../components/ui/Toast';

function formatDateLabel(dateStr) {
  if (!dateStr) return 'Unscheduled';

  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const options = { month: 'short', day: 'numeric' };
  const formatted = date.toLocaleDateString('en-US', options);

  if (date.getTime() === today.getTime()) return `Today, ${formatted}`;
  if (date.getTime() === tomorrow.getTime()) return `Tomorrow, ${formatted}`;

  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  return `${dayName}, ${formatted}`;
}

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function getDateKey(isoString) {
  if (!isoString) return 'unscheduled';
  return isoString.split('T')[0];
}

function groupPostsByDate(posts) {
  const groups = {};
  const order = [];

  posts.forEach((post) => {
    const key = getDateKey(post.scheduled_at);
    if (!groups[key]) {
      groups[key] = [];
      order.push(key);
    }
    groups[key].push(post);
  });

  order.sort((a, b) => {
    if (a === 'unscheduled') return 1;
    if (b === 'unscheduled') return -1;
    return a.localeCompare(b);
  });

  return order.map((key) => ({
    dateKey: key,
    label: formatDateLabel(key === 'unscheduled' ? null : key),
    posts: groups[key],
  }));
}

function getAvailableMonths(posts) {
  const months = new Set();
  posts.forEach((post) => {
    if (post.scheduled_at) {
      const date = new Date(post.scheduled_at);
      months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }
  });
  return [...months].sort();
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function StatusBadge({ status }) {
  const label = status === 'copied' ? 'COPIED' : 'SCHEDULED';
  const bg = status === 'copied' ? 'bg-secondary-container' : 'bg-primary-fixed';
  const text = status === 'copied' ? 'text-on-secondary-container' : 'text-on-primary-fixed-variant';

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-[0.1em] uppercase ${bg} ${text}`}
    >
      {label}
    </span>
  );
}

function PostCard({ post, onCopy, onReschedule }) {
  const contentPreview = post.hook || post.body || '';
  const platform = post.platform || 'LinkedIn';

  return (
    <div className="ml-10 mb-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm font-medium text-on-surface-variant">
          {formatTime(post.scheduled_at)}
        </span>
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          {platform}
        </span>
        <StatusBadge status={post.status} />
      </div>

      <div className="bg-surface-container-low rounded-xl p-5 relative overflow-hidden">
        {/* Left accent bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ background: 'linear-gradient(135deg, #001674, #1a2e94)' }}
        />

        <p className="text-on-surface text-sm leading-relaxed pl-3 line-clamp-4">
          {contentPreview}
        </p>

        <div className="flex items-center gap-2 mt-4 pl-3">
          <button
            type="button"
            onClick={() => onCopy(post)}
            className="btn-outline text-xs px-4 py-2 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            COPY TO CLIPBOARD
          </button>
          <button
            type="button"
            onClick={() => onReschedule(post)}
            className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center transition-colors hover:bg-surface-container-highest"
            title="Reschedule"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              schedule
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function DateGroup({ group, onCopy, onReschedule }) {
  return (
    <div className="relative">
      {/* Date header with circle icon */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10"
          style={{ background: 'linear-gradient(135deg, #001674, #1a2e94)' }}
        >
          <span className="material-symbols-outlined text-white text-[16px]">
            calendar_today
          </span>
        </div>
        <h3 className="font-display font-bold text-lg text-on-surface">
          {group.label}
        </h3>
      </div>

      {/* Post cards */}
      {group.posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onCopy={onCopy}
          onReschedule={onReschedule}
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 rounded-2xl bg-primary-fixed flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-on-primary-fixed-variant text-[36px]">
            schedule_send
          </span>
        </div>
        <h2 className="font-display font-bold text-3xl text-on-surface mb-3">
          Publishing Queue
        </h2>
        <p className="text-on-surface-variant text-base mb-8 leading-relaxed max-w-md mx-auto">
          No posts in your publishing queue yet. Approve posts from your Content Plan first.
        </p>
        <Link to="/content-plan" className="btn-primary text-base inline-block">
          Go to Content Plan
        </Link>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-surface-container-high" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-surface-tint animate-spin" />
      </div>
    </div>
  );
}

export default function PublishingQueuePage() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const { showToast } = useToast();

  const fetchQueue = useCallback(async () => {
    try {
      setStatus('loading');
      setError(null);
      const { data } = await getPublishingQueue();
      const queuePosts = data.posts || data || [];
      setPosts(queuePosts);
      setStatus(queuePosts.length > 0 ? 'loaded' : 'empty');
    } catch (err) {
      if (err.response?.status === 404) {
        setStatus('empty');
      } else {
        setError(err.response?.data?.detail || 'Failed to load publishing queue.');
        setStatus('error');
      }
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const availableMonths = useMemo(() => getAvailableMonths(posts), [posts]);

  const filteredPosts = useMemo(() => {
    if (selectedMonth === 'all') return posts;
    return posts.filter((post) => {
      if (!post.scheduled_at) return false;
      const date = new Date(post.scheduled_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    });
  }, [posts, selectedMonth]);

  const dateGroups = useMemo(() => groupPostsByDate(filteredPosts), [filteredPosts]);

  const handleCopy = useCallback(
    async (post) => {
      const parts = [post.hook, post.body, post.cta].filter(Boolean);
      const text = parts.join('\n\n');

      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Fallback for non-secure contexts
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      try {
        await markAsCopied(post.id);
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, status: 'copied' } : p))
        );
      } catch {
        // Badge update is non-critical
      }

      showToast('Copied to clipboard!', 'success');
    },
    [showToast]
  );

  const handleReschedule = useCallback(async (postId, scheduledAt) => {
    await reschedulePost(postId, scheduledAt);
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, scheduled_at: scheduledAt } : p))
    );
  }, []);

  const openRescheduleModal = useCallback((post) => {
    setRescheduleTarget(post);
  }, []);

  const closeRescheduleModal = useCallback(() => {
    setRescheduleTarget(null);
  }, []);

  if (status === 'loading') return <LoadingState />;

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-error-container flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-error text-[28px]">error</span>
          </div>
          <h3 className="font-display font-semibold text-xl text-on-surface mb-2">
            Something went wrong
          </h3>
          <p className="text-on-surface-variant text-sm mb-6">{error}</p>
          <button onClick={fetchQueue} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (status === 'empty') return <EmptyState />;

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-[10px] font-bold tracking-[0.15em] uppercase mb-4">
              Content Operations
            </span>
            <h1 className="font-display font-bold text-4xl text-on-surface mb-2">
              Publishing Queue
            </h1>
            <p className="text-on-surface-variant text-base leading-relaxed">
              Orchestrate your digital presence with scheduled, ready-to-publish content.
            </p>
          </div>

          {/* Month selector */}
          {availableMonths.length > 0 && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                calendar_month
              </span>
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="input-field py-2 px-3 text-sm w-auto min-w-[160px]"
              >
                <option value="all">All Months</option>
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {formatMonthLabel(month)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical timeline line */}
          <div
            className="absolute left-[15px] top-4 bottom-0 w-0.5"
            style={{ background: 'linear-gradient(to bottom, #001674, #1a2e94, transparent)' }}
          />

          <div className="space-y-8">
            {dateGroups.map((group) => (
              <DateGroup
                key={group.dateKey}
                group={group}
                onCopy={handleCopy}
                onReschedule={openRescheduleModal}
              />
            ))}
          </div>
        </div>
      </div>

      {rescheduleTarget && (
        <RescheduleModal
          post={rescheduleTarget}
          onReschedule={handleReschedule}
          onClose={closeRescheduleModal}
        />
      )}
    </>
  );
}
