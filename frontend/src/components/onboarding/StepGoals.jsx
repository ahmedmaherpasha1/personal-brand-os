import { useState } from 'react';

const GOALS = [
  {
    id: 'thought_leadership',
    label: 'Thought Leadership',
    description: 'Establish authority in your industry',
    icon: 'school',
  },
  {
    id: 'network_growth',
    label: 'Network Growth',
    description: 'Expand your professional connections',
    icon: 'group_add',
  },
  {
    id: 'lead_generation',
    label: 'Lead Generation',
    description: 'Attract potential clients and opportunities',
    icon: 'trending_up',
  },
  {
    id: 'career_advancement',
    label: 'Career Advancement',
    description: 'Position yourself for your next role',
    icon: 'work',
  },
  {
    id: 'brand_awareness',
    label: 'Brand Awareness',
    description: 'Increase visibility and recognition',
    icon: 'visibility',
  },
  {
    id: 'community_building',
    label: 'Community Building',
    description: 'Build an engaged professional community',
    icon: 'forum',
  },
];

export default function StepGoals({ data, onUpdate }) {
  const [error, setError] = useState('');
  const selectedGoals = data.goals ?? [];

  const toggleGoal = (goalId) => {
    setError('');
    const isSelected = selectedGoals.includes(goalId);

    if (isSelected) {
      onUpdate({ goals: selectedGoals.filter((id) => id !== goalId) });
      return;
    }

    if (selectedGoals.length >= 3) {
      setError('You can select up to 3 goals.');
      return;
    }

    onUpdate({ goals: [...selectedGoals, goalId] });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-display font-bold text-3xl text-on-surface">
          Define Your Mission
        </h2>
        <p className="text-on-surface-variant text-base mt-2 max-w-lg mx-auto">
          Select 1-3 goals that align with your professional vision. These will
          shape how the AI curates your brand strategy.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-error-container text-error text-sm font-medium text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GOALS.map(({ id, label, description, icon }) => {
          const isSelected = selectedGoals.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleGoal(id)}
              className={`text-left rounded-xl p-6 transition-all duration-200 cursor-pointer ${
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
                className={`material-symbols-outlined text-[28px] mb-3 block ${
                  isSelected ? 'text-white' : 'text-surface-tint'
                }`}
              >
                {icon}
              </span>
              <h3
                className={`font-display font-semibold text-base mb-1 ${
                  isSelected ? 'text-white' : 'text-on-surface'
                }`}
              >
                {label}
              </h3>
              <p
                className={`text-sm leading-relaxed ${
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
  );
}

export function validateGoals(data) {
  const goals = data.goals ?? [];
  if (goals.length === 0) {
    return 'Please select at least 1 goal.';
  }
  if (goals.length > 3) {
    return 'Please select no more than 3 goals.';
  }
  return null;
}
