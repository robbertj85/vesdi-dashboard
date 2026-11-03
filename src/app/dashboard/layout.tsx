'use client';

import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { SidebarProvider, useSidebar } from '@/components/layout/sidebar-context';
import { useVesdiStore } from '@/lib/store';
import Link from 'next/link';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DemoCard } from '@/components/upload/demo-card';
import { TourProvider } from '@/components/tour/tour-provider';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { expanded } = useSidebar();

  return (
    <div className="min-h-screen bg-dmi-bg">
      <DashboardSidebar />
      <main className={cn(
        'p-6 transition-all duration-200',
        expanded ? 'ml-64' : 'ml-16'
      )}>
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const years = useVesdiStore((s) => s.years);
  const anprTables = useVesdiStore((s) => s.anprTables);
  const hydrated = useVesdiStore((s) => s._hydrated);
  const hasData = years.length > 0 || anprTables.size > 0;

  // Show loading while IndexedDB data is being rehydrated
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-dmi-bg flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 mx-auto text-dmi-primary/40 animate-spin" />
          <p className="text-sm text-dmi-text/60">Dashboard laden...</p>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="min-h-screen bg-dmi-bg flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Upload className="w-12 h-12 mx-auto text-dmi-primary/40" />
          <h2 className="text-xl font-semibold text-dmi-text">
            Geen data geladen
          </h2>
          <p className="text-sm text-dmi-text/60">
            Upload eerst CBS- of ANPR-bestanden om het dashboard te bekijken
          </p>
          <div className="max-w-md mx-auto text-left">
            <DemoCard compact redirectTo={null} />
          </div>
          <Link href="/">
            <Button variant="outline">
              Naar upload pagina
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <TourProvider>
        <DashboardContent>{children}</DashboardContent>
      </TourProvider>
    </SidebarProvider>
  );
}
