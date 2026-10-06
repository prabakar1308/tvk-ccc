'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { 
  ArrowLeft, Users as UsersIcon, UserRound, Phone, 
  Plus, LayoutGrid, TableProperties, Edit2, Trash2, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CadreFormDialog } from '@/components/cadre-form-dialog';
import { useQueryClient } from '@tanstack/react-query';

import { useWings, useWingMembers, useAssignWingMember, useRemoveWingMember } from '@/hooks/use-wings';
import { useCadres } from '@/hooks/use-cadres';
import { useDistricts } from '@/hooks/use-districts';
import { useUnions } from '@/hooks/use-unions';
import { useSessionStorage } from '@/hooks/use-session-storage';

export default function WingDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations('Wings');
  const queryClient = useQueryClient();
  
  const wingId = params.id as string;
  const [sessionLevel, , isMountedLevel] = useSessionStorage('wings_level', 'district');
  const [sessionDistrict, , isMountedDistrict] = useSessionStorage('wings_district', '');
  const [sessionUnion, , isMountedUnion] = useSessionStorage('wings_union', '');
  
  const isMounted = isMountedLevel && isMountedDistrict && isMountedUnion;
  
  const level = sessionLevel;
  const orgId = level === 'district' ? sessionDistrict : sessionUnion;

  const { data: wingsData = [] } = useWings();
  const wing = wingsData.find((w: any) => w.id === wingId) || { name: 'Wing Details', color: 'bg-gray-500', textColor: 'text-gray-500' };
  
  const { data: members = [], isLoading: isMembersLoading } = useWingMembers(wingId, level, orgId);
  const { mutate: assignMember, isPending: isAssigning } = useAssignWingMember();
  const { mutate: removeMember, isPending: isRemoving } = useRemoveWingMember();

  const { data: districts = [] } = useDistricts();
  const { data: unions = [] } = useUnions();

  const orgName = level === 'district' 
    ? districts.find((d: any) => d.id === orgId)?.name 
    : unions.find((u: any) => u.id === orgId)?.name;

  const [viewMode, setViewMode] = useState<'tile' | 'table'>('tile');
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const filterParams: any = { level: level.toUpperCase() };
  if (level === 'district') {
    filterParams.districtId = orgId;
  } else if (level === 'union') {
    filterParams.unionId = orgId;
  }
  
  const { data: cadresResponse } = useCadres(filterParams);
  const cadres = cadresResponse || [];

  const coordinators = members.filter((m: any) => m.role === 'COORDINATOR');
  const coCoordinators = members.filter((m: any) => m.role === 'CO_COORDINATOR');

  const handleAdd = (role: string) => {
    setEditingId(null);
    setEditingRole(role === 'Coordinator' ? 'COORDINATOR' : 'CO_COORDINATOR');
    setIsManageDialogOpen(true);
  };

  const handleEdit = (member: any) => {
    setEditingId(member.id);
    setEditingRole(member.role);
    setIsManageDialogOpen(true);
  };

  const handleDelete = (member: any) => {
    if(confirm(`Are you sure you want to remove ${member.name} from this wing?`)) {
      removeMember({ cadreId: member.id });
    }
  };

  const renderTileView = (memberList: any[], title: string, role: string) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          {role === 'Coordinator' ? <UserRound className="w-5 h-5 text-primary" /> : <UsersIcon className="w-5 h-5 text-primary" />}
          {title} ({memberList.length})
        </h3>
        <Button size="sm" variant="outline" className="rounded-xl shadow-sm bg-white" onClick={() => handleAdd(role)}>
          <Plus className="w-4 h-4 mr-2" /> Add {role}
        </Button>
      </div>
      
      {memberList.length === 0 ? (
        <div className="bg-gray-50 border border-gray-100 border-dashed rounded-2xl p-8 text-center text-gray-500">
          No {title.toLowerCase()} assigned yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {memberList.map((member: any) => (
            <Card key={member.id} className="group rounded-3xl border border-gray-200 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-primary/40 hover:ring-2 hover:ring-primary/10 transition-all duration-300 bg-white hover:-translate-y-1 overflow-hidden relative">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 ease-out z-0" />
              <CardContent className="p-5 relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-md overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                    {member.photoUrl ? (
                      <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=8F0A1B&color=fff`} alt={member.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex gap-1 bg-gray-50/80 rounded-full p-1 border border-gray-100">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" onClick={() => handleEdit(member)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" onClick={() => handleDelete(member)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                
                <h4 className="font-bold text-[15px] text-gray-900 truncate mb-1">{member.name}</h4>
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100/80">
                  <a href={`tel:${member.phone}`} className="text-[13px] font-medium text-gray-500 hover:text-[#8F0A1B] flex items-center gap-1.5 transition-colors bg-gray-50 hover:bg-red-50/50 px-2 py-1 rounded-lg">
                    <Phone className="w-3.5 h-3.5" /> {member.phone || 'No phone'}
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderTableView = (memberList: any[], title: string, role: string) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          {role === 'Coordinator' ? <UserRound className="w-5 h-5 text-primary" /> : <UsersIcon className="w-5 h-5 text-primary" />}
          {title} ({memberList.length})
        </h3>
        <Button size="sm" variant="outline" className="rounded-xl shadow-sm bg-white" onClick={() => handleAdd(role)}>
          <Plus className="w-4 h-4 mr-2" /> Add {role}
        </Button>
      </div>

      <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-gray-900">Name</TableHead>
              <TableHead className="font-semibold text-gray-900">Contact Number</TableHead>
              <TableHead className="font-semibold text-gray-900 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-gray-500">
                  No {title.toLowerCase()} assigned yet.
                </TableCell>
              </TableRow>
            ) : (
              memberList.map((member: any) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-gray-200">
                        <UserRound className="w-4 h-4 text-gray-500" />
                      </div>
                      {member.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <a href={`tel:${member.phone}`} className="text-blue-600 hover:underline flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> {member.phone || 'No phone'}
                    </a>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600 rounded-full" onClick={() => handleEdit(member)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 rounded-full" onClick={() => handleDelete(member)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${wing.color}`} />
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {wing.name}
            </h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
              Manage positions for <span className="font-semibold text-[#8F0A1B] bg-[#8F0A1B]/10 px-2 py-0.5 rounded-md">{orgName || '...'}</span> {level === 'district' ? 'District' : 'Org Unit'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          <button 
            className={`p-2 rounded-lg transition-all ${viewMode === 'tile' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setViewMode('tile')}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button 
            className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setViewMode('table')}
          >
            <TableProperties className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="pb-8">
        {isMembersLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : viewMode === 'tile' ? (
          <>
            {renderTileView(coordinators, 'Coordinator', 'Coordinator')}
            {renderTileView(coCoordinators, 'Co-coordinators', 'Co-coordinator')}
          </>
        ) : (
          <>
            {renderTableView(coordinators, 'Coordinator', 'Coordinator')}
            {renderTableView(coCoordinators, 'Co-coordinators', 'Co-coordinator')}
          </>
        )}
      </div>

      <CadreFormDialog 
        isOpen={isManageDialogOpen}
        onOpenChange={setIsManageDialogOpen}
        editingId={editingId}
        cadres={members}
        defaultLevel={level.toUpperCase() as any}
        defaultDistrictId={level === 'district' ? orgId : undefined}
        defaultUnionId={level === 'union' ? orgId : undefined}
        defaultWingId={wingId}
        defaultRole={editingRole}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['wings', wingId, 'members'] });
          queryClient.invalidateQueries({ queryKey: ['cadres'] });
        }}
      />
    </div>
  );
}
