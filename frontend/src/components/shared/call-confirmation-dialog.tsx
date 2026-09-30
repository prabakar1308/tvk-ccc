'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CallConfirmationDialogProps {
  person: { name: string; phone: string } | null;
  onOpenChange: (open: boolean) => void;
}

export function CallConfirmationDialog({ person, onOpenChange }: CallConfirmationDialogProps) {
  return (
    <Dialog open={!!person} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Confirm Call</DialogTitle>
          <DialogDescription className="pt-2">
            Are you sure you want to call <strong>{person?.name}</strong> at <span className="font-semibold text-blue-600">{person?.phone}</span>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            className="bg-primary text-white hover:bg-primary/90" 
            onClick={() => {
              if (person?.phone) {
                window.location.href = `tel:${person.phone}`;
              }
              onOpenChange(false);
            }}
          >
            Yes, Call Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
