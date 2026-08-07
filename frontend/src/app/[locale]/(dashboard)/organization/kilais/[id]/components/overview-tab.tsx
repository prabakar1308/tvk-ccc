'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

export function OverviewTab({ kilaiId }: { kilaiId: string }) {
  const stats = [
    { title: 'Total Cadres', value: '1,250', icon: Users, color: 'text-primary' },
    { title: 'Booth Count', value: '15', icon: FileText, color: 'text-blue-500' },
    { title: 'Completed Tasks', value: '84', icon: CheckCircle2, color: 'text-green-500' },
    { title: 'Pending Issues', value: '3', icon: AlertTriangle, color: 'text-yellow-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-primary/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card className="border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-primary">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-start border-b border-border pb-3">
                <div>
                  <p className="font-semibold text-foreground">General Cadre Meeting</p>
                  <p className="text-sm text-muted-foreground">Discussed upcoming events</p>
                </div>
                <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">2 days ago</span>
              </div>
              <div className="flex justify-between items-start border-b border-border pb-3">
                <div>
                  <p className="font-semibold text-foreground">Blood Donation Camp</p>
                  <p className="text-sm text-muted-foreground">150 participants</p>
                </div>
                <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">1 week ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card className="border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-primary">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <div>
                  <p className="font-semibold text-foreground">Verify New Cadre Registrations</p>
                  <p className="text-xs text-muted-foreground text-red-500">Overdue by 1 day</p>
                </div>
              </div>
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div>
                  <p className="font-semibold text-foreground">Submit Monthly Report</p>
                  <p className="text-xs text-muted-foreground">Due in 3 days</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
