import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StepGoals, { validateGoals } from '../components/onboarding/StepGoals';
import StepLinkedIn, { validateLinkedIn } from '../components/onboarding/StepLinkedIn';
import StepQuestionnaire, { validateQuestionnaire } from '../components/onboarding/StepQuestionnaire';

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState({
    goals: [],
    linkedin_url: '',
    linkedin_data: null,
    manual_headline: '',
    manual_summary: '',
    manual_posts: [],
    industry: '',
    primary_role: '',
    target_audience: '',
    topics: [],
    brand_voice: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { setOnboardingComplete } = useAuth();

  const updateData = (partial) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return validateGoals(data);
      case 1:
        return validateLinkedIn(data);
      case 2:
        return validateQuestionnaire(data);
      default:
        return null;
    }
  };

  const saveStepData = async () => {
    switch (currentStep) {
      case 0:
        await api.post('/onboarding/goals', { goals: data.goals });
        break;
      case 1:
        // LinkedIn data already saved via StepLinkedIn component API calls
        break;
      case 2:
        await api.post('/onboarding/questionnaire', {
          industry: data.industry,
          primary_role: data.primary_role,
          target_audience: data.target_audience,
          topics: data.topics,
          brand_voice: data.brand_voice,
        });
        break;
      default:
        break;
    }
  };

  const handleNext = async () => {
    setError('');
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      await saveStepData();

      if (currentStep < TOTAL_STEPS - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        await api.post('/onboarding/complete');
        setOnboardingComplete();
        navigate('/brand-analysis', { replace: true });
      }
    } catch (err) {
      const message =
        err.response?.data?.detail ?? 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    setError('');
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepGoals data={data} onUpdate={updateData} />;
      case 1:
        return <StepLinkedIn data={data} onUpdate={updateData} />;
      case 2:
        return <StepQuestionnaire data={data} onUpdate={updateData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-display font-bold text-sm">B</span>
          </div>
          <span className="font-display font-bold text-on-surface">Personal Brand OS</span>
        </div>
        <span className="text-sm font-medium text-on-surface-variant">
          Step {currentStep + 1} of {TOTAL_STEPS}
        </span>
      </header>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 py-4">
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <div
            key={index}
            className={`rounded-full transition-all duration-300 ${
              index === currentStep
                ? 'w-6 h-2'
                : 'w-2 h-2'
            }`}
            style={
              index === currentStep
                ? { background: 'linear-gradient(135deg, #001674, #1a2e94)' }
                : { background: 'rgba(196, 198, 207, 0.4)' }
            }
          />
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-6 py-8">
        <div className="w-full max-w-2xl">
          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-error-container text-error text-sm font-medium text-center">
              {error}
            </div>
          )}
          {renderStep()}
        </div>
      </main>

      {/* Bottom navigation */}
      <footer className="px-8 py-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="btn-outline flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={submitting}
            className="btn-primary flex items-center gap-2"
          >
            {submitting ? (
              <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : currentStep === TOTAL_STEPS - 1 ? (
              <>
                Complete Setup
                <span className="material-symbols-outlined text-[18px]">check</span>
              </>
            ) : (
              <>
                Continue
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </div>

        {/* Help link */}
        <div className="text-center mt-6">
          <p className="text-xs text-on-surface-variant/60">
            Need help configuring your profile?{' '}
            <a
              href="#"
              className="font-medium text-surface-tint hover:text-primary transition-colors"
            >
              Visit the Curator Guide
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
