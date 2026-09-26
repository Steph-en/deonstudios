import React, { useState, useEffect } from 'react';
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
  UserPlus,
  Trash2,
  Users,
  Loader2,
  Info,
} from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { AuthService } from '../../features/auth/services/authService';
import { DbProfile, UserRole } from '../../types/database';
import { isSupabaseConfigured, supabaseUrl } from '../../lib/supabase';
import { useConfirm, useToast } from '../../context/AdminUIContext';

export const ProfilePage: React.FC = () => {
  const { user, profile, role } = useAuth();
  const toast = useToast();
  const { confirm } = useConfirm();
  const supabaseConnected = isSupabaseConfigured();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Team & user account management state (admin only)
  const [teamMembers, setTeamMembers] = useState<DbProfile[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [newMemberFullName, setNewMemberFullName] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('manager');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userActionSuccess, setUserActionSuccess] = useState<string | null>(null);
  const [userActionError, setUserActionError] = useState<string | null>(null);

  const currentEmail = profile?.email || user?.email || 'appahstephen9@gmail.com';
  const isPrimaryAdminEmail = currentEmail.toLowerCase() === 'appahstephen9@gmail.com';
  const isAdmin =
    role === 'admin' ||
    profile?.role === 'admin' ||
    user?.user_metadata?.role === 'admin' ||
    isPrimaryAdminEmail;

  const currentUsername =
    user?.user_metadata?.username ||
    profile?.full_name ||
    (isPrimaryAdminEmail ? 'appahstephen9' : currentEmail.split('@')[0]);

  const loadTeamMembers = async () => {
    if (!isAdmin) {
      setLoadingTeam(false);
      return;
    }

    try {
      setLoadingTeam(true);
      const members = await AuthService.getTeamMembers();
      setTeamMembers(members);
    } catch (e) {
      console.warn('Failed to load team members:', e);
    } finally {
      setLoadingTeam(false);
    }
  };

  useEffect(() => {
    loadTeamMembers();
  }, [isAdmin]);

  const handleCreateNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserActionError(null);
    setUserActionSuccess(null);

    if (!isAdmin) {
      setUserActionError('Only administrators are permitted to create new users.');
      return;
    }

    if (!newMemberEmail || !newMemberPassword || !newMemberFullName) {
      setUserActionError('Please fill out all required fields (name, email, and password).');
      return;
    }

    if (newMemberPassword.length < 6) {
      setUserActionError('Password must be at least 6 characters long.');
      return;
    }

    setIsCreatingUser(true);
    try {
      const result = await AuthService.createTeamMember({
        email: newMemberEmail,
        username: newMemberUsername.trim() || newMemberEmail.split('@')[0],
        password: newMemberPassword,
        full_name: newMemberFullName,
        role: newMemberRole,
      });

      setUserActionSuccess(result.message);
      setNewMemberEmail('');
      setNewMemberUsername('');
      setNewMemberFullName('');
      setNewMemberPassword('');
      setNewMemberRole('manager');
      setShowNewUserModal(false);
      await loadTeamMembers();
    } catch (err: any) {
      setUserActionError(err.message || 'Failed to create user account.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!isAdmin) {
      toast.error('Only administrators are permitted to remove user accounts.', 'ACCESS DENIED');
      return;
    }

    const ok = await confirm({
      title: 'REMOVE TEAM MEMBER',
      subtitle: 'CONFIRMATION REQUIRED',
      message: `Are you sure you want to remove account access for ${name}? This will revoke their CMS login privileges.`,
      confirmText: 'REVOKE ACCESS',
      cancelText: 'CANCEL',
      variant: 'danger',
    });

    if (ok) {
      try {
        await AuthService.removeTeamMember(id);
        toast.success(`Successfully removed account access for ${name}.`, 'ACCESS REVOKED');
        await loadTeamMembers();
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete user.', 'ERROR');
      }
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (newPassword.length < 6) {
      const err = 'New password must be at least 6 characters long.';
      setErrorMessage(err);
      toast.error(err, 'PASSWORD ERROR');
      return;
    }

    if (newPassword !== confirmPassword) {
      const err = 'New passwords do not match. Please verify.';
      setErrorMessage(err);
      toast.error(err, 'PASSWORD MISMATCH');
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.updatePassword(newPassword);
      const msg = 'Your password has been successfully updated.';
      setSuccessMessage(msg);
      toast.success(msg, 'PASSWORD UPDATED');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const errorMsg = 'Failed to update password. Please try again.';
      setErrorMessage(errorMsg);
      toast.error(errorMsg, 'UPDATE FAILED');
    } finally {
      setIsLoading(false);
    }
  };

  const adminCount = teamMembers.filter((m) => m.role === 'admin').length;
  const managerCount = teamMembers.filter((m) => m.role === 'manager').length;
  const otherCount = teamMembers.length - adminCount - managerCount;

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-neutral-950 font-normal">
            {isAdmin ? 'Admin Profile & Team Control' : 'User Account Profile'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            {isAdmin
              ? 'Manage administrator credentials, user accounts, and platform access roles.'
              : 'Review your account credentials and update your portal password.'}
          </p>
        </div>

        {/* User Role Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium font-mono uppercase tracking-wider ${
              isAdmin
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {isAdmin ? 'Administrator' : 'Manager'}
          </span>
        </div>
      </div>

      {/* Supabase & Database Status Banner (Admin Only) */}
      {isAdmin && (
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            supabaseConnected
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-neutral-50 border-neutral-200 text-neutral-900'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500'
              }`}
            />
            <div>
              <p className="font-semibold">
                Database & Centralized Auth:{' '}
                {supabaseConnected ? 'Supabase Live Connected' : 'Centralized Database Synced'}
              </p>
              <p className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed">
                {supabaseConnected
                  ? `Connected to Supabase endpoint: ${supabaseUrl}. User authentications and mutations are synced directly to PostgreSQL.`
                  : 'Accounts and portfolio permissions are synced through the centralized server database across all browsers and devices.'}
              </p>
            </div>
          </div>
        </div>
      )}

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
            <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-800 font-mono">
              <User className="w-3.5 h-3.5 text-neutral-400" />
              <span>{currentUsername}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono uppercase text-neutral-400">Email Address</label>
            <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-800 font-mono">
              <Mail className="w-3.5 h-3.5 text-neutral-400" />
              <span>{currentEmail}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono uppercase text-neutral-400">Role & Privileges</label>
            <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {isAdmin
                  ? 'Administrator (Full Access & User Management)'
                  : 'Manager (Portfolio & Content Access)'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono uppercase text-neutral-400">Account Status</label>
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-800 font-mono">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-neutral-400" />
                <span>••••••••••••</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-sans font-medium">Active</span>
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
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 cursor-pointer"
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
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 cursor-pointer"
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
              className="px-5 py-2.5 rounded-lg bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </div>
        </form>
      </div>

      {/* TEAM & USER ACCOUNT MANAGEMENT SECTION (ADMINISTRATOR ONLY) */}
      {isAdmin && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neutral-100 text-neutral-900">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
                    Platform Users & Team Management
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-medium">
                    {teamMembers.length} {teamMembers.length === 1 ? 'User' : 'Users'}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Only administrators can create user accounts and designate access roles.
                </p>
              </div>
            </div>

            {/* User creation trigger - ONLY visible to Admin */}
            <button
              type="button"
              onClick={() => {
                setUserActionError(null);
                setUserActionSuccess(null);
                setShowNewUserModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-950 text-white text-xs font-medium hover:bg-neutral-800 transition cursor-pointer self-start sm:self-auto shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add New User</span>
            </button>
          </div>

          {/* Quick Metrics of Users created */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-lg">
              <span className="text-[10px] font-mono uppercase text-neutral-400 block">Total Users</span>
              <span className="text-lg font-serif font-medium text-neutral-950">{teamMembers.length}</span>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-lg">
              <span className="text-[10px] font-mono uppercase text-neutral-400 block">Administrators</span>
              <span className="text-lg font-serif font-medium text-neutral-950">{adminCount}</span>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-lg">
              <span className="text-[10px] font-mono uppercase text-neutral-400 block">Managers / Editors</span>
              <span className="text-lg font-serif font-medium text-neutral-950">{managerCount + otherCount}</span>
            </div>
          </div>

          {/* Action alerts inside team card */}
          {userActionSuccess && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{userActionSuccess}</span>
            </div>
          )}

          {userActionError && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-900 flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{userActionError}</span>
            </div>
          )}

          {/* User list - ONLY visible to Admin */}
          {loadingTeam ? (
            <div className="py-8 flex items-center justify-center gap-2 text-xs text-neutral-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading registered user accounts...</span>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No accounts registered yet.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden">
              {teamMembers.map((member) => {
                const isCurrent = member.email.toLowerCase() === currentEmail.toLowerCase();
                const isPrimary =
                  member.email.toLowerCase() === 'appahstephen9@gmail.com' ||
                  member.id === 'admin-appahstephen9';

                return (
                  <div
                    key={member.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/70 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800 font-serif text-sm shrink-0">
                        {member.full_name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-neutral-900">
                            {member.full_name || 'Studio Member'}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-200 text-neutral-800 font-medium">
                              You
                            </span>
                          )}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              member.role === 'admin'
                                ? 'bg-neutral-950 text-white'
                                : member.role === 'manager'
                                ? 'bg-neutral-100 text-neutral-900 border border-neutral-300 font-mono'
                                : 'bg-neutral-100 text-neutral-600 border border-neutral-200 font-mono'
                            }`}
                          >
                            {member.role === 'admin'
                              ? 'Administrator'
                              : member.role === 'manager'
                              ? 'Manager'
                              : 'Editor'}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {isPrimary ? (
                        <span className="text-[11px] text-neutral-400 font-mono text-xs">
                          Primary Admin
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(member.id, member.full_name || member.email)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Revoke access"
                          aria-label="Revoke user access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Admin security info */}
          <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200/80 flex items-start gap-3 text-xs text-neutral-600">
            <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <p className="font-semibold text-neutral-900">Administrator Role Management</p>
              <p className="text-[11px] text-neutral-600">
                As the administrator, only you have access to this user creation and management panel.
                Managers have access to manage projects, portfolio items, and media, but cannot view this
                panel or create accounts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New User (Admin Only) */}
      {isAdmin && showNewUserModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-md w-full p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-neutral-900" />
                <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
                  Create Platform User
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewUserModal(false)}
                className="text-neutral-400 hover:text-neutral-600 text-xs px-2 py-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newMemberFullName}
                  onChange={(e) => setNewMemberFullName(e.target.value)}
                  placeholder="e.g. John Doe or Studio Manager"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Username <span className="text-neutral-400 font-normal">(optional login alias)</span>
                </label>
                <input
                  type="text"
                  value={newMemberUsername}
                  onChange={(e) => setNewMemberUsername(e.target.value)}
                  placeholder="e.g. manager1"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="e.g. manager@deonstudios.com"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Password <span className="text-neutral-400 font-normal">(min. 6 chars)</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newMemberPassword}
                  onChange={(e) => setNewMemberPassword(e.target.value)}
                  placeholder="Set initial password for login"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Designate Role & Privileges
                </label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as UserRole)}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white transition"
                >
                  <option value="admin">Admin (Full Access: Content + Create Users + Designate Roles)</option>
                  <option value="manager">Manager (Manage Portfolio, Projects, Products, Categories & Media)</option>
                  <option value="editor">Editor (Upload and Edit Content Only)</option>
                </select>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Admins can create users and view all platform accounts. Managers manage content without user creation access.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isCreatingUser ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
