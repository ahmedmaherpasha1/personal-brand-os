import { useState } from 'react';

const INDUSTRIES = [
  'Tech & Software',
  'Finance & Banking',
  'Healthcare',
  'Marketing & Advertising',
  'Education',
  'Consulting',
  'Legal',
  'Real Estate',
  'Other',
];

const ROLES = [
  'Executive Leadership',
  'Founder/Entrepreneur',
  'Product Management',
  'Engineering',
  'Marketing',
  'Sales',
  'Human Resources',
  'Other',
];

const SUGGESTED_TOPICS = [
  'AI Strategy',
  'Leadership',
  'Innovation',
  'Technology',
  'Entrepreneurship',
  'Digital Transformation',
  'Data Science',
  'Product Development',
];

const VOICE_OPTIONS = [
  {
    id: 'authoritative',
    label: 'Authoritative',
    description: 'Direct & expert',
    icon: 'gavel',
    hint: 'Selecting "Authoritative" will prioritize industry reports and data-driven insights in your content curation.',
  },
  {
    id: 'visionary',
    label: 'Visionary',
    description: 'Inspiring & bold',
    icon: 'lightbulb',
    hint: 'Selecting "Visionary" will surface emerging trends, future predictions, and thought-provoking perspectives.',
  },
  {
    id: 'approachable',
    label: 'Approachable',
    description: 'Friendly & relatable',
    icon: 'emoji_people',
    hint: 'Selecting "Approachable" will focus on storytelling, practical tips, and community-oriented content.',
  },
];

export default function StepQuestionnaire({ data, onUpdate }) {
  const [topicInput, setTopicInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const industry = data.industry ?? '';
  const primaryRole = data.primary_role ?? '';
  const targetAudience = data.target_audience ?? '';
  const topics = data.topics ?? [];
  const brandVoice = data.brand_voice ?? '';

  const filteredSuggestions = SUGGESTED_TOPICS.filter(
    (topic) =>
      !topics.includes(topic) &&
      topic.toLowerCase().includes(topicInput.toLowerCase())
  );

  const addTopic = (topic) => {
    const trimmed = topic.trim();
    if (trimmed && !topics.includes(trimmed)) {
      onUpdate({ topics: [...topics, trimmed] });
    }
    setTopicInput('');
    setShowSuggestions(false);
  };

  const removeTopic = (topic) => {
    onUpdate({ topics: topics.filter((t) => t !== topic) });
  };

  const handleTopicKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (topicInput.trim()) {
        addTopic(topicInput);
      }
    }
  };

  const selectedVoice = VOICE_OPTIONS.find((v) => v.id === brandVoice);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-display font-bold text-3xl text-on-surface">
          Refine Your Voice
        </h2>
        <p className="text-on-surface-variant text-base mt-2 max-w-lg mx-auto">
          Tell us about your professional background so the AI can curate
          content that resonates with your audience.
        </p>
      </div>

      {/* Industry and Role dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-on-surface" htmlFor="industry">
            Industry
          </label>
          <select
            id="industry"
            value={industry}
            onChange={(event) => onUpdate({ industry: event.target.value })}
            className="input-field appearance-none cursor-pointer"
          >
            <option value="">Select your industry</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-on-surface" htmlFor="primary-role">
            Primary Role
          </label>
          <select
            id="primary-role"
            value={primaryRole}
            onChange={(event) => onUpdate({ primary_role: event.target.value })}
            className="input-field appearance-none cursor-pointer"
          >
            <option value="">Select your role</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Target Audience */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-on-surface" htmlFor="target-audience">
          Target Audience
        </label>
        <input
          id="target-audience"
          type="text"
          value={targetAudience}
          onChange={(event) => onUpdate({ target_audience: event.target.value })}
          className="input-field"
          placeholder="e.g. Tech founders, engineering managers, startup investors"
        />
      </div>

      {/* Topics */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-on-surface">Topics</label>
        <div className="relative">
          <input
            type="text"
            value={topicInput}
            onChange={(event) => {
              setTopicInput(event.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delay to allow click on suggestion
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            onKeyDown={handleTopicKeyDown}
            className="input-field"
            placeholder="Type to add topics (press Enter)"
          />
          {showSuggestions && filteredSuggestions.length > 0 && topicInput.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-surface-container-lowest rounded-lg shadow-ambient max-h-48 overflow-y-auto">
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => addTopic(suggestion)}
                  className="w-full text-left px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Suggested topics chips */}
        {topics.length === 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {SUGGESTED_TOPICS.slice(0, 5).map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => addTopic(topic)}
                className="px-3 py-1 rounded-full text-xs font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
              >
                + {topic}
              </button>
            ))}
          </div>
        )}

        {/* Selected topics */}
        {topics.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {topics.map((topic) => (
              <span
                key={topic}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-on-primary"
                style={{ background: 'linear-gradient(135deg, #001674, #1a2e94)' }}
              >
                {topic}
                <button
                  type="button"
                  onClick={() => removeTopic(topic)}
                  className="hover:text-white/70 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Brand Voice */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-on-surface">
          Brand Voice & Tone
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {VOICE_OPTIONS.map(({ id, label, description, icon }) => {
            const isSelected = brandVoice === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onUpdate({ brand_voice: id })}
                className={`text-left rounded-xl p-5 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'text-on-primary shadow-ambient'
                    : 'bg-surface-container-lowest hover:shadow-ambient'
                }`}
                style={
                  isSelected
                    ? { background: 'linear-gradient(135deg, #001674, #1a2e94)' }
                    : undefined
                }
              >
                <span
                  className={`material-symbols-outlined text-[24px] mb-2 block ${
                    isSelected ? 'text-white' : 'text-surface-tint'
                  }`}
                >
                  {icon}
                </span>
                <h3
                  className={`font-display font-semibold text-sm mb-0.5 ${
                    isSelected ? 'text-white' : 'text-on-surface'
                  }`}
                >
                  {label}
                </h3>
                <p
                  className={`text-xs ${
                    isSelected ? 'text-white/80' : 'text-on-surface-variant'
                  }`}
                >
                  {description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Curation Intelligence Card */}
      {selectedVoice && (
        <div className="glass ghost-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-surface-tint text-[18px]">
              auto_awesome
            </span>
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              Curation Intelligence Active
            </span>
          </div>
          <p className="text-sm text-on-surface leading-relaxed">
            {selectedVoice.hint}
          </p>
        </div>
      )}
    </div>
  );
}

export function validateQuestionnaire(data) {
  if (!data.industry) {
    return 'Please select your industry.';
  }
  if (!data.primary_role) {
    return 'Please select your primary role.';
  }
  if (!data.target_audience?.trim()) {
    return 'Please enter your target audience.';
  }
  if (!data.topics || data.topics.length === 0) {
    return 'Please add at least one topic.';
  }
  if (!data.brand_voice) {
    return 'Please select your brand voice.';
  }
  return null;
}
