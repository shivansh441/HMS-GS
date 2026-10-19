import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { Button } from '../components/atoms/Button';
import { SectionHeading } from '../components/atoms/SectionHeading';
import { applyTheme, getInitialTheme } from '../utils/theme';

type SettingsTab = 'general' | 'operations' | 'notifications' | 'security';

const SETTINGS_STORAGE_KEY = 'propertyflow-settings';

interface StoredSettings {
  emailNotifications: boolean;
  reservationAlerts: boolean;
  weeklySummary: boolean;
  compactTables: boolean;
  language: string;
  timezone: string;
  dateFormat: string;
  checkInTime: string;
  autoLogout: boolean;
  maintenanceMode: boolean;
}

const DEFAULT_SETTINGS: StoredSettings = {
  emailNotifications: true,
  reservationAlerts: true,
  weeklySummary: false,
  compactTables: false,
  language: 'English',
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD/MM/YYYY',
  checkInTime: '12:00',
  autoLogout: true,
  maintenanceMode: false,
};

function loadSettings(): StoredSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;

  try {
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

interface ToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ title, description, checked, onChange }: ToggleRowProps) {
  return (
    <label className="flex min-h-16 cursor-pointer items-center justify-between gap-6 border-b border-slate-100 py-3 last:border-0 dark:border-slate-700/60">
      <span>
        <span className="block text-sm font-bold text-slate-800 dark:text-white">{title}</span>
        <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{description}</span>
      </span>
      <span className="relative shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="block h-7 w-12 rounded-full bg-slate-200 transition-colors peer-checked:bg-indigo-600 peer-focus-visible:ring-4 peer-focus-visible:ring-indigo-500/20 dark:bg-slate-700" />
        <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

interface SettingSummaryProps {
  icon: string;
  eyebrow: string;
  title: string;
  detail: string;
  tone: 'indigo' | 'amber' | 'emerald' | 'orange';
}

function SettingSummary({ icon, eyebrow, title, detail, tone }: SettingSummaryProps) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    orange: 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  };

  return (
    <div className={`mb-4 flex items-center gap-4 rounded-2xl p-4 ${tones[tone]}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70 text-base shadow-sm dark:bg-slate-900/30">
        <i className={`fas ${icon}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">{eyebrow}</p>
        <p className="mt-1 font-bold">{title}</p>
        <p className="mt-1 text-sm opacity-80">{detail}</p>
      </div>
      <i className="fas fa-check-circle ml-auto hidden text-lg opacity-70 sm:block" />
    </div>
  );
}

export default function SettingsPage() {
  const authUser = useAppSelector((state) => state.auth?.user ?? null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isDark, setIsDark] = useState(() => getInitialTheme() === 'dark');
  const [settings, setSettings] = useState<StoredSettings>(loadSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key: keyof StoredSettings, value: boolean) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const handleThemeChange = (dark: boolean) => {
    setIsDark(dark);
    applyTheme(dark);
    setSaved(false);
  };

  const handleSave = () => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
  };

  const displayName = [authUser?.firstName, authUser?.lastName].filter(Boolean).join(' ') || 'PropertyFlow Admin';
  const email = authUser?.email || 'No email address available';

  return (
    <div className="flex h-full max-h-full min-h-0 w-full flex-1 flex-col gap-3 overflow-hidden pb-0">
      <div className="flex flex-col gap-2 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 md:flex-row md:items-center md:justify-between">
        <div>
          <SectionHeading accent="indigo">Workspace Settings</SectionHeading>
          <p className="text-sm text-slate-500 dark:text-slate-400">Shape your PropertyFlow workspace around the way your team works.</p>
        </div>
        <Button variant="primary" icon="fa-check" onClick={handleSave}>{saved ? 'Saved' : 'Save Changes'}</Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <aside className="shrink-0 rounded-[2rem] border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex items-center px-1 py-1">
            <nav className="grid w-full grid-cols-4 items-center gap-1" aria-label="Settings preferences">
              {[
                ['general', 'General', 'fa-sliders-h'],
                ['operations', 'Operations', 'fa-cogs'],
                ['notifications', 'Notifications', 'fa-bell'],
                ['security', 'Security', 'fa-shield-alt'],
              ].map(([tab, label, icon]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab as SettingsTab)}
                  className={`group relative flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-white'}`}
                >
                  <i className={`fas ${icon} text-xs transition-transform group-hover:scale-110`} />
                  {label}
                  {activeTab === tab && <span className="absolute -bottom-3 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-indigo-500" />}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <section className="[&>div>h3]:!mb-4 min-h-0 flex-1 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 md:p-5">
          {activeTab === 'general' && (
            <div>
              <SectionHeading accent="indigo">General Preferences</SectionHeading>
              <SettingSummary icon="fa-sliders-h" eyebrow="Workspace profile" title="Your workspace is ready to personalize" detail="These choices apply to your admin experience across the portal." tone="indigo" />
              <div className="mb-8 flex items-center gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/50">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-lg font-black text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{displayName}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-800 dark:text-white">Appearance</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { value: false, title: 'Light mode', icon: 'fa-sun' },
                    { value: true, title: 'Dark mode', icon: 'fa-moon' },
                  ].map((option) => (
                    <button
                      key={option.title}
                      type="button"
                      onClick={() => handleThemeChange(option.value)}
                      className={`flex min-h-16 items-center gap-3 rounded-xl border p-4 text-left transition-colors ${isDark === option.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300' : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300'}`}
                    >
                      <i className={`fas ${option.icon}`} />
                      <span className="text-sm font-bold">{option.title}</span>
                      {isDark === option.value && <i className="fas fa-check ml-auto text-xs" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-8">
                <ToggleRow title="Compact tables" description="Show more rows in staff, resident, and finance tables." checked={settings.compactTables} onChange={(value) => updateSetting('compactTables', value)} />
              </div>
            </div>
          )}

          {activeTab === 'operations' && (
            <div>
              <SectionHeading accent="orange">Operations Defaults</SectionHeading>
              <SettingSummary icon="fa-cogs" eyebrow="Daily operations" title="Keep your team in sync" detail="Default formats and routines make every property workflow more predictable." tone="orange" />
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Set the defaults your team sees while managing day-to-day property operations.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-white">Language</span>
                  <select value={settings.language} onChange={(event) => { setSettings((current) => ({ ...current, language: event.target.value })); setSaved(false); }} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <option>English</option>
                    <option>Hindi</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-white">Timezone</span>
                  <select value={settings.timezone} onChange={(event) => { setSettings((current) => ({ ...current, timezone: event.target.value })); setSaved(false); }} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <option value="Asia/Kolkata">India Standard Time (IST)</option>
                    <option value="UTC">Coordinated Universal Time (UTC)</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-white">Date format</span>
                  <select value={settings.dateFormat} onChange={(event) => { setSettings((current) => ({ ...current, dateFormat: event.target.value })); setSaved(false); }} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-white">Default check-in time</span>
                  <input type="time" value={settings.checkInTime} onChange={(event) => { setSettings((current) => ({ ...current, checkInTime: event.target.value })); setSaved(false); }} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
                </label>
              </div>
              <div className="mt-6">
                <ToggleRow title="Automatic logout" description="Sign out inactive admin sessions after a period of inactivity." checked={settings.autoLogout} onChange={(value) => updateSetting('autoLogout', value)} />
                <ToggleRow title="Maintenance mode" description="Temporarily pause public booking actions while you make changes." checked={settings.maintenanceMode} onChange={(value) => updateSetting('maintenanceMode', value)} />
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <SectionHeading accent="amber">Notification Preferences</SectionHeading>
              <SettingSummary icon="fa-bell" eyebrow="Delivery status" title="Notifications are under your control" detail="Choose which updates deserve attention and where your team receives them." tone="amber" />
              <div>
                <ToggleRow title="Email notifications" description="Receive important account and workspace updates by email." checked={settings.emailNotifications} onChange={(value) => updateSetting('emailNotifications', value)} />
                <ToggleRow title="Reservation alerts" description="Get notified when a new booking or guest request arrives." checked={settings.reservationAlerts} onChange={(value) => updateSetting('reservationAlerts', value)} />
                <ToggleRow title="Weekly summary" description="Receive a weekly overview of occupancy, revenue, and activity." checked={settings.weeklySummary} onChange={(value) => updateSetting('weeklySummary', value)} />
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <SectionHeading accent="emerald">Security</SectionHeading>
              <SettingSummary icon="fa-shield-alt" eyebrow="Account protection" title="Your workspace security center" detail="Review account protection tools and strengthen administrator access." tone="emerald" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex min-h-44 flex-col rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                  <i className="fas fa-key text-indigo-600" />
                  <h4 className="mt-4 font-bold text-slate-900 dark:text-white">Password</h4>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Keep your account protected with a strong, unique password.</p>
                  <Button variant="secondary" className="mt-5" onClick={() => setSaved(true)}>Change Password</Button>
                </div>
                <div className="flex min-h-44 flex-col rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                  <i className="fas fa-mobile-alt text-emerald-600" />
                  <h4 className="mt-4 font-bold text-slate-900 dark:text-white">Two-factor authentication</h4>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add another layer of protection to your administrator account.</p>
                  <Button variant="secondary" className="mt-5" onClick={() => setSaved(true)}>Configure 2FA</Button>
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <i className="fas fa-info-circle mr-2" /> Security actions will open the account security flow when it is enabled for your workspace.
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}