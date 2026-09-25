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
import { Search, Plus, Heart, IndianRupee, Users, Eye, Edit2 } from "lucide-react";

export default function WelfarePage() {
  const welfarePrograms = [
    { id: 1, title: 'Flood Relief Camp', category: 'Disaster Relief', date: '2026-08-15', amount: 450000, status: 'COMPLETED' },
    { id: 2, title: 'Medical Checkup Drive', category: 'Health', date: '2026-07-22', amount: 120000, status: 'COMPLETED' },
    { id: 3, title: 'Education Material Distribution', category: 'Education', date: '2026-06-10', amount: 75000, status: 'COMPLETED' },
    { id: 4, title: 'Community Feast', category: 'Food Distribution', date: '2026-05-14', amount: 210000, status: 'IN_PROGRESS' },
    { id: 5, title: 'Winter Blanket Distribution', category: 'Relief', date: '2026-01-05', amount: 95000, status: 'PLANNED' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">Completed</span>;
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-yellow-500/20 text-amber-700 dark:text-yellow-400 border border-yellow-500/30">In Progress</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-muted text-muted-foreground border border-border">Planned</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold uppercase tracking-wide text-primary">Welfare</h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">Track social welfare programs, funds, and beneficiaries.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-11 px-6 rounded-lg transition-transform active:scale-95">
          <Plus className="mr-2 h-5 w-5" /> Record Expense
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="border-primary/20 shadow-sm bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-md text-primary">
              <IndianRupee className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Spend (YTD)</p>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mt-1">₹ 28.5L</h2>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 shadow-sm bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-manjal/20 rounded-md text-amber-600 dark:text-manjal">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Beneficiaries</p>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mt-1">45,200</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-sm bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-md text-primary">
              <Heart className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Welfare Drives</p>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mt-1">128</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg shadow-sm border border-primary/10">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search welfare programs..." 
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
              <TableHead className="font-semibold text-primary py-4">Category</TableHead>
              <TableHead className="font-semibold text-primary py-4 text-right">Amount (₹)</TableHead>
              <TableHead className="font-semibold text-primary py-4">Status</TableHead>
              <TableHead className="font-semibold text-primary py-4">Date</TableHead>
              <TableHead className="font-semibold text-primary py-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {welfarePrograms.map((program) => (
              <TableRow key={program.id} className="hover:bg-primary/5 transition-colors group border-b-primary/10">
                <TableCell className="font-bold text-base py-4 text-foreground">{program.title}</TableCell>
                <TableCell className="py-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary shadow-sm">
                    {program.category}
                  </span>
                </TableCell>
                <TableCell className="text-right font-bold py-4 text-foreground">₹ {program.amount.toLocaleString()}</TableCell>
                <TableCell className="py-4">
                  {getStatusBadge(program.status)}
                </TableCell>
                <TableCell className="text-muted-foreground py-4 font-medium">{new Date(program.date).toLocaleDateString()}</TableCell>
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
