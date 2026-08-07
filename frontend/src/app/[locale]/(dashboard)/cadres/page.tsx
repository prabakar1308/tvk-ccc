'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, UserCheck, UserPlus, Trophy, Eye, Edit2 } from "lucide-react";

export default function CadresPage() {
  const cadres = [
    { id: 1, memberId: 'TVK-26-0001', name: 'Ramesh Kumar', phone: '+91 98765 43210', homeKilai: 'T Nagar Central', role: 'UNION_LEADER', joined: '2026-01-15' },
    { id: 2, memberId: 'TVK-26-0452', name: 'Suresh Babu', phone: '+91 87654 32109', homeKilai: 'Mylapore Branch', role: 'CADRE', joined: '2026-02-20' },
    { id: 3, name: 'Priya Rajan', memberId: 'TVK-26-0891', phone: '+91 76543 21098', homeKilai: 'Anna Nagar West', role: 'CADRE', joined: '2026-03-10' },
    { id: 4, name: 'Karthik S', memberId: 'TVK-26-1102', phone: '+91 65432 10987', homeKilai: 'KK Nagar Circle', role: 'CADRE', joined: '2026-01-05' },
    { id: 5, name: 'Lakshmi V', memberId: 'TVK-26-1503', phone: '+91 54321 09876', homeKilai: 'Perambur Node', role: 'SUPER_ADMIN', joined: '2026-04-18' },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-primary text-white border border-primary/20 shadow-sm">Super Admin</span>;
      case 'UNION_LEADER':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-manjal text-black border border-manjal/20 shadow-sm">Union Leader</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">Cadre</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold uppercase tracking-wide text-primary">Cadres</h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">Manage party members, roles, and grassroots engagement.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-11 px-6 rounded-lg transition-transform active:scale-95">
          <Plus className="mr-2 h-5 w-5" /> Register Cadre
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="border-primary/20 shadow-sm bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-md text-primary">
              <UserCheck className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Cadres</p>
              <h2 className="text-4xl font-heading font-bold text-foreground mt-1">25,900</h2>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 shadow-sm bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-manjal/20 rounded-md text-amber-600 dark:text-manjal">
              <UserPlus className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">New This Month</p>
              <h2 className="text-4xl font-heading font-bold text-foreground mt-1">+1,245</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-sm bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-md text-primary">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Cadres</p>
              <h2 className="text-4xl font-heading font-bold text-foreground mt-1">68%</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg shadow-sm border border-primary/10">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search cadres by name, ID, or phone..." 
            className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-900 border-primary/20 focus-visible:ring-primary/30 rounded-md transition-all"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="h-11 rounded-md px-6 font-medium border-primary/20 text-primary hover:bg-primary/5">Export CSV</Button>
        </div>
      </div>

      {/* Data Table with Tabs */}
      <div className="rounded-lg border border-primary/20 bg-card shadow-sm overflow-hidden p-2">
        <div className="flex border-b border-primary/10 mb-4 px-2 space-x-4">
          <button className="px-4 py-2 font-semibold text-primary border-b-2 border-primary">All Cadres</button>
          <button className="px-4 py-2 font-medium text-muted-foreground hover:text-primary">District Level</button>
          <button className="px-4 py-2 font-medium text-muted-foreground hover:text-primary">Group Level</button>
          <button className="px-4 py-2 font-medium text-muted-foreground hover:text-primary">Union Level</button>
          <button className="px-4 py-2 font-medium text-muted-foreground hover:text-primary">Kilai Level</button>
        </div>
        <Table>
          <TableHeader className="bg-primary/5">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-primary py-4">Member ID</TableHead>
              <TableHead className="font-semibold text-primary py-4">Name</TableHead>
              <TableHead className="font-semibold text-primary py-4">Level</TableHead>
              <TableHead className="font-semibold text-primary py-4">Role</TableHead>
              <TableHead className="font-semibold text-primary py-4">Location</TableHead>
              <TableHead className="font-semibold text-primary py-4">Joined</TableHead>
              <TableHead className="font-semibold text-primary py-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cadres.map((cadre) => (
              <TableRow key={cadre.id} className="hover:bg-primary/5 transition-colors group border-b-primary/10">
                <TableCell className="font-bold text-muted-foreground py-4">{cadre.memberId}</TableCell>
                <TableCell className="font-bold text-base py-4 text-foreground">{cadre.name}</TableCell>
                <TableCell className="py-4 font-medium text-primary">KILAI</TableCell>
                <TableCell className="py-4">
                  {getRoleBadge(cadre.role)}
                </TableCell>
                <TableCell className="font-medium py-4">{cadre.homeKilai}</TableCell>
                <TableCell className="text-muted-foreground py-4 font-medium">{new Date(cadre.joined).toLocaleDateString()}</TableCell>
                <TableCell className="text-right py-4">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 rounded-full">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
