import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getBrandAnalysis, generateBrandAnalysis } from '../services/brandApi';

const BADGE_COLORS = [
  'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  'bg-secondary-fixed text-on-secondary-fixed-variant',
  'bg-primary-fixed text-on-primary-fixed-variant',
];

function formatArchetypeName(name) {
  if (!name) return null;
  const words = name.split(' ');
  if (words.length <= 1) {
    return <span className="text-surface-tint">{name}</span>;
  }
  const lastWord = words.pop();
  return (
    <>
      {words.join(' ')}{' '}
      <span className="text-surface-tint">{lastWord}</span>
    </>
  );
}

function parseToneWeights(toneWeights) {
  if (!toneWeights) return [];
  if (Array.isArray(toneWeights)) return toneWeights;
  return Object.entries(toneWeights).map(([name, weight]) => ({ name, weight }));
}

function EmptyState({ onAnalyze, isLoading }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 rounded-2xl bg-primary-fixed flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-on-primary-fixed-variant text-[36px]">
            psychology
          </span>
        </div>
        <h2 className="font-display font-bold text-3xl text-on-surface mb-3">
          Generate Your Brand Analysis
        </h2>
        <p className="text-on-surface-variant text-base mb-8 leading-relaxed max-w-md mx-auto">
          Let AI analyze your profile and LinkedIn presence to define your personal brand archetype.
        </p>
        <button
          onClick={onAnalyze}
          disabled={isLoading}
          className="btn-primary text-base"
        >
          {isLoading ? 'Starting Analysis...' : 'Analyze My Brand'}
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
          Analyzing your brand identity...
        </h3>
        <p className="text-on-surface-variant text-sm animate-pulse">
          This may take a moment while our AI reviews your profile
        </p>
      </div>
    </div>
  );
}

function PillarCard({ pillar }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 transition-all duration-200 hover:shadow-ambient group">
      <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center mb-4 transition-colors duration-200 group-hover:bg-tertiary-fixed">
        <span className="material-symbols-outlined text-on-primary-fixed-variant text-[24px] group-hover:text-on-tertiary-fixed-variant">
          {pillar.icon || 'category'}
        </span>
      </div>
      <h4 className="font-display font-semibold text-base text-on-surface mb-2">
        {pillar.name}
      </h4>
      <p className="text-on-surface-variant text-sm leading-relaxed">
        {pillar.description}
      </p>
    </div>
  );
}

function ToneBar({ name, weight }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-on-surface">{name}</span>
        <span className="text-sm font-semibold text-surface-tint">{weight}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-surface-container-high overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${weight}%`,
            background: 'linear-gradient(135deg, #001674, #1a2e94)',
          }}
        />
      </div>
    </div>
  );
}

function ResultsView({ analysis, onReanalyze, isLoading }) {
  const toneWeights = parseToneWeights(analysis.tone_weights);
  const pillars = analysis.pillars || [];
  const toneTags = analysis.tone_tags || [];

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div className="flex-1 min-w-0">
          <span className="inline-block px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-[10px] font-bold tracking-[0.15em] uppercase mb-4">
            AI Identity Analysis Complete
          </span>
          <h1 className="font-display font-bold text-5xl text-on-surface mb-4 leading-tight">
            {formatArchetypeName(analysis.archetype_name)}
          </h1>
          <p className="text-on-surface-variant text-base leading-relaxed">
            {analysis.archetype_description}
          </p>
        </div>

        {/* AI Insight card */}
        {analysis.positioning_statement && (
          <div className="lg:w-[380px] flex-shrink-0">
            <div className="glass rounded-2xl p-6 relative overflow-hidden ghost-border">
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
                style={{ background: 'linear-gradient(180deg, #2e0074, #4a2580)' }}
              />
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-tertiary text-[20px]">
                  auto_awesome
                </span>
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  AI Insight
                </span>
              </div>
              <p className="text-on-surface text-sm leading-relaxed italic">
                &ldquo;{analysis.positioning_statement}&rdquo;
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Core Pillars */}
      {pillars.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-2xl text-on-surface mb-1">
            Core Pillars
          </h2>
          <p className="text-on-surface-variant text-sm mb-6">
            The strategic foundations of your content strategy
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pillars.map((pillar, index) => (
              <PillarCard key={index} pillar={pillar} />
            ))}
          </div>
        </section>
      )}

      {/* Tone Intelligence */}
      {toneWeights.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-2xl text-on-surface mb-1">
            Tone Intelligence
          </h2>
          <p className="text-on-surface-variant text-sm mb-6">
            How your brand voice distributes across communication styles
          </p>
          <div className="bg-surface-container-lowest rounded-xl p-6 space-y-5">
            {toneWeights.map((tone) => (
              <ToneBar key={tone.name} name={tone.name} weight={tone.weight} />
            ))}
          </div>
        </section>
      )}

      {/* Tone Tags */}
      {toneTags.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-2xl text-on-surface mb-1">
            Tone Tags
          </h2>
          <p className="text-on-surface-variant text-sm mb-6">
            Keywords that define your brand voice
          </p>
          <div className="flex flex-wrap gap-2.5">
            {toneTags.map((tag, index) => (
              <span
                key={index}
                className={`px-4 py-2 rounded-full text-sm font-medium ${BADGE_COLORS[index % BADGE_COLORS.length]}`}
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* CTA section */}
      <section className="bg-surface-container-lowest rounded-2xl p-8 text-center">
        <h3 className="font-display font-semibold text-xl text-on-surface mb-2">
          Ready to turn insights into action?
        </h3>
        <p className="text-on-surface-variant text-sm mb-6">
          Generate a content plan based on your brand archetype and pillars.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/content-plan" className="btn-primary text-base">
            Generate Content Plan
          </Link>
          <button
            onClick={onReanalyze}
            disabled={isLoading}
            className="btn-outline text-base"
          >
            {isLoading ? 'Analyzing...' : 'Re-analyze'}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function BrandAnalysisPage() {
  const [analysis, setAnalysis] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const fetchAnalysis = useCallback(async () => {
    try {
      setStatus('loading');
      setError(null);
      const { data } = await getBrandAnalysis();
      setAnalysis(data);
      setStatus('results');
    } catch (err) {
      if (err.response?.status === 404) {
        setStatus('empty');
      } else {
        setError(err.response?.data?.detail || 'Failed to load brand analysis.');
        setStatus('error');
      }
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    try {
      setStatus('loading');
      setError(null);
      const { data } = await generateBrandAnalysis();
      setAnalysis(data);
      setStatus('results');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate brand analysis. Please try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  if (status === 'loading') {
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
          <button onClick={fetchAnalysis} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (status === 'empty') {
    return <EmptyState onAnalyze={handleAnalyze} isLoading={false} />;
  }

  if (status === 'results' && analysis) {
    return (
      <ResultsView
        analysis={analysis}
        onReanalyze={handleAnalyze}
        isLoading={false}
      />
    );
  }

  return null;
}
