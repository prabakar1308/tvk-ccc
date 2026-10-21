'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { authApi } from '@/services/api/auth';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface ChangePasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({
  isOpen,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const t = useTranslations('Account');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setErrorMessage(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword.trim() || !newPassword.trim()) {
      setErrorMessage(t('passwordRequired'));
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage(t('passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(t('passwordsDoNotMatch'));
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage(t('samePasswordError'));
      return;
    }

    setIsLoading(true);

    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      toast.add({
        type: 'success',
        title: t('passwordChangedSuccess'),
        description: t('passwordChangedSuccessDesc'),
      });

      handleOpenChange(false);
    } catch (err: any) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to change password. Please check your credentials.';
      setErrorMessage(serverMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isMinLength = newPassword.length >= 6;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-zinc-200/80 dark:border-zinc-800 shadow-2xl rounded-2xl">
        {/* Header with decorative brand styling */}
        <div className="relative bg-gradient-to-r from-[#8F0A1B] via-[#a31224] to-[#8F0A1B] p-6 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-xs shrink-0">
              <Lock className="w-5 h-5 text-[#FFD700] drop-shadow-sm" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight text-white">
                {t('changePassword')}
              </DialogTitle>
              <DialogDescription className="text-xs text-white/80 mt-0.5">
                {t('changePasswordDesc')}
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Current Password Field */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {t('currentPassword')} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('currentPasswordPlaceholder')}
                className="pr-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-900 transition-colors text-sm"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {t('newPassword')} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('newPasswordPlaceholder')}
                className="pr-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-900 transition-colors text-sm"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {newPassword.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] pt-0.5">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    isMinLength ? 'text-emerald-500' : 'text-zinc-300 dark:text-zinc-600'
                  }`}
                />
                <span
                  className={
                    isMinLength
                      ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                      : 'text-zinc-500'
                  }
                >
                  {t('passwordTooShort')}
                </span>
              </div>
            )}
          </div>

          {/* Confirm New Password Field */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {t('confirmPassword')} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPasswordPlaceholder')}
                className="pr-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-900 transition-colors text-sm"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] pt-0.5">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    isMatch ? 'text-emerald-500' : 'text-red-400'
                  }`}
                />
                <span
                  className={
                    isMatch
                      ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                      : 'text-red-500'
                  }
                >
                  {isMatch ? 'Passwords match' : t('passwordsDoNotMatch')}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
              className="rounded-xl text-xs h-10 px-4 cursor-pointer"
            >
              {t('close')}
            </Button>
            <Button
              id="change-password-submit-btn"
              type="submit"
              disabled={isLoading || !isMinLength || !isMatch}
              className="rounded-xl bg-[#8F0A1B] hover:bg-[#730815] text-white text-xs font-semibold h-10 px-5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  {t('updating')}
                </>
              ) : (
                t('updatePassword')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
