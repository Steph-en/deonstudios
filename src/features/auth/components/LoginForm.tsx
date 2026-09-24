import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, ArrowRight, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { loginSchema, LoginFormData } from '../../../lib/validation';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured } from '../../../lib/supabase';
import { DeonLogo } from '../../../components/DeonLogo';

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
    setValue,
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

  const fillDemoCredentials = () => {
    setValue('email', 'admin@deonstudios.com');
    setValue('password', 'admin123');
  };

  return (
    <div className="min-h-screen bg-[#fcfbfa] flex items-center justify-center p-4 sm:p-6 text-neutral-900 font-sans">
      <div className="w-full max-w-sm bg-white border border-neutral-200/80 rounded-2xl shadow-lg p-8 sm:p-10 relative">
        {/* Back link */}
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-neutral-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        {authError && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Email
              </label>
            </div>
            <div className="relative">
              <input
                type="email"
                {...register('email')}
                placeholder="admin@deonstudios.com"
                className="w-full text-sm pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:border-neutral-900 focus:bg-white transition"
              />
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            </div>
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full text-sm pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:border-neutral-900 focus:bg-white transition"
              />
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-neutral-950 text-white font-medium text-xs uppercase tracking-wider hover:bg-neutral-800 active:scale-[0.99] transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
