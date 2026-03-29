import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSettings, updateSettings } from '../services/settingsApi';
import { useToast } from '../components/ui/Toast';
import ToggleSwitch from '../components/ui/ToggleSwitch';

const FREQUENCY_OPTIONS = [
  { value: '1x_week', label: '1x / week' },
  { value: '2x_week', label: '2x / week' },
  { value: '3x_week', label: '3x / week (Strategic Growth)' },
  { value: '5x_week', label: '5x / week' },
  { value: 'daily', label: 'Daily' },
];

const VOICE_OPTIONS = [
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'visionary', label: 'Visionary' },
  { value: 'approachable', label: 'Approachable' },
  { value: 'authoritative_visionary', label: 'Authoritative & Visionary' },
  { value: 'approachable_authoritative', label: 'Approachable & Authoritative' },
  { value: 'visionary_approachable', label: 'Visionary & Approachable' },
];

const DEFAULT_SETTINGS = {
  full_name: '',
  linkedin_url: '',
  posting_frequency: '3x_week',
  brand_voice: 'authoritative',
  email_analytics: true,
  content_queue_alerts: true,
};

function getInitials(fullName, email) {
  if (fullName && fullName.trim()) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  return 'U';
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-field appearance-none cursor-pointer"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState(DEFAULT_SETTINGS);
  const [originalData, setOriginalData] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordLastUpdated, setPasswordLastUpdated] = useState(null);

  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  }, [formData, originalData]);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await getSettings();
      const loaded = {
        full_name: data.full_name || '',
        linkedin_url: data.linkedin_url || '',
        posting_frequency: data.posting_frequency || '3x_week',
        brand_voice: data.brand_voice || 'authoritative',
        email_analytics: data.email_analytics ?? true,
        content_queue_alerts: data.content_queue_alerts ?? true,
      };
      setFormData(loaded);
      setOriginalData(loaded);
      if (data.password_last_updated) {
        setPasswordLastUpdated(data.password_last_updated);
      }
    } catch {
      showToast('Failed to load settings', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDiscard = () => {
    setFormData(originalData);
    setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    setShowPasswordSection(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const payload = { ...formData };

      if (showPasswordSection && passwords.new_password) {
        if (passwords.new_password !== passwords.confirm_password) {
          showToast('New passwords do not match', 'error');
          return;
        }
        if (passwords.new_password.length < 8) {
          showToast('Password must be at least 8 characters', 'error');
          return;
        }
        payload.current_password = passwords.current_password;
        payload.new_password = passwords.new_password;
      }

      await updateSettings(payload);
      setOriginalData(formData);
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
      setShowPasswordSection(false);
      showToast('Settings saved successfully', 'success');
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to save settings';
      showToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const daysAgo = useMemo(() => {
    if (!passwordLastUpdated) return null;
    const updated = new Date(passwordLastUpdated);
    const now = new Date();
    const diffMs = now - updated;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }, [passwordLastUpdated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-surface-container-high" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-surface-tint animate-spin" />
          </div>
          <p className="text-on-surface-variant text-sm">Loading settings...</p>
        </div>
      </div>
    );
  }

  const initials = getInitials(formData.full_name, user?.email);

  return (
    <div className="max-w-3xl mx-auto pb-28">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="font-display font-bold text-4xl text-on-surface mb-2">
          Executive Configuration
        </h1>
        <p className="text-on-surface-variant text-base leading-relaxed">
          Calibrate your personal brand engine for maximum impact and reach.
        </p>
      </div>

      <div className="space-y-6">
        {/* Section 1: Profile Identity */}
        <section className="bg-surface-container-lowest rounded-2xl p-8 shadow-ambient">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-surface-tint text-[22px]">
              person
            </span>
            <h2 className="font-display font-semibold text-lg text-on-surface">
              Profile Identity
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center">
                <span className="text-2xl font-bold text-on-surface-variant">
                  {initials}
                </span>
              </div>
            </div>

            {/* Fields */}
            <div className="flex-1 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(event) => updateField('full_name', event.target.value)}
                  placeholder="Enter your full name"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  LinkedIn Profile URL
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 rounded-l-lg bg-surface-container-high text-on-surface-variant text-sm ghost-border border-r-0">
                    linkedin.com/in/
                  </span>
                  <input
                    type="text"
                    value={formData.linkedin_url}
                    onChange={(event) => updateField('linkedin_url', event.target.value)}
                    placeholder="your-profile"
                    className="input-field rounded-l-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Content Intelligence */}
        <section className="bg-surface-container-lowest rounded-2xl p-8 shadow-ambient">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-surface-tint text-[22px]">
              auto_awesome
            </span>
            <h2 className="font-display font-semibold text-lg text-on-surface">
              Content Intelligence
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <SelectField
              label="Posting Frequency"
              value={formData.posting_frequency}
              onChange={(value) => updateField('posting_frequency', value)}
              options={FREQUENCY_OPTIONS}
            />
            <SelectField
              label="Brand Voice Tone"
              value={formData.brand_voice}
              onChange={(value) => updateField('brand_voice', value)}
              options={VOICE_OPTIONS}
            />
          </div>

          {/* AI Recommendation Card */}
          <div className="glass rounded-xl p-5 mt-6 relative overflow-hidden ghost-border">
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
              style={{ background: 'linear-gradient(180deg, #2e0074, #4a2580)' }}
            />
            <div className="flex items-center gap-2 mb-2 ml-3">
              <span className="material-symbols-outlined text-tertiary text-[18px]">
                auto_awesome
              </span>
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                AI Recommendation
              </span>
            </div>
            <p className="text-on-surface text-sm leading-relaxed ml-3">
              Based on your brand archetype, posting 3x per week with a mix of thought leadership
              and storytelling yields the highest engagement. Consistency outperforms frequency.
            </p>
          </div>
        </section>

        {/* Section 3: Account & Security */}
        <section className="bg-surface-container-lowest rounded-2xl p-8 shadow-ambient">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-surface-tint text-[22px]">
              shield
            </span>
            <h2 className="font-display font-semibold text-lg text-on-surface">
              Account & Security
            </h2>
          </div>

          {/* Password Management */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-on-surface mb-1">
                  Password Management
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {daysAgo !== null
                    ? `Last updated ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`
                    : 'Set a secure password for your account'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="btn-outline text-sm px-4 py-2"
              >
                {showPasswordSection ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {showPasswordSection && (
              <div className="mt-5 space-y-4 pt-5" style={{ borderTop: '1px solid rgba(196, 198, 207, 0.15)' }}>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwords.current_password}
                    onChange={(event) =>
                      setPasswords((prev) => ({ ...prev, current_password: event.target.value }))
                    }
                    placeholder="Enter current password"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwords.new_password}
                    onChange={(event) =>
                      setPasswords((prev) => ({ ...prev, new_password: event.target.value }))
                    }
                    placeholder="Enter new password"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwords.confirm_password}
                    onChange={(event) =>
                      setPasswords((prev) => ({ ...prev, confirm_password: event.target.value }))
                    }
                    placeholder="Confirm new password"
                    className="input-field"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notification Channels */}
          <div>
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.15em] mb-5">
              Notification Channels
            </h3>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface">Email Analytics Report</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Receive weekly performance summaries in your inbox
                  </p>
                </div>
                <ToggleSwitch
                  checked={formData.email_analytics}
                  onChange={(value) => updateField('email_analytics', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface">Content Queue Alerts</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Get notified when your publishing queue needs attention
                  </p>
                </div>
                <ToggleSwitch
                  checked={formData.content_queue_alerts}
                  onChange={(value) => updateField('content_queue_alerts', value)}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest shadow-ambient z-40">
        <div className="max-w-3xl mx-auto px-8 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={!isDirty && !showPasswordSection}
            className="btn-outline disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Discard Changes
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || (!isDirty && !showPasswordSection)}
            className="btn-primary"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
