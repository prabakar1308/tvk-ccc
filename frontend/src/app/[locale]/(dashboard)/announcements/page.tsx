'use client';

export default function AnnouncementsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold uppercase tracking-wide text-primary">Announcements</h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">Announcements module coming in the next phase.</p>
        </div>
      </div>
      
      <div className="p-8 text-center border rounded-lg bg-card mt-8">
        <h2 className="text-2xl font-semibold mb-4">Under Construction</h2>
        <p className="text-muted-foreground">The UI for managing Announcements is scheduled for the next phase of development. Stay tuned!</p>
      </div>
    </div>
  );
}
