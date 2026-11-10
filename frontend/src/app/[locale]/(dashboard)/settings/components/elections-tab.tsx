'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Vote,
  Plus,
  Edit2,
  Trash2,
  Check,
  Star,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  Trophy,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import {
  useElections,
  useCreateElection,
  useUpdateElection,
  useSetCurrentElection,
  useDeleteElection,
} from '@/hooks/use-elections';
import { Election, CreateElectionDto } from '@/services/api/elections';
import { cn } from '@/lib/utils';

export function ElectionsTab() {
  const locale = useLocale();
  const { data: elections = [], isLoading } = useElections();
  const createElection = useCreateElection();
  const updateElection = useUpdateElection();
  const setCurrentElection = useSetCurrentElection();
  const deleteElection = useDeleteElection();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingElection, setEditingElection] = useState<Election | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const initialFormData: CreateElectionDto = {
    name: '',
    nameTa: '',
    year: '2026',
    type: 'ASSEMBLY',
    status: 'UPCOMING',
    date: '',
    isCurrent: false,
    description: '',
  };

  const [formData, setFormData] = useState<CreateElectionDto>(initialFormData);

  const handleOpenAdd = () => {
    setEditingElection(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (election: Election) => {
    setEditingElection(election);
    setFormData({
      name: election.name,
      nameTa: election.nameTa || '',
      year: election.year,
      type: election.type || 'ASSEMBLY',
      status: election.status || 'UPCOMING',
      date: election.date ? election.date.substring(0, 10) : '',
      isCurrent: Boolean(election.isCurrent),
      description: election.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.year.trim()) return;

    try {
      if (editingElection) {
        await updateElection.mutateAsync({
          id: editingElection.id,
          data: formData,
        });
      } else {
        await createElection.mutateAsync(formData);
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error saving election');
    }
  };

  const handleSetCurrent = async (id: string) => {
    try {
      await setCurrentElection.mutateAsync(id);
    } catch (err: any) {
      alert(err.message || 'Error updating current election');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteElection.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(err.message || 'Error deleting election');
    }
  };

  const filteredElections = elections.filter((e) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      e.name.toLowerCase().includes(q) ||
      (e.nameTa && e.nameTa.toLowerCase().includes(q)) ||
      e.year.includes(q) ||
      e.type.toLowerCase().includes(q)
    );
  });

  const currentElection = elections.find((e) => e.isCurrent);

  return (
    <div className="space-y-6">
      {/* Top Banner / Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-primary/20 shadow-xs bg-gradient-to-br from-white to-amber-50/30 dark:from-zinc-900 dark:to-zinc-850">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Total Elections
              </p>
              <p className="text-2xl font-black text-foreground">{elections.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-400/30 shadow-xs bg-gradient-to-br from-white to-[#FFC72C]/10 dark:from-zinc-900 dark:to-amber-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFC72C] text-[#8F0A1B] flex items-center justify-center shrink-0 shadow-2xs">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wide">
                Active / Current
              </p>
              <p className="text-sm font-black text-gray-900 dark:text-white truncate">
                {currentElection ? `${currentElection.year} - ${currentElection.name}` : 'None Set'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-xs bg-gradient-to-br from-white to-emerald-50/30 dark:from-zinc-900 dark:to-zinc-850">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Upcoming / Active
              </p>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                {elections.filter((e) => e.status !== 'COMPLETED').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-primary/20 shadow-sm overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Vote className="w-5 h-5 text-primary" />
                <span>Elections Master Database</span>
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Maintain elections list. The marked active election will automatically display booth agents and focus analytics.
              </CardDescription>
            </div>

            <Button
              type="button"
              onClick={handleOpenAdd}
              className="bg-primary text-white hover:bg-primary/90 font-bold text-xs gap-1.5 shadow-2xs shrink-0 self-start sm:self-center"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Election</span>
            </Button>
          </div>

          <div className="mt-3">
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search election by name, year, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-white dark:bg-zinc-800"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Loading elections...
            </div>
          ) : filteredElections.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No elections found. Click &quot;Add New Election&quot; to create one.
            </div>
          ) : (
            <div className="divide-y divide-primary/10">
              {filteredElections.map((election) => {
                return (
                  <div
                    key={election.id}
                    className={cn(
                      "p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors",
                      election.isCurrent
                        ? "bg-amber-50/40 dark:bg-amber-950/15"
                        : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    )}
                  >
                    {/* Left: Year, Badges & Name */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-md bg-primary text-white shadow-2xs">
                          {election.year}
                        </span>

                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold uppercase",
                            election.type === 'ASSEMBLY'
                              ? "border-blue-400 text-blue-700 bg-blue-50 dark:bg-blue-950/40"
                              : election.type === 'PARLIAMENTARY'
                              ? "border-purple-400 text-purple-700 bg-purple-50 dark:bg-purple-950/40"
                              : "border-gray-400 text-gray-700 bg-gray-50"
                          )}
                        >
                          {election.type}
                        </Badge>

                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold uppercase",
                            election.status === 'UPCOMING'
                              ? "border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-950/40"
                              : election.status === 'ACTIVE'
                              ? "border-emerald-500 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
                              : "border-zinc-300 text-muted-foreground bg-zinc-50"
                          )}
                        >
                          {election.status}
                        </Badge>

                        {election.isCurrent && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#FFC72C] text-[#8F0A1B] shadow-2xs border border-amber-400">
                            <Star className="w-3 h-3 fill-current" />
                            <span>Active Current Election</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                        {election.name}
                      </h3>

                      {election.nameTa && (
                        <p className="text-xs text-muted-foreground font-medium">
                          {election.nameTa}
                        </p>
                      )}

                      {election.description && (
                        <p className="text-xs text-muted-foreground/80 pt-0.5 line-clamp-1">
                          {election.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
                        {election.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-primary" />
                            <span>{new Date(election.date).toLocaleDateString()}</span>
                          </span>
                        )}
                        <span>
                          Results recorded: <strong className="text-foreground">{election._count?.electionResults || 0}</strong>
                        </span>
                        <span>
                          Booth Agents: <strong className="text-foreground">{election._count?.agentAssignments || 0}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      {!election.isCurrent ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetCurrent(election.id)}
                          className="h-8 text-xs font-semibold text-amber-700 dark:text-amber-300 border-amber-300/80 hover:bg-amber-100 dark:hover:bg-amber-950/40 gap-1.5"
                          title="Set as Current Active Election"
                        >
                          <Star className="w-3.5 h-3.5" />
                          <span>Set Active</span>
                        </Button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                          <Check className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(election)}
                        className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg"
                        title="Edit Election"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirmId(election.id)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                        title="Delete Election"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Election Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Vote className="w-5 h-5 text-primary" />
              <span>{editingElection ? 'Edit Election' : 'Add New Election'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure election metadata. Setting an election as current makes its booth agents primary across the dashboard.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Election Year *</Label>
                <Input
                  required
                  placeholder="e.g. 2026"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="h-9 rounded-xl font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Election Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val) => setFormData({ ...formData, type: val || 'ASSEMBLY' })}
                >
                  <SelectTrigger className="h-9 rounded-xl text-xs">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASSEMBLY">Assembly (சட்டமன்றம்)</SelectItem>
                    <SelectItem value="PARLIAMENTARY">Parliamentary (பாராளுமன்றம்)</SelectItem>
                    <SelectItem value="LOCAL_BODY">Local Body (உள்ளாட்சி)</SelectItem>
                    <SelectItem value="BY_ELECTION">By-Election (இடைத்தேர்தல்)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Election Name (English) *</Label>
              <Input
                required
                placeholder="e.g. 2026 Tamil Nadu Legislative Assembly Election"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Election Name (Tamil / தமிழ்)</Label>
              <Input
                placeholder="e.g. 2026 தமிழ்நாடு சட்டமன்றப் பொதுத்தேர்தல்"
                value={formData.nameTa || ''}
                onChange={(e) => setFormData({ ...formData, nameTa: e.target.value })}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val || 'UPCOMING' })}
                >
                  <SelectTrigger className="h-9 rounded-xl text-xs">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPCOMING">Upcoming</SelectItem>
                    <SelectItem value="ACTIVE">Active / Ongoing</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Polling Date (Optional)</Label>
                <Input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-600 fill-current" />
                  <span>Set as Active / Current Election</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  The active election is shown by default across booth agents and dashboard reports.
                </p>
              </div>
              <input
                type="checkbox"
                id="isCurrent"
                checked={formData.isCurrent}
                onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Description / Notes</Label>
              <Textarea
                placeholder="Optional notes or details about this election..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="rounded-xl text-xs resize-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createElection.isPending || updateElection.isPending}
                className="bg-primary text-white hover:bg-primary/90 font-bold h-9 text-xs"
              >
                {editingElection ? 'Save Changes' : 'Create Election'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteConfirmId)} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm Delete Election</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete this election? Booth agent assignments and past result records linked to this election will also be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteElection.isPending}
              className="h-8 text-xs font-bold"
            >
              {deleteElection.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

