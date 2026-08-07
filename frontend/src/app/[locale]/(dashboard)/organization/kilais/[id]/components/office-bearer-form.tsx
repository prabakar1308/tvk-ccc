'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateOfficeBearer, useUpdateOfficeBearer } from '@/hooks/use-kilais';
import { ImagePlus, Paperclip } from 'lucide-react';

const officeBearerSchema = z.object({
  role: z.enum(['SECRETARY', 'PRESIDENT', 'TREASURER', 'DEPUTY_SECRETARY', 'YOUTH_WING', 'WOMEN_WING', 'STUDENT_WING', 'IT_WING']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']),
  joinedOn: z.string(),
  cadre: z.object({
    memberId: z.string().min(1, 'TVK Member ID is required'),
    name: z.string().min(2, 'Name is required'),
    phone: z.string().min(10, 'Phone number is required'),
    aadhaarNumber: z.string().optional(),
    voterId: z.string().optional(),
    photoUrl: z.string().optional(),
    attachments: z.any().optional(),
  }),
});

type OfficeBearerFormValues = z.infer<typeof officeBearerSchema>;

interface OfficeBearerFormProps {
  kilaiId: string;
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OfficeBearerForm({ kilaiId, initialData, onSuccess, onCancel }: OfficeBearerFormProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.cadre?.photoUrl || null);
  const createBearer = useCreateOfficeBearer();
  const updateBearer = useUpdateOfficeBearer();

  const isPending = createBearer.isPending || updateBearer.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OfficeBearerFormValues>({
    resolver: zodResolver(officeBearerSchema),
    defaultValues: initialData ? {
      role: initialData.role,
      status: initialData.status,
      joinedOn: new Date(initialData.joinedOn).toISOString().split('T')[0],
      cadre: {
        memberId: initialData.cadre.memberId,
        name: initialData.cadre.name,
        phone: initialData.cadre.phone || '',
        aadhaarNumber: initialData.cadre.aadhaarNumber || '',
        voterId: initialData.cadre.voterId || '',
        photoUrl: initialData.cadre.photoUrl || '',
      }
    } : {
      role: 'SECRETARY',
      status: 'ACTIVE',
      joinedOn: new Date().toISOString().split('T')[0],
      cadre: {
        memberId: '',
        name: '',
        phone: '',
        aadhaarNumber: '',
        voterId: '',
        photoUrl: '',
      }
    },
  });

  const onSubmit = async (data: OfficeBearerFormValues) => {
    try {
      if (initialData?.id) {
        await updateBearer.mutateAsync({ kilaiId, bearerId: initialData.id, data });
      } else {
        await createBearer.mutateAsync({ kilaiId, data });
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to save office bearer:', error);
    }
  };

  // Mock File Upload (since backend local upload isn't configured, we use object URLs for preview and string paths)
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
      setValue('cadre.photoUrl', url); // In production, this would be a real uploaded URL
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Role & Assignment Info */}
        <div className="space-y-4">
          <h3 className="font-heading font-semibold text-lg text-primary border-b pb-2">Role Information</h3>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
            <Select onValueChange={(val: any) => setValue('role', val)} defaultValue={watch('role')}>
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SECRETARY">Secretary</SelectItem>
                <SelectItem value="PRESIDENT">President</SelectItem>
                <SelectItem value="TREASURER">Treasurer</SelectItem>
                <SelectItem value="DEPUTY_SECRETARY">Deputy Secretary</SelectItem>
                <SelectItem value="YOUTH_WING">Youth Wing</SelectItem>
                <SelectItem value="WOMEN_WING">Women Wing</SelectItem>
                <SelectItem value="STUDENT_WING">Student Wing</SelectItem>
                <SelectItem value="IT_WING">IT Wing</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="joinedOn">Date of Joining <span className="text-red-500">*</span></Label>
            <Input type="date" id="joinedOn" {...register('joinedOn')} />
          </div>
        </div>

        {/* Personal Details (Cadre) */}
        <div className="space-y-4">
          <h3 className="font-heading font-semibold text-lg text-primary border-b pb-2">Personal Details</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
              <Input id="name" {...register('cadre.name')} placeholder="Enter full name" className={errors.cadre?.name ? "border-red-500" : ""} />
              {errors.cadre?.name && <p className="text-xs text-red-500">{errors.cadre.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
              <Input id="phone" {...register('cadre.phone')} placeholder="+91..." className={errors.cadre?.phone ? "border-red-500" : ""} />
              {errors.cadre?.phone && <p className="text-xs text-red-500">{errors.cadre.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberId">TVK Member ID <span className="text-red-500">*</span></Label>
              <Input id="memberId" {...register('cadre.memberId')} placeholder="Card Number" className={errors.cadre?.memberId ? "border-red-500" : ""} />
              {errors.cadre?.memberId && <p className="text-xs text-red-500">{errors.cadre.memberId.message}</p>}
            </div>
          </div>
        </div>

        {/* Identification & Documents */}
        <div className="space-y-4 md:col-span-2">
          <h3 className="font-heading font-semibold text-lg text-primary border-b pb-2">Identification & Media</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
              <Input id="aadhaarNumber" {...register('cadre.aadhaarNumber')} placeholder="XXXX XXXX XXXX" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="voterId">Voter ID (EPIC)</Label>
              <Input id="voterId" {...register('cadre.voterId')} placeholder="ABC1234567" />
            </div>

            <div className="space-y-4">
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full border border-dashed border-primary/50 flex items-center justify-center overflow-hidden bg-primary/5">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-primary/50" />
                  )}
                </div>
                <div>
                  <input type="file" id="photo" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  <Label htmlFor="photo" className="cursor-pointer text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 rounded-md transition-colors">
                    Upload Photo
                  </Label>
                </div>
              </div>
            </div>
            
            <div className="col-span-1 md:col-span-3 space-y-2 mt-2 border border-dashed border-border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center gap-2 mb-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <Label className="font-semibold">Attachments (ID proofs, documents)</Label>
              </div>
              <input type="file" multiple className="text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
              <p className="text-xs text-muted-foreground mt-2">Only images and PDFs are allowed. Maximum 5 files.</p>
            </div>
          </div>
        </div>

      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-border">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isPending}>
          {isPending ? 'Saving...' : initialData ? 'Update Office Bearer' : 'Add Office Bearer'}
        </Button>
      </div>
    </form>
  );
}
