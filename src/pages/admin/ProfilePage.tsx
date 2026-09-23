import React, { useState } from 'react';
import {
  User,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Lock,
  Mail,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { AuthService } from '../../features/auth/services/authService';

export const ProfilePage: React.FC = () => {
  const { user, profile } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const email = profile?.email || user?.email || 'admin@deonstudios.com';
  const username = profile?.full_name || email.split('@')[0];

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.updatePassword(newPassword);
      setSuccessMessage('Your password has been successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-neutral-200">
        <h1 className="text-2xl sm:text-3xl font-serif text-neutral-950 font-normal">
          Admin Profile
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Review your administrator account identity and manage authentication credentials.
        </p>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold">Success</p>
            <p className="text-xs text-emerald-800 mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold">Error</p>
            <p className="text-xs text-red-800 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Profile Details Card */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-neutral-100">
          <User className="w-4 h-4 text-neutral-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
            Account Details
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-mono uppercase text-neutral-400">Username</label>
            <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-800">
              <User className="w-3.5 h-3.5 text-neutral-400" />
              <span>{username}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono uppercase text-neutral-400">Email Address</label>
            <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-800 font-mono">
              <Mail className="w-3.5 h-3.5 text-neutral-400" />
              <span>{email}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono uppercase text-neutral-400">Role & Privileges</label>
            <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Studio Administrator (Full Access)</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono uppercase text-neutral-400">Current Password</label>
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-800 font-mono">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-neutral-400" />
                <span>••••••••••••</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-sans">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Password Update Card */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-neutral-100">
          <KeyRound className="w-4 h-4 text-neutral-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
            Change or Update Password
          </h2>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Current Password (Verification)
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              New Password <span className="text-neutral-400 font-normal">(min. 6 characters)</span>
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Enter new strong password"
                className="w-full text-xs px-3 py-2 pr-10 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Re-type new password"
                className="w-full text-xs px-3 py-2 pr-10 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-lg bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 transition shadow-xs disabled:opacity-50"
            >
              {isLoading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
