'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import { Plus, Download, RefreshCw, Search, LayoutGrid, List as ListIcon } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { KilaiForm } from './components/kilai-form';
import { useKilais } from '@/hooks/use-kilais';

export default function KilaisListPage() {
  const t = useTranslations('Index');
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [search, setSearch] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: apiKilais, isLoading, isError } = useKilais();

  // We will map API data to the UI structure (adding mocked secretaries/cadres since they are sub-resources)
  const kilais = apiKilais?.map((k) => ({
    id: k.id,
    name: k.name,
    secretary: 'Pending Assignment', // Will come from office-bearers API later
    booths: 0, // from booths API
    cadres: 0, // from cadres API
    health: k.healthScore > 80 ? 'Excellent' : k.healthScore > 50 ? 'Good' : 'Average',
    status: k.status,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase tracking-wide text-primary">Kilai Management</h1>
          <p className="text-muted-foreground mt-1 font-medium">Manage all organizational Kilais and their health metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button className="bg-manjal hover:bg-manjal/90 text-black font-semibold shadow-sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Kilai
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl text-primary">Create New Kilai</DialogTitle>
                <DialogDescription>
                  Register a new Kilai under a specific union. Fill in the details below.
                </DialogDescription>
              </DialogHeader>
              <KilaiForm onSuccess={() => setIsAddOpen(false)} onCancel={() => setIsAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm border border-primary/20">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search kilais by name or secretary..." 
            className="pl-9 border-primary/20 focus-visible:ring-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={view === 'table' ? 'default' : 'outline'} 
            size="icon" 
            onClick={() => setView('table')}
            className={view === 'table' ? 'bg-primary text-primary-foreground' : 'border-primary/20'}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
          <Button 
            variant={view === 'cards' ? 'default' : 'outline'} 
            size="icon" 
            onClick={() => setView('cards')}
            className={view === 'cards' ? 'bg-primary text-primary-foreground' : 'border-primary/20'}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {view === 'table' ? (
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-primary/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-primary-foreground uppercase bg-primary">
                <tr>
                  <th className="px-6 py-4">Kilai Name</th>
                  <th className="px-6 py-4">Secretary</th>
                  <th className="px-6 py-4">Booths</th>
                  <th className="px-6 py-4">Cadres</th>
                  <th className="px-6 py-4">Health Score</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading kilais...</td>
                  </tr>
                ) : kilais.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No Kilais found.</td>
                  </tr>
                ) : (
                  kilais.map((kilai) => (
                    <tr key={kilai.id} className="border-b border-primary/10 hover:bg-primary/5 transition-colors group cursor-pointer">
                      <td className="px-6 py-4 font-semibold text-primary group-hover:underline">
                        <Link href={`/organization/kilais/${kilai.id}`}>{kilai.name}</Link>
                      </td>
                    <td className="px-6 py-4">{kilai.secretary}</td>
                    <td className="px-6 py-4 font-medium">{kilai.booths}</td>
                    <td className="px-6 py-4 font-medium">{kilai.cadres}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        kilai.health === 'Excellent' ? 'bg-green-100 text-green-800' : 
                        kilai.health === 'Good' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {kilai.health}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${kilai.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {kilai.status}
                      </span>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && <div className="col-span-full py-8 text-center text-muted-foreground">Loading kilais...</div>}
          {!isLoading && kilais.length === 0 && <div className="col-span-full py-8 text-center text-muted-foreground">No Kilais found.</div>}
          {kilais.map((kilai) => (
            <Link href={`/organization/kilais/${kilai.id}`} key={kilai.id}>
              <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-primary/20 group cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-heading font-bold text-xl text-primary group-hover:underline">{kilai.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${kilai.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {kilai.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Secretary:</span> <span className="font-medium">{kilai.secretary}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Booths:</span> <span className="font-medium">{kilai.booths}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Cadres:</span> <span className="font-medium">{kilai.cadres}</span></div>
                    <div className="flex justify-between items-center pt-2 border-t border-border mt-2">
                      <span className="text-muted-foreground">Health:</span> 
                      <span className={`px-2 rounded text-xs font-bold ${
                        kilai.health === 'Excellent' ? 'text-green-600' : 
                        kilai.health === 'Good' ? 'text-blue-600' : 'text-yellow-600'
                      }`}>
                        {kilai.health}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
