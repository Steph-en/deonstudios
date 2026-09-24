import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, User, ArrowRight, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { loginSchema, LoginFormData } from '../../../lib/validation';
import { useAuth } from '../hooks/useAuth';

interface LoginFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onCancel }) => {
  const { login } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    const res = await login(data);
    if (res.success) {
      onSuccess();
    } else {
      setAuthError(res.error || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbfa] flex items-center justify-center p-4 sm:p-6 text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      <div className="w-full max-w-[420px] bg-white border border-neutral-200/85 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.04)] p-8 sm:p-10 relative">
        {/* Back Link */}
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-neutral-900 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        {/* Centered Brand & Portal Header */}
        <div className="text-center mb-8">
          <span className="block text-[11px] font-mono uppercase tracking-[0.24em] text-neutral-400 font-medium mb-2.5">
            Gideon Boadu
          </span>
          <h1 className="text-2xl sm:text-[28px] font-sans font-bold uppercase tracking-tight text-neutral-900 leading-none mb-2.5">
            Admin Portal
          </h1>
          <p className="text-xs font-mono text-neutral-500 tracking-wide">
            Login to manage portfolio contents
          </p>
        </div>

        {authError && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Username / Email field */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500 font-semibold mb-2">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoComplete="username"
                {...register('email')}
                placeholder="e.g. appahstephen9"
                className="w-full text-sm pl-10 pr-3.5 py-3 bg-neutral-50/80 border border-neutral-200/90 rounded-xl text-neutral-900 placeholder:text-neutral-400 placeholder:font-mono text-xs focus:outline-hidden focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900/10 transition-all"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-600 mt-1.5 font-mono text-[11px]">{errors.email.message}</p>
            )}
          </div>

          {/* Password field */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500 font-semibold mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                autoComplete="current-password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full text-sm pl-10 pr-3.5 py-3 bg-neutral-50/80 border border-neutral-200/90 rounded-xl text-neutral-900 placeholder:text-neutral-400 placeholder:tracking-widest focus:outline-hidden focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900/10 transition-all"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1.5 font-mono text-[11px]">{errors.password.message}</p>
            )}
          </div>

          {/* Enter Dashboard submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 py-3.5 px-4 rounded-xl bg-neutral-900 text-white font-mono text-xs font-semibold uppercase tracking-[0.18em] hover:bg-neutral-800 active:scale-[0.99] transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Entering...
              </>
            ) : (
              <>
                Enter Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
