import React, { useState } from 'react';
import { TeamMember } from '../types';
import { Users, ChevronRight, Briefcase, Lock, Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';

const MANAGER_PIN = '120806';

interface RoleSelectionProps {
  members: TeamMember[];
  onSelectRole: (role: 'manager' | 'employee', memberId?: string) => void;
}

export const RoleSelection: React.FC<RoleSelectionProps> = ({ members, onSelectRole }) => {
  const [step, setStep] = useState<'choose' | 'pin' | 'employee'>('choose');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleManagerClick = () => setStep('pin');

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === MANAGER_PIN) {
      setPinError(false);
      onSelectRole('manager');
    } else {
      setPinError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="bg-shopee-orange p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Sales Tracker</h1>
          <p className="text-orange-100 text-sm">Please select your role to continue</p>
        </div>

        <div className="p-6">
          {step === 'choose' && (
            <div className="space-y-4">
              <button
                onClick={handleManagerClick}
                className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 hover:border-shopee-orange dark:hover:border-shopee-orange hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/40 text-shopee-orange flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Briefcase size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">I'm the Manager</h3>
                    <p className="text-slate-500 text-sm">Full dashboard access</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400 group-hover:text-shopee-orange transition-colors">
                  <Lock size={16} />
                  <ChevronRight size={20} />
                </div>
              </button>

              <button
                onClick={() => setStep('employee')}
                className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">I'm a Team Member</h3>
                    <p className="text-slate-500 text-sm">Access your KPI board</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </button>
            </div>
          )}

          {step === 'pin' && (
            <div className="space-y-5">
              <button onClick={() => { setStep('choose'); setPin(''); setPinError(false); }} className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 flex items-center gap-1">
                ← Back
              </button>
              <div className="text-center mb-2">
                <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock size={28} className="text-shopee-orange" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">Manager Access</h3>
                <p className="text-slate-500 text-sm mt-1">Enter your PIN to continue</p>
              </div>
              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={e => { setPin(e.target.value); setPinError(false); }}
                    className={clsx(
                      "w-full px-4 py-3 border-2 rounded-xl text-center text-2xl tracking-[0.5em] font-bold dark:bg-slate-800 dark:text-white transition-colors",
                      pinError
                        ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                        : "border-slate-200 dark:border-slate-700 focus:border-shopee-orange outline-none"
                    )}
                    placeholder="••••••"
                    maxLength={10}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {pinError && (
                  <p className="text-red-500 text-sm text-center font-medium">Incorrect PIN. Please try again.</p>
                )}
                <button
                  type="submit"
                  disabled={!pin}
                  className="w-full bg-shopee-orange text-white py-3 rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Unlock Dashboard
                </button>
              </form>
            </div>
          )}

          {step === 'employee' && (
            <div className="space-y-4">
              <button onClick={() => setStep('choose')} className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 flex items-center gap-1">
                ← Back
              </button>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-3">Who are you?</h3>
                <div className="grid gap-3 max-h-72 overflow-y-auto">
                  {members.map(member => (
                    <button
                      key={member.id}
                      onClick={() => onSelectRole('employee', member.id)}
                      className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{member.name}</span>
                      <ChevronRight size={16} className="ml-auto text-slate-300" />
                    </button>
                  ))}

                  {members.length === 0 && (
                    <p className="text-slate-500 text-sm italic text-center py-4">No team members found. Ask the manager to add you first.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
