import { useState, useEffect, useCallback } from 'react';
import {
  getContentPlan,
  generateContentPlan,
  updatePost,
  approvePost,
  regeneratePost,
} from '../services/contentApi';
import PostCard from '../components/content/PostCard';
import DraftEditorModal from '../components/content/DraftEditorModal';

const WEEK_TABS = ['All', 'Week 1', 'Week 2', 'Week 3', 'Week 4'];

function EmptyState({ onGenerate, isLoading }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 rounded-2xl bg-primary-fixed flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-on-primary-fixed-variant text-[36px]">
            edit_calendar
          </span>
        </div>
        <h2 className="font-display font-bold text-3xl text-on-surface mb-3">
          Generate Your Content Plan
        </h2>
        <p className="text-on-surface-variant text-base mb-8 leading-relaxed max-w-md mx-auto">
          Let AI create a strategic content calendar based on your brand archetype, pillars, and tone of voice.
        </p>
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="btn-primary text-base"
        >
          {isLoading ? 'Starting...' : 'Generate Content Plan'}
        </button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-surface-container-high" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-surface-tint animate-spin" />
        </div>
        <h3 className="font-display font-semibold text-xl text-on-surface mb-2">
          Generating your content strategy...
        </h3>
        <p className="text-on-surface-variant text-sm animate-pulse">
          This may take a moment while our AI crafts your personalized plan
        </p>
      </div>
    </div>
  );
}

function getPostWeek(post) {
  return post.week || 1;
}

function getPostCountByWeek(posts, week) {
  if (week === 'All') return posts.length;
  const weekNumber = parseInt(week.replace('Week ', ''), 10);
  return posts.filter((post) => getPostWeek(post) === weekNumber).length;
}

function filterPostsByWeek(posts, activeTab) {
  if (activeTab === 'All') return posts;
  const weekNumber = parseInt(activeTab.replace('Week ', ''), 10);
  return posts.filter((post) => getPostWeek(post) === weekNumber);
}

function PlanView({ plan, onPostClick, activeTab, onTabChange }) {
  const posts = plan.posts || [];
  const filteredPosts = filterPostsByWeek(posts, activeTab);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <span className="inline-block px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-[10px] font-bold tracking-[0.15em] uppercase mb-4">
          AI Content Strategy
        </span>
        <h1 className="font-display font-bold text-4xl text-on-surface mb-2">
          {plan.title || 'Content Plan'}
        </h1>
        <p className="text-on-surface-variant text-base">
          {posts.length} posts planned across 4 weeks
        </p>
      </div>

      {/* Week Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {WEEK_TABS.map((tab) => {
          const count = getPostCountByWeek(posts, tab);
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                isActive
                  ? 'text-white'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
              style={
                isActive
                  ? { background: 'linear-gradient(135deg, #001674, #1a2e94)' }
                  : undefined
              }
            >
              {tab}
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-container-lowest text-on-surface-variant'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Posts Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} onClick={onPostClick} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-on-surface-variant/40 text-[48px] mb-3 block">
            inbox
          </span>
          <p className="text-on-surface-variant text-sm">
            No posts for this week yet.
          </p>
        </div>
      )}
    </div>
  );
}

export default function ContentPlanPage() {
  const [plan, setPlan] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedPost, setSelectedPost] = useState(null);

  const fetchPlan = useCallback(async () => {
    try {
      setStatus('loading-fetch');
      setError(null);
      const { data } = await getContentPlan();
      setPlan(data);
      setStatus('plan');
    } catch (err) {
      if (err.response?.status === 404) {
        setStatus('empty');
      } else {
        setError(err.response?.data?.detail || 'Failed to load content plan.');
        setStatus('error');
      }
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    try {
      setStatus('generating');
      setError(null);
      const { data } = await generateContentPlan();
      setPlan(data);
      setStatus('plan');
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Failed to generate content plan. Please try again.'
      );
      setStatus('error');
    }
  }, []);

  const handlePostClick = useCallback((post) => {
    setSelectedPost(post);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedPost(null);
  }, []);

  const handleSave = useCallback(
    async (postId, data) => {
      await updatePost(postId, data);
      const { data: refreshed } = await getContentPlan();
      setPlan(refreshed);
      const updatedPost = refreshed.posts?.find((p) => p.id === postId);
      if (updatedPost) {
        setSelectedPost(updatedPost);
      }
    },
    []
  );

  const handleApprove = useCallback(
    async (postId) => {
      await approvePost(postId);
      const { data: refreshed } = await getContentPlan();
      setPlan(refreshed);
      setSelectedPost(null);
    },
    []
  );

  const handleRegenerate = useCallback(
    async (postId) => {
      const { data: regenerated } = await regeneratePost(postId);
      const { data: refreshed } = await getContentPlan();
      setPlan(refreshed);
      const updatedPost = refreshed.posts?.find((p) => p.id === postId);
      if (updatedPost) {
        setSelectedPost(updatedPost);
      }
    },
    []
  );

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  if (status === 'loading-fetch') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-surface-container-high" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-surface-tint animate-spin" />
        </div>
      </div>
    );
  }

  if (status === 'generating') {
    return <LoadingState />;
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-error-container flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-error text-[28px]">
              error
            </span>
          </div>
          <h3 className="font-display font-semibold text-xl text-on-surface mb-2">
            Something went wrong
          </h3>
          <p className="text-on-surface-variant text-sm mb-6">{error}</p>
          <button onClick={fetchPlan} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (status === 'empty') {
    return <EmptyState onGenerate={handleGenerate} isLoading={false} />;
  }

  if (status === 'plan' && plan) {
    return (
      <>
        <PlanView
          plan={plan}
          onPostClick={handlePostClick}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        {selectedPost && (
          <DraftEditorModal
            post={selectedPost}
            onSave={handleSave}
            onApprove={handleApprove}
            onRegenerate={handleRegenerate}
            onClose={handleCloseModal}
          />
        )}
      </>
    );
  }

  return null;
}
