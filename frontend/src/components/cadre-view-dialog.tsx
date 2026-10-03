'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useUnions } from '@/hooks/use-unions';
import { useKilais } from '@/hooks/use-kilais';
import { useBooths } from '@/hooks/use-booths';
import { useState } from 'react';
import { FileText, X } from "lucide-react";

export interface CadreViewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cadre: any;
}

export function CadreViewDialog({
  isOpen,
  onOpenChange,
  cadre
}: CadreViewDialogProps) {
  const { data: unions = [] } = useUnions();
  const { data: kilais = [] } = useKilais();
  const { data: booths = [] } = useBooths();
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  if (!cadre) return null;

  const union = unions.find((u: any) => String(u.id || u._id) === cadre.unionId);
  const kilai = kilais.find((k: any) => String(k.id || k._id) === cadre.homeKilaiId);
  const booth = booths.find((b: any) => b.boothNo === cadre.boothNo);

  const getRoleBadge = (role: string | undefined, level: string) => {
    const displayRole = role || 'Administrator';
    if (level === 'DISTRICT') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#8F0A1B] text-white border border-[#8F0A1B]/20 shadow-sm">{displayRole}</span>;
    }
    if (level === 'UNION') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500 text-white border border-amber-600/20 shadow-sm">{displayRole}</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">{displayRole}</span>;
  };

  const openPreview = (url: string, title: string) => {
    setPreviewUrl(url);
    setPreviewTitle(title);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>View Administrator Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-4 border-b pb-4">
             <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-primary/20 shrink-0">
                {cadre.photoUrl ? (
                  <img src={cadre.photoUrl} alt={cadre.name} className="w-full h-full object-cover" />
                ) : (
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(cadre.name || 'User')}&background=random`} alt={cadre.name} className="w-full h-full object-cover" />
                )}
             </div>
             <div>
                <h3 className="text-xl font-bold text-gray-900">{cadre.name}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm text-gray-500">{cadre.memberId}</span>
                  <span className="text-gray-300">•</span>
                  {getRoleBadge(cadre.role, cadre.level)}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Phone No</Label>
              <div className="font-medium text-gray-900">{cadre.phone || '-'}</div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Aadhaar No</Label>
              <div className="font-medium text-gray-900">{cadre.aadhaarNumber || '-'}</div>
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Level</Label>
              <div className="font-medium text-gray-900 capitalize">{cadre.level?.toLowerCase() || '-'}</div>
            </div>

            {(cadre.level === 'UNION' || cadre.level === 'KILAI') && (
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Union</Label>
                <div className="font-medium text-gray-900">{union?.name || '-'}</div>
              </div>
            )}

            {cadre.level === 'KILAI' && (
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Kilai</Label>
                <div className="font-medium text-gray-900">{kilai?.name || '-'}</div>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Place / Area</Label>
              <div className="font-medium text-gray-900">{cadre.area || '-'}</div>
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Booth No.</Label>
              <div className="font-medium text-gray-900">
                {cadre.boothNo ? (booth ? `${booth.boothNo} - ${booth.area || booth.name}` : cadre.boothNo) : '-'}
              </div>
            </div>
          </div>

          {(cadre.attachments?.aadhaarPhoto || cadre.attachments?.voterIdPhoto) && (
            <div className="pt-4 border-t space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Documents</h3>
              <div className="flex gap-4">
                {cadre.attachments?.aadhaarPhoto && (
                  <div className="space-y-2">
                    <Label className="text-center block text-xs font-semibold">Aadhaar</Label>
                    <button type="button" onClick={() => openPreview(cadre.attachments.aadhaarPhoto, 'Aadhaar Document')} className="block w-24 h-24 border rounded-xl overflow-hidden hover:opacity-80 transition-opacity bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary">
                      {cadre.attachments.aadhaarPhoto.includes('blob:') || cadre.attachments.aadhaarPhoto.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                        <img src={cadre.attachments.aadhaarPhoto} alt="Aadhaar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground">
                          <FileText className="w-8 h-8 mb-1" />
                          <span className="text-[10px] font-bold">PDF</span>
                        </div>
                      )}
                    </button>
                  </div>
                )}
                {cadre.attachments?.voterIdPhoto && (
                  <div className="space-y-2">
                    <Label className="text-center block text-xs font-semibold">Voter ID</Label>
                    <button type="button" onClick={() => openPreview(cadre.attachments.voterIdPhoto, 'Voter ID Document')} className="block w-24 h-24 border rounded-xl overflow-hidden hover:opacity-80 transition-opacity bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary">
                      {cadre.attachments.voterIdPhoto.includes('blob:') || cadre.attachments.voterIdPhoto.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                        <img src={cadre.attachments.voterIdPhoto} alt="Voter ID" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground">
                          <FileText className="w-8 h-8 mb-1" />
                          <span className="text-[10px] font-bold">PDF</span>
                        </div>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
      <DialogContent className="max-w-[95vw] md:max-w-[80vw] h-[95vh] p-0 flex flex-col border-none overflow-hidden bg-black/95">
        <div className="flex justify-between items-center p-4 text-white z-10 bg-black/50 backdrop-blur-sm shadow-sm absolute top-0 left-0 right-0">
          <h3 className="text-lg font-semibold">{previewTitle}</h3>
        </div>
        <div className="flex-1 w-full h-full flex items-center justify-center p-4 pt-16 pb-12">
          {previewUrl && (
            previewUrl.includes('blob:') || previewUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
              <img src={previewUrl} alt={previewTitle} className="max-w-full max-h-full object-contain rounded-md shadow-2xl" />
            ) : (
              <iframe src={previewUrl} className="w-full h-full bg-white rounded-md shadow-2xl" title={previewTitle} />
            )
          )}
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <Button variant="secondary" className="rounded-full shadow-lg" onClick={() => setPreviewUrl(null)}>Close Preview</Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
