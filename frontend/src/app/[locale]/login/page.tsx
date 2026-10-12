'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const formSchema = z.object({
  userId: z.string().min(3),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const t = useTranslations('Index'); 
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
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
        window.location.href = '/';
      } else {
        if (res.status === 401) {
          setAuthError('Invalid User ID or Password. Please try again.');
        } else {
          const errorData = await res.json().catch(() => null);
          setAuthError(errorData?.message || 'Login failed. Please try again later.');
        }
      }
    } catch (error) {
      console.error(error);
      setAuthError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10 dark:from-primary/20 dark:to-secondary/20 transition-colors duration-500 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-secondary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <Card className="w-full max-w-md shadow-2xl border-primary/20 backdrop-blur-sm bg-background/80 dark:bg-background/90 relative z-10 hover:shadow-primary/10 transition-shadow duration-300">
        <CardHeader className="space-y-1 pb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-primary to-secondary rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">TVK</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Command Center</CardTitle>
          <p className="text-center text-muted-foreground text-sm font-medium">Enterprise Management Portal</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {authError && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2 animate-in fade-in slide-in-from-top-1 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{authError}</p>
              </div>
            )}
            <div className="space-y-2 group">
              <Label htmlFor="userId" className="group-focus-within:text-primary transition-colors">User ID</Label>
              <Input id="userId" className="focus-visible:ring-primary/50 transition-all duration-300 bg-background/50" placeholder="admin" {...register('userId')} />
              {errors.userId && <p className="text-sm text-destructive animate-in fade-in slide-in-from-top-1">{errors.userId.message}</p>}
            </div>
            
            <div className="space-y-2 group">
              <Label htmlFor="password" className="group-focus-within:text-primary transition-colors">Password</Label>
              <Input id="password" type="password" className="focus-visible:ring-primary/50 transition-all duration-300 bg-background/50" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="text-sm text-destructive animate-in fade-in slide-in-from-top-1">{errors.password.message}</p>}
            </div>

            <Button disabled={isLoading} type="submit" className="w-full font-bold text-lg h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all active:scale-[0.98]">
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
