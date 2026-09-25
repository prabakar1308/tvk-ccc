'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ShieldAlert, History, UserCog, Download, Fingerprint, Clock, Activity } from "lucide-react";

export default function AuditPage() {
  const auditLogs = [
    { id: 'AL-1001', timestamp: '2026-08-15 10:23 AM', userId: 'admin', action: 'CREATE', entity: 'User', details: 'Created new user TVK-26-4552' },
    { id: 'AL-1002', timestamp: '2026-08-15 11:05 AM', userId: 'ramesh_k', action: 'UPDATE', entity: 'Activity', details: 'Updated location for Water Protest' },
    { id: 'AL-1003', timestamp: '2026-08-14 02:15 PM', userId: 'admin', action: 'DELETE', entity: 'Kilai', details: 'Removed inactive Kilai K-092' },
    { id: 'AL-1004', timestamp: '2026-08-14 04:30 PM', userId: 'suresh_b', action: 'CREATE', entity: 'Welfare', details: 'Added new Flood Relief event' },
    { id: 'AL-1005', timestamp: '2026-08-13 09:12 AM', userId: 'admin', action: 'UPDATE', entity: 'Union', details: 'Changed leadership for South Chennai' },
  ];

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary border border-primary/20">CREATE</span>;
      case 'UPDATE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-manjal/20 text-amber-700 dark:text-manjal border border-manjal/20">UPDATE</span>;
      case 'DELETE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">DELETE</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-muted text-muted-foreground border border-border">{action}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold uppercase tracking-wide text-primary">Audit Logs</h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">Monitor system activities, changes, and access records.</p>
        </div>
        <Button variant="outline" className="h-11 px-6 border-primary/30 text-primary hover:bg-primary/5 font-semibold rounded-lg">
          <Download className="mr-2 h-5 w-5" /> Export Logs
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="border-primary/20 shadow-sm bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-md text-primary">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Critical Events</p>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mt-1">12</h2>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 shadow-sm bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-manjal/20 rounded-md text-amber-600 dark:text-manjal">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Events Today</p>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mt-1">1,452</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-sm bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-md text-primary">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Logs</p>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mt-1">45.2K</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg shadow-sm border border-primary/10">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search by User ID, Entity, or Action..." 
            className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-900 border-primary/20 focus-visible:ring-primary/30 rounded-md transition-all"
          />
        </div>
      </div>

      {/* Timeline / Table */}
      <div className="rounded-lg border border-primary/20 bg-card shadow-sm overflow-hidden font-mono text-sm">
        <Table>
          <TableHeader className="bg-primary/5">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-primary py-4 w-[200px]">Timestamp</TableHead>
              <TableHead className="font-semibold text-primary py-4">User ID</TableHead>
              <TableHead className="font-semibold text-primary py-4">Action</TableHead>
              <TableHead className="font-semibold text-primary py-4">Entity</TableHead>
              <TableHead className="font-semibold text-primary py-4 w-1/3">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((log) => (
              <TableRow key={log.id} className="hover:bg-primary/5 transition-colors border-b-primary/10">
                <TableCell className="py-4 text-muted-foreground">{log.timestamp}</TableCell>
                <TableCell className="py-4 font-bold text-foreground">{log.userId}</TableCell>
                <TableCell className="py-4">{getActionBadge(log.action)}</TableCell>
                <TableCell className="py-4 font-semibold text-foreground">{log.entity}</TableCell>
                <TableCell className="py-4 text-muted-foreground truncate max-w-xs" title={log.details}>
                  {log.details}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
