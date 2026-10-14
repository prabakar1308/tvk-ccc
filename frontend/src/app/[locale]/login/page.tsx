'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Globe,
  Loader2,
  Users,
  Vote,
  PhoneCall,
  CheckCircle2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  userId: z.string().min(3, 'User ID must be at least 3 characters'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isLangPending, startTransition] = useTransition();

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const loginConsoleRef = useRef<HTMLDivElement>(null);

  // For mobile / tablet: Automatically scroll down to the login console after 2 seconds
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth >= 1024) return;

    const timer = setTimeout(() => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (loginConsoleRef.current) {
        loginConsoleRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      } else {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: '',
      password: '',
    },
  });

  function handleLanguageChange(newLocale: string) {
    if (newLocale === locale) return;
    startTransition(() => {
      const pathWithoutLocale = pathname.replace(`/${locale}`, '');
      const newPath = `/${newLocale}${pathWithoutLocale === '' ? '' : pathWithoutLocale}`;
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      router.replace(newPath);
    });
  }

  function handleFillDemo() {
    setValue('userId', 'admin', { shouldValidate: true });
    setValue('password', 'admin', { shouldValidate: true });
    setAuthError(null);
  }

  async function onSubmit(values: FormValues) {
    try {
      setAuthError(null);
      setIsLoading(true);
      const res = await fetch(`/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        const data = await res.json();
        await fetch('/api/auth/set-cookie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: data.access_token }),
        });
        window.location.href = `/${locale}`;
      } else {
        if (res.status === 401) {
          setAuthError(t('invalidCredentials'));
        } else {
          const errorData = await res.json().catch(() => null);
          setAuthError(errorData?.message || t('unexpectedError'));
        }
      }
    } catch (error) {
      console.error(error);
      setAuthError(t('unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white text-slate-900 selection:bg-[#FFC72C] selection:text-black relative overflow-x-hidden">
      {/* ============================================================== */}
      {/* LEFT COLUMN: HERO SHOWCASE (RICH #8F0A1B MAROON THEME)        */}
      {/* ============================================================== */}
      <div className="relative flex-1 flex flex-col justify-between p-5 sm:p-8 lg:p-12 xl:p-14 overflow-hidden bg-gradient-to-br from-[#8F0A1B] via-[#7c0716] to-[#59030c] text-white border-b lg:border-b-0 lg:border-r border-[#8F0A1B]/40 z-10 shadow-2xl">
        {/* Ambient Glows & Dot Texture on Maroon */}
        <div className="absolute top-[-15%] left-[-10%] w-[38rem] h-[38rem] bg-white/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[36rem] h-[36rem] bg-[#FFC72C]/15 rounded-full blur-[120px] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Top Header & Party Brand Ribbon */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* TVK Flag Ribbon (Maroon - Yellow - Maroon) with White Outline */}
            <div className="flex flex-col w-2.5 h-10 rounded-full overflow-hidden shadow-md ring-1 ring-white/40">
              <span className="flex-1 bg-[#8F0A1B]" />
              <span className="flex-1 bg-[#FFC72C]" />
              <span className="flex-1 bg-[#8F0A1B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-wide text-white drop-shadow-sm">
                  {t('partyName')}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/15 text-[#FFC72C] border border-white/20 shadow-xs backdrop-blur-xs">
                  <Sparkles className="w-3 h-3 text-[#FFC72C]" /> தவெக
                </span>
              </div>
              <p className="text-xs text-amber-100/90 font-medium tracking-tight mt-0.5">
                {t('partyTagline')} • {t('partyMotto')}
              </p>
            </div>
          </div>

          {/* Whistle Symbol Highlight Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-white/20 backdrop-blur-md shadow-xs">
            <span className="text-xs font-medium text-amber-100/80">
              {t('ourSymbol')}:
            </span>
            <span className="text-xs font-bold text-[#FFC72C] flex items-center gap-1.5">
              <span>🔔</span> {t('whistleSymbol')}
            </span>
          </div>
        </div>

        {/* Center Poster Showcase Frame */}
        <div className="relative z-10 my-6 lg:my-auto flex flex-col items-center justify-center w-full">
          <div className="group relative w-full max-w-[320px] sm:max-w-[520px] md:max-w-[580px] lg:max-w-[660px] xl:max-w-[740px] 2xl:max-w-[820px] transition-all duration-500">
            {/* Glowing Backdrop Border */}
            <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-[#FFC72C]/40 via-white/30 to-[#FFC72C]/40 blur-lg opacity-80 group-hover:opacity-100 transition duration-700" />

            {/* Poster Card Container */}
            <div className="relative overflow-hidden rounded-2xl bg-black/70 border border-white/25 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md">
              {/* Mobile View Image (< 640px) */}
              <div className="relative aspect-[941/1672] w-full overflow-hidden bg-zinc-950 block sm:hidden">
                <Image
                  src="/login_image_mobile.png"
                  alt="TVK Connect - Tamilaga Vettri Kazhagam Leadership and Whistle Symbol"
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, 320px"
                  className="object-cover object-top transition duration-700 ease-out group-hover:scale-[1.015]"
                />
              </div>

              {/* Tablet View Image (640px - 1023px) */}
              <div className="relative aspect-[1448/1086] w-full overflow-hidden bg-zinc-950 hidden sm:block lg:hidden">
                <Image
                  src="/login_image_tablet.png"
                  alt="TVK Connect - Tamilaga Vettri Kazhagam Leadership and Whistle Symbol"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 580px"
                  className="object-cover object-top transition duration-700 ease-out group-hover:scale-[1.015]"
                />
              </div>

              {/* Desktop View Image (>= 1024px) */}
              <div className="relative aspect-[1672/941] w-full overflow-hidden bg-zinc-950 hidden lg:block">
                <Image
                  src="/login_image_desktop.png"
                  alt="TVK Connect - Tamilaga Vettri Kazhagam Leadership and Whistle Symbol"
                  fill
                  priority
                  sizes="(min-width: 1024px) 60vw, 820px"
                  className="object-cover object-top transition duration-700 ease-out group-hover:scale-[1.015]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Feature Badges & Equality Motto */}
        <div className="relative z-10 space-y-3 pt-2">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-sm transition-colors shadow-xs">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Users className="w-3.5 h-3.5 text-[#FFC72C]" />
                <p className="text-xs font-bold text-white">{t('featureGrassroots')}</p>
              </div>
              <p className="text-[10px] text-amber-100/80 font-medium">{t('featureGrassrootsDesc')}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-sm transition-colors shadow-xs">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Vote className="w-3.5 h-3.5 text-[#FFC72C]" />
                <p className="text-xs font-bold text-[#FFC72C]">{t('featureAnalytics')}</p>
              </div>
              <p className="text-[10px] text-amber-100/80 font-medium">{t('featureAnalyticsDesc')}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-sm transition-colors shadow-xs">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FFC72C]" />
                <p className="text-xs font-bold text-white">{t('featureSecurity')}</p>
              </div>
              <p className="text-[10px] text-amber-100/80 font-medium">{t('featureSecurityDesc')}</p>
            </div>
          </div>

          {/* Golden Motto Strip */}
          <div className="text-center pt-1">
            <p className="text-xs font-bold tracking-wider text-amber-200 flex items-center justify-center gap-2">
              <span className="w-8 h-[1px] bg-gradient-to-r from-transparent via-[#FFC72C] to-transparent" />
              <span>{t('equalityMottoTamil')}</span>
              <span className="text-[#FFC72C]/70">•</span>
              <span className="text-white/90 font-medium">{t('equalityMotto')}</span>
              <span className="w-8 h-[1px] bg-gradient-to-r from-transparent via-[#FFC72C] to-transparent" />
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* RIGHT COLUMN: AUTHENTICATION CONSOLE (CLEAN WHITE THEME)       */}
      {/* ============================================================== */}
      <div
        ref={loginConsoleRef}
        id="login-console"
        className="w-full lg:w-[480px] xl:w-[520px] 2xl:w-[560px] flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-white text-slate-900 relative z-20 shadow-2xl border-l border-slate-100"
      >
        {/* Top Console Bar: App Logo & Language Switcher */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {/* Circular TVK Connect Logo Badge */}
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden shadow-md ring-2 ring-[#8F0A1B]/20 bg-white flex items-center justify-center shrink-0">
              <Image
                src="/TVK Connect1.png"
                alt="TVK Connect Logo"
                fill
                sizes="56px"
                className="object-cover"
                priority
              />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-[#8F0A1B]">
                {t('appName')}
              </h2>
              <div className="mt-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#8F0A1B]/10 text-[#8F0A1B] border border-[#8F0A1B]/20 shadow-xs">
                  <CheckCircle2 className="w-3 h-3 text-[#8F0A1B]" />
                  {t('appPurpose')}
                </span>
              </div>
            </div>
          </div>

          {/* Bilingual Language Switcher Pill */}
          <div className="flex items-center p-1 rounded-full bg-slate-100 border border-slate-200">
            <Globe className="w-3.5 h-3.5 ml-2 mr-1 text-slate-500" />
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              disabled={isLangPending}
              className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                locale === 'en'
                  ? 'bg-[#8F0A1B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('ta')}
              disabled={isLangPending}
              className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                locale === 'ta'
                  ? 'bg-[#8F0A1B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        {/* Central Form Card Area */}
        <div className="my-auto py-8 space-y-6">
          {/* Header & Tagline */}
          <div className="space-y-2">
            {/* TVK Flag Micro Accent Stripe */}
            <div className="flex w-24 h-1.5 rounded-full overflow-hidden shadow-xs mb-3">
              <span className="flex-1 bg-[#8F0A1B]" />
              <span className="w-10 bg-[#FFC72C]" />
              <span className="flex-1 bg-[#8F0A1B]" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {t('welcome')}
            </h1>
            <p className="text-sm text-slate-600 font-medium">
              {t('description')}
            </p>
          </div>

          {/* Error Message Box */}
          {authError && (
            <div className="bg-red-50 text-red-700 text-sm p-3.5 rounded-xl border border-red-200 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 shadow-xs">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{authError}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* User ID Field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="userId"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-[#8F0A1B]" />
                {t('userIdLabel')}
              </Label>
              <div className="relative">
                <Input
                  id="userId"
                  autoComplete="username"
                  className="h-12 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#8F0A1B] focus-visible:border-[#8F0A1B] transition-all font-medium"
                  placeholder={t('userIdPlaceholder')}
                  {...register('userId')}
                />
              </div>
              {errors.userId && (
                <p className="text-xs text-red-600 font-medium pt-0.5">
                  {errors.userId.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-[#8F0A1B]" />
                  {t('passwordLabel')}
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="h-12 pl-3.5 pr-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#8F0A1B] focus-visible:border-[#8F0A1B] transition-all font-medium"
                  placeholder={t('passwordPlaceholder')}
                  {...register('password')}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-[#8F0A1B]" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 font-medium pt-0.5">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me & Quick Demo Tool */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#8F0A1B] focus:ring-[#8F0A1B] cursor-pointer"
                />
                <span>{t('rememberMe')}</span>
              </label>

              {/* Convenient Quick Fill Button for testing/admin */}
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[#8F0A1B] hover:text-[#780614] hover:underline font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FFC72C]" />
                {t('fillDemo')}
              </button>
            </div>

            {/* Sign In Submit Button */}
            <Button
              disabled={isLoading}
              type="submit"
              className="w-full h-12 rounded-xl text-base font-bold text-white bg-gradient-to-r from-[#8F0A1B] via-[#a30d20] to-[#780614] hover:from-[#a30d20] hover:to-[#8F0A1B] border border-[#FFC72C]/40 shadow-lg shadow-[#8F0A1B]/25 hover:shadow-xl hover:shadow-[#8F0A1B]/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>{t('signingIn')}</span>
                </>
              ) : (
                <>
                  <span>{t('signInButton')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Help & IT Wing Assistance */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-500 hover:text-[#8F0A1B] flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
              <PhoneCall className="w-3.5 h-3.5 text-[#8F0A1B]" />
              <span>{t('helpText')}</span>
            </p>
          </div>
        </div>

        {/* Footer & Security Note */}
        <div className="pt-6 border-t border-slate-100 space-y-2 text-center">
          <div className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full shadow-2xs">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{t('authorizedOnly')}</span>
          </div>
          <p className="text-center text-[11px] text-slate-400">
            {t('copyright')}
          </p>
        </div>
      </div>
    </div>
  );
}
