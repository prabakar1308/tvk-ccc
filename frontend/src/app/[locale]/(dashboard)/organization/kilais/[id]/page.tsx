'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft, MoreVertical, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { KilaiForm } from '../components/kilai-form';

// Import Tabs Components (These will be implemented shortly)
import { OverviewTab } from './components/overview-tab';
import { OfficeBearersTab } from './components/office-bearers-tab';
import { CadresTab } from './components/cadres-tab';
import { ActivitiesTab } from './components/activities-tab';
import { MeetingsTab } from './components/meetings-tab';
import { WelfareTab } from './components/welfare-tab';
import { PublicIssuesTab } from './components/public-issues-tab';
import { BoothsTab } from './components/booths-tab';
import { TasksTab } from './components/tasks-tab';
import { ReportsTab } from './components/reports-tab';
import { MediaTab } from './components/media-tab';
import { SettingsTab } from './components/settings-tab';
import { useKilai } from '@/hooks/use-kilais';

export default function KilaiDetailPage() {
  const router = useRouter();
  const params = useParams();
  const kilaiId = params.id as string;
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: apiKilai, isLoading, isError } = useKilai(kilaiId);

  // Map API data to the header, fallback to empty string if loading
  const kilai = {
    name: apiKilai?.name || 'Loading...',
    code: apiKilai?.code || '...',
    status: apiKilai?.status || 'PENDING',
    health: apiKilai?.healthScore ? (apiKilai.healthScore > 80 ? 'Excellent' : apiKilai.healthScore > 50 ? 'Good' : 'Average') : 'N/A',
  };

  if (isError) {
    return <div className="p-8 text-center text-red-500">Failed to load Kilai details.</div>;
  }

  const tabs = [
    { value: 'overview', label: 'Overview', component: OverviewTab },
    { value: 'office-bearers', label: 'Office Bearers', component: OfficeBearersTab },
    { value: 'cadres', label: 'Cadres', component: CadresTab },
    { value: 'activities', label: 'Activities', component: ActivitiesTab },
    { value: 'meetings', label: 'Meetings', component: MeetingsTab },
    { value: 'welfare', label: 'Welfare', component: WelfareTab },
    { value: 'public-issues', label: 'Public Issues', component: PublicIssuesTab },
    { value: 'booths', label: 'Booths', component: BoothsTab },
    { value: 'tasks', label: 'Tasks', component: TasksTab },
    { value: 'reports', label: 'Reports', component: ReportsTab },
    { value: 'media', label: 'Media', component: MediaTab },
    { value: 'settings', label: 'Settings', component: SettingsTab },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-muted-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-heading font-bold uppercase tracking-wide text-primary">
                {kilai.name}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${kilai.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {kilai.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-medium mt-1">Code: {kilai.code} • Health: {kilai.health}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button className="bg-manjal hover:bg-manjal/90 text-black font-semibold shadow-sm">
                <Plus className="mr-2 h-4 w-4" /> Quick Actions
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>Add Activity</DropdownMenuItem>
              <DropdownMenuItem>Add Cadre</DropdownMenuItem>
              <DropdownMenuItem>Schedule Meeting</DropdownMenuItem>
              <DropdownMenuItem>Register Public Issue</DropdownMenuItem>
              <DropdownMenuItem>Assign Task</DropdownMenuItem>
              <DropdownMenuItem>Add Welfare Activity</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="outline" size="icon" className="border-primary text-primary">
                <MoreVertical className="h-4 w-4" />
              </Button>
            } />
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Generate Report</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsEditOpen(true)}>Edit Kilai</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Archive Kilai</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl text-primary">Edit Kilai Details</DialogTitle>
                <DialogDescription>
                  Update the information for {kilai.name}.
                </DialogDescription>
              </DialogHeader>
              {apiKilai && (
                <KilaiForm 
                  initialData={apiKilai as any} 
                  onSuccess={() => setIsEditOpen(false)} 
                  onCancel={() => setIsEditOpen(false)} 
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-2 mb-4 scrollbar-hide border-b border-primary/20">
          <TabsList className="inline-flex h-10 items-center justify-start rounded-none bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="inline-flex items-center justify-center whitespace-nowrap px-4 py-2.5 text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground rounded-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Render Tab Contents */}
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-0 focus-visible:outline-none">
            <tab.component kilaiId={kilaiId} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
