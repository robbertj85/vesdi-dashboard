'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Info,
  TrendingUp,
  Map,
  Truck,
  Package,
  Globe,
  Route,
  BarChart3,
  Link2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Camera,
  Zap,
  Building2,
  Users,
  Clock,
  FlaskConical,
  LogOut,
  GraduationCap,
  ClipboardCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DMI_COLORS } from '@/lib/colors';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from './sidebar-context';
import { useVesdiStore } from '@/lib/store';
import { InfoTip } from '@/components/ui/info-tip';
import { SECTION_TOOLTIPS } from '@/lib/descriptions';
import { useTour } from '@/components/tour/tour-provider';
import { withBase } from '@/lib/base-path';

const GENERAL_NAV_ITEMS = [
  { href: '/dashboard/voorblad', icon: Home, label: 'Voorblad', desc: 'Titelpagina en samenvatting', color: DMI_COLORS.orange },
  { href: '/dashboard/introductie', icon: Info, label: 'Introductie', desc: 'Uitleg dashboard en navigatie', color: DMI_COLORS.primary },
  { href: '/dashboard/enquete', icon: ClipboardCheck, label: 'Enquête', desc: 'Geef je oordeel over de waarde', color: DMI_COLORS.gold },
];

const WVE_NAV_ITEMS = [
  { href: '/dashboard/trends', icon: TrendingUp, label: 'Trends', desc: 'Ontwikkeling over meerdere jaren', color: DMI_COLORS.orange },
  { href: '/dashboard/zendingen-overzicht', icon: Map, label: 'Zendingen overzicht', desc: 'NUTS3-choropleet van alle zendingen', color: DMI_COLORS.primary },
  { href: '/dashboard/nationale-zendingen', icon: Package, label: 'Nationale zendingen', desc: 'Gewicht, klassen en euronorm binnenland', color: DMI_COLORS.primary },
  { href: '/dashboard/internationale-zendingen', icon: Globe, label: 'Int. zendingen', desc: 'Import/export per land en klasse', color: DMI_COLORS.green },
  { href: '/dashboard/nationale-deelritten', icon: Truck, label: 'Nationale deelritten', desc: 'Ritten, beladingsgraad en voertuigsoort', color: DMI_COLORS.primary },
  { href: '/dashboard/nationale-deelritten-postcode', icon: MapPin, label: 'Deelritten postcode', desc: 'Laad- en loslocaties per PC4-gebied', color: DMI_COLORS.primary },
  { href: '/dashboard/routekaart', icon: Route, label: 'Routekaart', desc: 'Vermoedelijke routes op het wegennet', color: DMI_COLORS.primary },
  { href: '/dashboard/internationale-deelritten-overzicht', icon: Globe, label: 'Int. deelritten overzicht', desc: 'NUTS3-overzicht grensoverschrijdend', color: DMI_COLORS.mauve },
  { href: '/dashboard/internationale-deelritten', icon: BarChart3, label: 'Int. deelritten', desc: 'Voertuigsoort en gewichtsklassen', color: DMI_COLORS.mauve },
];

const SYSTEM_NAV_ITEMS = [
  { href: '/dashboard/externe-links', icon: Link2, label: 'Externe links', desc: 'CBS, VESDI en DMI bronnen', color: DMI_COLORS.purple },
  { href: '/dashboard/definities', icon: BookOpen, label: 'Definities', desc: 'Begrippen en classificaties', color: DMI_COLORS.green },
  { href: '/dashboard/data-volledigheid', icon: CheckCircle, label: 'Data volledigheid', desc: 'Dekking per kolom en jaar', color: DMI_COLORS.green },
];

const ANPR_NAV_ITEMS = [
  { href: '/dashboard/anpr-overzicht', icon: Camera, label: 'Overzicht', desc: 'Bezoeken, voertuigen en emissie', color: DMI_COLORS.orange },
  { href: '/dashboard/anpr-emissie', icon: Zap, label: 'Emissieklasse', desc: 'Emissie- en voertuigtrends', color: DMI_COLORS.orange },
  { href: '/dashboard/anpr-bedrijven', icon: Building2, label: 'Bedrijfstakken', desc: 'SBI-groepen en bedrijfsgrootte', color: DMI_COLORS.orange },
  { href: '/dashboard/anpr-bezoekers', icon: Users, label: 'Bezoekers', desc: 'Bezoekerstype en herkomst', color: DMI_COLORS.orange },
  { href: '/dashboard/anpr-tijdpatronen', icon: Clock, label: 'Tijdpatronen', desc: 'Dag- en weekpatronen', color: DMI_COLORS.orange },
  { href: '/dashboard/anpr-analyse', icon: FlaskConical, label: 'Analyse', desc: 'Wagenpark ontwikkeling - extrapolaties', color: DMI_COLORS.orange },
];

type NavItem = { href: string; icon: React.ComponentType<{ className?: string }>; label: string; desc: string; color: string };

function renderNavItem(item: NavItem, pathname: string, expanded: boolean) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = item.icon;

  const linkEl = (
    <Link
      href={item.href}
      className={cn(
        'flex rounded-lg transition-colors',
        expanded
          ? 'items-start gap-2.5 px-2.5 py-1.5'
          : 'items-center w-10 h-10 justify-center',
        isActive
          ? 'text-white'
          : 'text-white/60 hover:text-white hover:bg-white/10'
      )}
      style={isActive ? { backgroundColor: DMI_COLORS.gold + '30', borderLeft: `3px solid ${DMI_COLORS.gold}` } : undefined}
    >
      <Icon className={cn('w-5 h-5 shrink-0', expanded && 'mt-0.5')} />
      {expanded && (
        <div className="min-w-0">
          <span className="text-sm font-medium truncate block">{item.label}</span>
          <span className="text-[11px] text-white/40 truncate block">{item.desc}</span>
        </div>
      )}
    </Link>
  );

  if (expanded) {
    return <div key={item.href}>{linkEl}</div>;
  }

  return (
    <Tooltip key={item.href}>
      <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
      <TooltipContent side="right">
        <span className="font-semibold block">{item.label}</span>
        <span className="opacity-80">{item.desc}</span>
      </TooltipContent>
    </Tooltip>
  );
}

function SectionLabel({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div className="px-2.5 py-1 flex items-center gap-1">
      <span className="text-[10px] uppercase tracking-wider font-semibold text-white/40">
        {label}
      </span>
      <InfoTip text={tooltip} side="right" className="text-white/30 hover:text-white/70" />
    </div>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { expanded, toggle } = useSidebar();
  const hasAnprData = useVesdiStore((s) => s.anprTables.size > 0);
  const tour = useTour();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-dmi-primary flex flex-col py-4 z-50 transition-all duration-200',
        expanded ? 'w-64' : 'w-16'
      )}
    >
      {/* DMI logo */}
      <div className={cn('flex items-center mb-2', expanded ? 'px-3' : 'justify-center')}>
        <img
          src={withBase('/images/dmi-logo-diap.svg')}
          alt="DMI Ecosysteem"
          className={cn(
            'object-contain transition-all duration-200',
            expanded ? 'h-12' : 'w-10 h-10'
          )}
        />
      </div>

      {/* Back to upload */}
      <div className={cn('flex', expanded ? 'px-2' : 'justify-center')}>
        {expanded ? (
          <Link
            href="/"
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 shrink-0" />
            <span className="text-sm truncate">Terug naar upload</span>
          </Link>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/"
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Terug naar upload</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className={cn('border-t border-white/20 my-2', expanded ? 'mx-3' : 'mx-4')} />

      {/* Nav items */}
      <nav data-tour="sidebar-nav" className={cn(
        // Fade the last few pixels so it is visible that the list scrolls
        'flex-1 flex flex-col gap-0.5 overflow-y-auto pb-4 [mask-image:linear-gradient(to_bottom,black_calc(100%-28px),transparent)]',
        expanded ? 'px-2' : 'items-center'
      )}>
        {GENERAL_NAV_ITEMS.map((item) => renderNavItem(item, pathname, expanded))}

        {/* Wegvervoersenquete section */}
        <div className={cn('border-t border-white/20 my-2', expanded ? 'mx-1' : 'mx-2')} />
        {expanded && <SectionLabel label="Wegvervoersenquête" tooltip={SECTION_TOOLTIPS.navWegvervoer} />}
        {WVE_NAV_ITEMS.map((item) => renderNavItem(item, pathname, expanded))}

        {/* ANPR section */}
        {hasAnprData && (
          <>
            <div className={cn('border-t border-white/20 my-2', expanded ? 'mx-1' : 'mx-2')} />
            {expanded && <SectionLabel label="ANPR" tooltip={SECTION_TOOLTIPS.navAnpr} />}
            {ANPR_NAV_ITEMS.map((item) => renderNavItem(item, pathname, expanded))}
          </>
        )}

        {/* Systeem section */}
        <div className={cn('border-t border-white/20 my-2', expanded ? 'mx-1' : 'mx-2')} />
        {expanded && <SectionLabel label="Systeem" tooltip={SECTION_TOOLTIPS.navSysteem} />}
        {SYSTEM_NAV_ITEMS.map((item) => renderNavItem(item, pathname, expanded))}
      </nav>

      {/* Guided tour */}
      <div className={cn('mt-2', expanded ? 'px-2' : 'flex justify-center')}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={tour.start}
              className={cn(
                'flex items-center rounded-lg text-dmi-gold hover:text-white hover:bg-white/10 transition-colors',
                expanded ? 'w-full gap-2.5 px-2.5 py-2' : 'w-10 h-10 justify-center'
              )}
            >
              <GraduationCap className="w-5 h-5 shrink-0" />
              {expanded && <span className="text-sm font-medium">Rondleiding</span>}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[240px]">
            Interactieve rondleiding langs de belangrijkste onderdelen van het dashboard
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Logout + collapse, side by side when expanded */}
      <div className={cn('flex', expanded ? 'px-2 gap-1' : 'flex-col items-center')}>
        <form action={withBase('/api/auth/logout')} method="post" className={cn(expanded && 'flex-1')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="submit"
                className={cn(
                  'flex items-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors',
                  expanded ? 'w-full gap-2.5 px-2.5 py-2' : 'w-10 h-10 justify-center'
                )}
              >
                <LogOut className="w-5 h-5 shrink-0" />
                {expanded && <span className="text-sm">Uitloggen</span>}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[240px]">{SECTION_TOOLTIPS.logout}</TooltipContent>
          </Tooltip>
        </form>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggle}
              aria-label={expanded ? 'Zijbalk inklappen' : 'Zijbalk uitklappen'}
              className="flex items-center justify-center w-10 h-10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              {expanded ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{expanded ? 'Zijbalk inklappen' : 'Zijbalk uitklappen'}</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
