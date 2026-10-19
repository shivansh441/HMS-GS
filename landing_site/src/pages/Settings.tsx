import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/src/lib/gsap';
import { Settings as SettingsIcon, Bell, Shield, Key, CreditCard, User } from 'lucide-react';

export default function Settings() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo('.settings-reveal', 
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
      }
    );
  }, { scope: containerRef });

  const sections = [
    {
      title: 'Profile',
      icon: User,
      description: 'Manage your personal information and preferences.',
      fields: ['Full Name', 'Email Address', 'Phone Number']
    },
    {
      title: 'Notifications',
      icon: Bell,
      description: 'Control how you receive updates and alerts.',
      fields: ['Email Notifications', 'Push Notifications', 'SMS Alerts']
    },
    {
      title: 'Security',
      icon: Shield,
      description: 'Update your password and secure your account.',
      fields: ['Change Password', 'Two-Factor Authentication', 'Active Sessions']
    },
    {
      title: 'Billing',
      icon: CreditCard,
      description: 'Manage your payment methods and billing history.',
      fields: ['Payment Methods', 'Billing History', 'Subscription Plan']
    }
  ];

  return (
    <div ref={containerRef} className="pt-24 pb-24 bg-transparent transition-colors duration-500 min-h-screen px-6 md:px-12 lg:px-16">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 w-full">
        <div className="mb-16">
          <div className="settings-reveal inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 mb-8">
            <SettingsIcon size={14} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Preferences</span>
          </div>
          <h1 className="settings-reveal text-5xl md:text-7xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-[0.9] mb-6">
            ACCOUNT <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">SETTINGS.</span>
          </h1>
          <p className="settings-reveal text-lg text-zinc-500 dark:text-zinc-400 font-light leading-relaxed max-w-xl">
            Manage your account settings and preferences to customize your experience.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <div key={index} className="settings-reveal glass-card rounded-[32px] p-8 md:p-10">
              <div className="flex items-start gap-6 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <section.icon size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-zinc-900 dark:text-white mb-2">{section.title}</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 font-light">{section.description}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {section.fields.map((field, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 hover:border-primary/30 transition-colors cursor-pointer group">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-primary transition-colors">{field}</span>
                    <button className="text-sm font-bold uppercase tracking-widest text-zinc-400 group-hover:text-primary transition-colors">Edit</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
