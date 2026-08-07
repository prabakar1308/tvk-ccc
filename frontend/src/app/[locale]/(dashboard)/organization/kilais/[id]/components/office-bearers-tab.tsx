'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UserCircle, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OfficeBearerForm } from './office-bearer-form';
import { useOfficeBearers, useDeleteOfficeBearer } from '@/hooks/use-kilais';

export function OfficeBearersTab({ kilaiId }: { kilaiId: string }) {
  const { data: bearers, isLoading, isError } = useOfficeBearers(kilaiId);
  const deleteBearer = useDeleteOfficeBearer();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBearer, setEditingBearer] = useState<any>(null);

  const handleAdd = () => {
    setEditingBearer(null);
    setIsFormOpen(true);
  };

  const handleEdit = (bearer: any) => {
    setEditingBearer(bearer);
    setIsFormOpen(true);
  };

  const handleDelete = async (bearerId: string) => {
    if (window.confirm('Are you sure you want to remove this office bearer?')) {
      try {
        await deleteBearer.mutateAsync({ kilaiId, bearerId });
      } catch (error) {
        console.error('Failed to delete', error);
      }
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading office bearers...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Failed to load office bearers.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-heading font-bold text-primary">Office Bearers</h2>
          <p className="text-sm text-muted-foreground">Manage the appointed leaders of this kilai.</p>
        </div>
        <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Add Bearer
        </Button>
      </div>

      {bearers?.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-border rounded-lg bg-muted/20">
          <UserCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium text-foreground">No office bearers found</p>
          <p className="text-sm text-muted-foreground mb-4">Assign leaders to manage this kilai's operations.</p>
          <Button onClick={handleAdd} variant="outline" className="border-primary text-primary hover:bg-primary/5">
            Add First Bearer
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bearers?.map((bearer: any) => (
            <Card key={bearer.id} className="border-primary/20 shadow-sm relative group overflow-hidden">
              {bearer.status !== 'ACTIVE' && (
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">
                  {bearer.status}
                </div>
              )}
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 overflow-hidden border border-primary/20">
                    {bearer.cadre?.photoUrl ? (
                      <img src={bearer.cadre.photoUrl} alt={bearer.cadre.name} className="h-full w-full object-cover" />
                    ) : (
                      <UserCircle className="h-10 w-10" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-manjal bg-primary px-2 py-0.5 rounded-sm inline-block mb-1 uppercase tracking-wider">{bearer.role.replace('_', ' ')}</p>
                    <h4 className="font-bold text-foreground text-lg leading-tight">{bearer.cadre?.name}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5 font-medium">{bearer.cadre?.phone}</p>
                  </div>
                </div>

                <div className="space-y-1.5 mt-auto pt-4 border-t border-border/50 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>TVK Member ID:</span>
                    <span className="font-medium text-foreground">{bearer.cadre?.memberId}</span>
                  </div>
                  {bearer.cadre?.aadhaarNumber && (
                    <div className="flex justify-between">
                      <span>Aadhaar:</span>
                      <span className="font-medium text-foreground">•••• •••• {bearer.cadre.aadhaarNumber.slice(-4)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Joined On:</span>
                    <span className="font-medium text-foreground">{new Date(bearer.joinedOn).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform bg-primary/5 flex items-center justify-end p-2 gap-2 border-t border-primary/10 backdrop-blur-sm">
                  <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => handleEdit(bearer)}>
                    <Edit className="h-4 w-4 mr-1.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(bearer.id)} disabled={deleteBearer.isPending}>
                    <Trash2 className="h-4 w-4 mr-1.5" /> Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-primary">
              {editingBearer ? 'Update Office Bearer' : 'Appoint Office Bearer'}
            </DialogTitle>
            <DialogDescription>
              {editingBearer ? 'Update the details and role for this leader.' : 'Add a new leader to manage kilai operations.'}
            </DialogDescription>
          </DialogHeader>
          <OfficeBearerForm 
            kilaiId={kilaiId} 
            initialData={editingBearer} 
            onSuccess={() => setIsFormOpen(false)} 
            onCancel={() => setIsFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
