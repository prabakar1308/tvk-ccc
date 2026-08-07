'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslations } from 'next-intl';
import { useCreateKilai, useUpdateKilai } from '@/hooks/use-kilais';
import { useUser } from '@/contexts/user-context';

const kilaiFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  tamilName: z.string().optional(),
  code: z.string().min(2, 'Kilai Code is required'),
  description: z.string().optional(),
  unionId: z.string().optional(),
  village: z.string().optional(),
  address: z.string().optional(),
  pincode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']),
});

type KilaiFormValues = z.infer<typeof kilaiFormSchema>;

interface KilaiFormProps {
  initialData?: KilaiFormValues;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function KilaiForm({ initialData, onSuccess, onCancel }: KilaiFormProps) {
  const t = useTranslations('Index');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<KilaiFormValues>({
    resolver: zodResolver(kilaiFormSchema),
    defaultValues: initialData || {
      name: '',
      tamilName: '',
      code: '',
      description: '',
      unionId: '',
      village: '',
      address: '',
      pincode: '',
      phone: '',
      email: '',
      status: 'ACTIVE',
    },
  });

  const createKilai = useCreateKilai();
  const updateKilai = useUpdateKilai();
  const { activeUnionId, user } = useUser();

  const isPending = createKilai.isPending || updateKilai.isPending;

  const onSubmit = async (data: KilaiFormValues) => {
    try {
      const payload = { ...data };
      if (activeUnionId) {
        payload.unionId = activeUnionId;
      }
      if (initialData && (initialData as any).id) {
        await updateKilai.mutateAsync({ id: (initialData as any).id, data });
      } else {
        await createKilai.mutateAsync(payload as any);
        reset(); // Reset form fields on successful creation
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to save kilai:', error);
      // Depending on the UI, could show a toast notification here
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {user?.role === 'SUPER_ADMIN' && !activeUnionId && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200 mb-6 flex flex-col gap-1">
          <p className="font-semibold">Action Required: No Union Selected</p>
          <p className="text-sm">As a Super Admin, you must select an Active Union from the top right header dropdown before creating a Kilai.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Info */}
        <div className="space-y-4">
          <h3 className="font-heading font-semibold text-lg text-primary border-b pb-2">Basic Information</h3>
          
          <div className="space-y-2">
            <Label htmlFor="name">Kilai Name <span className="text-red-500">*</span></Label>
            <Input id="name" {...register('name')} placeholder="Enter Kilai name" className={errors.name ? "border-red-500" : ""} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tamilName">Tamil Name</Label>
            <Input id="tamilName" {...register('tamilName')} placeholder="Enter Tamil name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Kilai Code <span className="text-red-500">*</span></Label>
            <Input id="code" {...register('code')} placeholder="e.g. KL-001" className={errors.code ? "border-red-500" : ""} />
            {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
          </div>

          {/* Union dropdown removed as per RBAC implementation */}

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={(val: any) => setValue('status', val)} defaultValue={watch('status')}>
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Contact & Location */}
        <div className="space-y-4">
          <h3 className="font-heading font-semibold text-lg text-primary border-b pb-2">Location & Contact</h3>
          
          <div className="space-y-2">
            <Label htmlFor="village">Village / Ward</Label>
            <Input id="village" {...register('village')} placeholder="Enter Village or Ward" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" {...register('address')} placeholder="Full address" rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input id="pincode" {...register('pincode')} placeholder="e.g. 600001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register('phone')} placeholder="Contact number" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} placeholder="Email address" className={errors.email ? "border-red-500" : ""} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} placeholder="Any additional details" rows={2} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-border">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          className="bg-primary hover:bg-primary/90 text-primary-foreground" 
          disabled={isPending || (user?.role === 'SUPER_ADMIN' && !activeUnionId)}
        >
          {isPending ? 'Saving...' : initialData ? 'Update Kilai' : 'Create Kilai'}
        </Button>
      </div>
    </form>
  );
}
