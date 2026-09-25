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
import { Search, Plus, Calendar, Zap, AlertTriangle, Eye, Edit2, Users, Megaphone } from "lucide-react";

export default function ActivitiesPage() {
  const activities = [
    { id: 1, title: 'Monthly Strategy Meeting', type: 'MEETING', date: '2026-08-01', organizedBy: 'South Chennai Union', participants: 45 },
    { id: 2, title: 'Membership Drive', type: 'CAMPAIGN', date: '2026-08-05', organizedBy: 'North Chennai Union', participants: 120 },
    { id: 3, title: 'Public Rally', type: 'GENERAL', date: '2026-08-10', organizedBy: 'South Chennai Union', participants: 850 },
    { id: 4, title: 'Water Crisis Protest', type: 'PROTEST', date: '2026-08-12', organizedBy: 'South Chennai Union', participants: 320 },
    { id: 5, title: 'Flood Relief Camp', type: 'WELFARE', date: '2026-08-15', organizedBy: 'North Chennai Union', participants: 65 },
  ];

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'WELFARE':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">Welfare</span>;
      case 'MEETING':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-manjal text-black border border-manjal/20">Meeting</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-muted text-muted-foreground border border-border">Campaign</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold uppercase tracking-wide text-primary">Activities</h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">Track grassroots initiatives, meetings, and campaigns.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-11 px-6 rounded-lg transition-transform active:scale-95">
          <Plus className="mr-2 h-5 w-5" /> Log Activity
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="border-primary/20 shadow-sm bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-md text-primary">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Activities</p>
              <h2 className="text-4xl font-heading font-bold text-foreground mt-1">1,204</h2>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 shadow-sm bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-manjal/20 rounded-md text-amber-600 dark:text-manjal">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">People Reached</p>
              <h2 className="text-4xl font-heading font-bold text-foreground mt-1">45.2K</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-sm bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-md text-primary">
              <Megaphone className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Campaigns</p>
              <h2 className="text-4xl font-heading font-bold text-foreground mt-1">12</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg shadow-sm border border-primary/10">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search activities..." 
            className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-900 border-primary/20 focus-visible:ring-primary/30 rounded-md transition-all"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="h-11 rounded-md px-6 font-medium border-primary/20 text-primary hover:bg-primary/5">Export CSV</Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border border-primary/20 bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-primary/5">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-primary py-4">Title</TableHead>
              <TableHead className="font-semibold text-primary py-4">Type</TableHead>
              <TableHead className="font-semibold text-primary py-4">Organized By</TableHead>
              <TableHead className="font-semibold text-primary py-4 text-right">Participants</TableHead>
              <TableHead className="font-semibold text-primary py-4">Date</TableHead>
              <TableHead className="font-semibold text-primary py-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.map((activity) => (
              <TableRow key={activity.id} className="hover:bg-primary/5 transition-colors group border-b-primary/10">
                <TableCell className="font-bold text-base py-4 text-foreground">{activity.title}</TableCell>
                <TableCell className="py-4">
                  {getTypeBadge(activity.type)}
                </TableCell>
                <TableCell className="font-medium py-4 text-muted-foreground">{activity.organizedBy}</TableCell>
                <TableCell className="text-right font-medium py-4">{activity.participants}</TableCell>
                <TableCell className="text-muted-foreground py-4 font-medium">{new Date(activity.date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right py-4">
                  <div className="flex justify-end gap-2 transition-opacity">
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
