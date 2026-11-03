'use client';

import { useVesdiStore } from '@/lib/store';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { PAGE_COLORS, DMI_COLORS } from '@/lib/colors';
import { PAGE_DESCRIPTIONS, PAGE_HELP, SECTION_TOOLTIPS } from '@/lib/descriptions';
import { InfoTip, SectionTitle } from '@/components/ui/info-tip';
import { useTour } from '@/components/tour/tour-provider';
import { useHasAnprData } from '@/lib/anpr-selectors';
import Link from 'next/link';
import {
  TrendingUp,
  Map,
  Package,
  Globe,
  Truck,
  MapPin,
  Route,
  BarChart3,
  Link2,
  BookOpen,
  CheckCircle,
  Camera,
  Zap,
  Building2,
  Users,
  Clock,
  FlaskConical,
  GraduationCap,
} from 'lucide-react';
import { municipalityName } from '@/lib/format';

const WVE_BUTTONS = [
  { href: '/dashboard/trends', label: 'Trends', icon: TrendingUp },
  { href: '/dashboard/zendingen-overzicht', label: 'Zendingen overzicht', icon: Map },
  { href: '/dashboard/nationale-zendingen', label: 'Nationale zendingen', icon: Package },
  { href: '/dashboard/internationale-zendingen', label: 'Internationale zendingen', icon: Globe },
  { href: '/dashboard/nationale-deelritten', label: 'Nationale deelritten', icon: Truck },
  { href: '/dashboard/nationale-deelritten-postcode', label: 'Deelritten postcode', icon: MapPin },
  { href: '/dashboard/routekaart', label: 'Routekaart', icon: Route },
  { href: '/dashboard/internationale-deelritten-overzicht', label: 'Int. deelritten overzicht', icon: Globe },
  { href: '/dashboard/internationale-deelritten', label: 'Int. deelritten', icon: BarChart3 },
];

const ANPR_BUTTONS = [
  { href: '/dashboard/anpr-overzicht', label: 'Overzicht', icon: Camera },
  { href: '/dashboard/anpr-emissie', label: 'Emissieklasse', icon: Zap },
  { href: '/dashboard/anpr-bedrijven', label: 'Bedrijfstakken', icon: Building2 },
  { href: '/dashboard/anpr-bezoekers', label: 'Bezoekers', icon: Users },
  { href: '/dashboard/anpr-tijdpatronen', label: 'Tijdpatronen', icon: Clock },
  { href: '/dashboard/anpr-analyse', label: 'Analyse', icon: FlaskConical },
];

const SYSTEM_BUTTONS = [
  { href: '/dashboard/externe-links', label: 'Externe links', icon: Link2 },
  { href: '/dashboard/definities', label: 'Definities', icon: BookOpen },
  { href: '/dashboard/data-volledigheid', label: 'Data volledigheid', icon: CheckCircle },
];

function NavSection({ title, tooltip, color, items }: { title: string; tooltip: string; color: string; items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] }) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-2">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-dmi-text/40">{title}</p>
        <InfoTip text={tooltip} />
      </div>
      {items.map((btn) => {
        const Icon = btn.icon;
        return (
          <Link key={btn.href} href={btn.href}>
            <div
              className="flex items-center gap-3 px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity mb-1"
              style={{ backgroundColor: color }}
            >
              <Icon className="w-4 h-4" />
              {btn.label}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function IntroductiePage() {
  const municipality = useVesdiStore((s) => s.municipality);
  const years = useVesdiStore((s) => s.years);
  const anprYear = useVesdiStore((s) => s.anprYear);
  const hasAnpr = useHasAnprData();
  const tour = useTour();
  const sortedYears = [...years].sort((a, b) => a - b);

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Gemeentelijk VESDI-dashboard"
        tooltip={PAGE_HELP.introductie}
        color={PAGE_COLORS.introductie.accent}
        description={PAGE_DESCRIPTIONS.introductie}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main text */}
        <div className="lg:col-span-2 space-y-6">
          <Card data-tour="intro-text" className="p-6">
            <div className="space-y-5 text-sm text-dmi-text/80 leading-relaxed">
              <p>
                In 2021 startte het CBS, in opdracht van het Ministerie van I&W en in
                samenwerking met de Topsector Logistiek, met de ontwikkeling van het
                dataplatform VESDI (Vehicle Emission Shipment Data Interface). E&eacute;n
                van de thema&apos;s die hierin centraal staat, is het wegvervoer van goederen.
              </p>

              <div>
                <SectionTitle title="VESDI zendingen en deelritten" tooltip={SECTION_TOOLTIPS.introVesdi} className="mb-1" />
                <p>
                  VESDI verzamelt gegevens over goederenstromen in twee datasets. De eerste
                  is op zendingniveau, waarbij een zending het verplaatsen van goederen van
                  A naar B betreft. Deze dataset maakt het mogelijk goederen te traceren. De
                  tweede dataset is op deelritniveau: dit betreft het segment van de rit
                  tussen twee stops van het voertuig. Deze gegevens zijn waardevol voor het
                  analyseren van voertuigbewegingen. Beide datasets bevatten informatie zoals
                  stadslogistieke klasse, laad- en loslocaties (inclusief of deze zich in
                  emissiezones bevinden), beladingsgraad, voertuigtype, brandstofsoort en
                  emissieklasse.
                </p>
              </div>

              <div>
                <SectionTitle title="ANPR cameraregistraties" tooltip={SECTION_TOOLTIPS.introAnpr} className="mb-1" />
                <p>
                  Naast de VESDI-data ondersteunt dit dashboard ook ANPR-data (Automatic
                  Number Plate Recognition). ANPR-camera&apos;s registreren kentekens van
                  passerende voertuigen op vaste locaties binnen de gemeente. Door koppeling
                  met het RDW-register worden per bezoek de voertuigcategorie (N1 bestelwagen,
                  N2/N3 vrachtwagen) en emissieklasse (Euro 0-5, Euro 6, zero-emissie)
                  bepaald. De ANPR-data geeft inzicht in het aantal bezoeken, de
                  samenstelling van het wagenpark, herkomstprovincie, bedrijfstak (SBI) en
                  tijdspatronen van vrachtverkeer.
                </p>
              </div>

              <div>
                <SectionTitle title="Dataverzameling" tooltip={SECTION_TOOLTIPS.introDataverzameling} className="mb-1" />
                <p>
                  De VESDI dataset over goederenvervoer over de weg is grotendeels gebaseerd
                  op een steekproef waarbij kentekens van voertuigen worden geselecteerd. Dit
                  gebeurt op basis van verschillende kenmerken, zoals laadvermogen en
                  voertuigtype. Elk jaar wordt van een aantal kentekens gedurende &eacute;&eacute;n
                  week data verzameld. De data wordt verzameld via een internetvragenlijst en
                  automatisch via Transport Management Systemen van bedrijven. De meeste
                  gegevens, zoals de locatie van goederen en de route, worden automatisch
                  gecodeerd. Slechts een klein deel van de data wordt handmatig gecontroleerd
                  en gecorrigeerd.
                </p>
                <p className="mt-3">
                  Dit dashboard bevat geen bestelbusdata in de VESDI-sectie. De ANPR-data
                  bevat wel bestelwagens (N1-categorie).
                </p>
              </div>

              <div>
                <SectionTitle title="Verslagperiode" tooltip={SECTION_TOOLTIPS.introVerslagperiode} className="mb-1" />
                <p>
                  {sortedYears.length > 0 && (
                    <>
                      Voor de Wegvervoersenquête is data van{' '}
                      {sortedYears.join(', ')} gebruikt.
                    </>
                  )}
                  {sortedYears.length > 1 && (
                    <> De bestanden betreffende{' '}
                    {sortedYears.slice(1).join(' en ')}{' '}
                    bevatten alleen informatie over vervoersbewegingen waarvan de los- en/of
                    laadlocatie zich in de gemeente{' '}
                    <strong>
                      {municipalityName(municipality?.name, 'Onbekend')} (gemeentecode{' '}
                      {municipality?.code != null ? String(municipality.code).padStart(4, '0') : '????'})
                    </strong>{' '}
                    bevindt.</>
                  )}
                  {sortedYears.length === 1 && (
                    <> De bestanden bevatten informatie over vervoersbewegingen waarvan de
                    los- en/of laadlocatie zich in de gemeente{' '}
                    <strong>
                      {municipalityName(municipality?.name, 'Onbekend')} (gemeentecode{' '}
                      {municipality?.code != null ? String(municipality.code).padStart(4, '0') : '????'})
                    </strong>{' '}
                    bevindt.</>
                  )}
                  {hasAnpr && (
                    <> De ANPR-data betreft het jaar {anprYear ?? '...'}.</>
                  )}
                </p>
                <p className="mt-3">
                  Automatisch zal de data van het meest recente jaar getoond worden. Het
                  filter linksbovenin op pagina&apos;s met data kan gebruikt worden om dit
                  aan te passen.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Navigation buttons */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => tour.start()}
            className="w-full text-left rounded-xl border-2 border-dmi-gold bg-dmi-gold/10 hover:bg-dmi-gold/20 transition-colors p-4 flex items-start gap-3"
          >
            <GraduationCap className="w-6 h-6 text-dmi-gold shrink-0 mt-0.5" />
            <span>
              <span className="block font-condensed font-bold text-dmi-primary">Start de rondleiding</span>
              <span className="block text-xs text-dmi-text/60 mt-0.5">
                Twee minuten langs de belangrijkste pagina&apos;s, met de Utrecht-data als voorbeeld.
              </span>
            </span>
          </button>

          <div className="flex items-center gap-1">
            <p className="text-sm font-semibold text-dmi-table-accent">
              Dashboard pagina&apos;s
            </p>
            <InfoTip text={SECTION_TOOLTIPS.introNav} />
          </div>

          <NavSection title="Wegvervoersenquête" tooltip={SECTION_TOOLTIPS.navWegvervoer} color={DMI_COLORS.primary} items={WVE_BUTTONS} />

          {hasAnpr && (
            <NavSection title="ANPR" tooltip={SECTION_TOOLTIPS.navAnpr} color={DMI_COLORS.orange} items={ANPR_BUTTONS} />
          )}

          <NavSection title="Systeem" tooltip={SECTION_TOOLTIPS.navSysteem} color={DMI_COLORS.purple} items={SYSTEM_BUTTONS} />
        </div>
      </div>
    </div>
  );
}
