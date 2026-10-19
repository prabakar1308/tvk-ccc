'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { ChangeEvent, useTransition } from 'react';

import { cn } from '@/lib/utils';

export default function LanguageSwitcher({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onSelectChange(newLocale: string) {
    startTransition(() => {
      // Replace the current locale in the pathname with the new one
      const pathWithoutLocale = pathname.replace(`/${locale}`, '');
      const newPath = `/${newLocale}${pathWithoutLocale === '' ? '' : pathWithoutLocale}`;
      
      // Setting a cookie so middleware can pick it up
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      
      router.replace(newPath);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={locale}
        disabled={isPending}
        onChange={(e) => onSelectChange(e.target.value)}
        className={cn(
          "bg-transparent border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer",
          className
        )}
      >
        <option value="en" className="text-zinc-900 bg-white">English</option>
        <option value="ta" className="text-zinc-900 bg-white">தமிழ்</option>
      </select>
    </div>
  );
}
