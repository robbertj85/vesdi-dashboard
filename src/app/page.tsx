'use client';

import { FileDropZone } from '@/components/upload/file-drop-zone';
import { FileText, Table, Image, BookOpen, ExternalLink, Camera, LogOut } from 'lucide-react';
import { DemoCard } from '@/components/upload/demo-card';
import { InfoTip } from '@/components/ui/info-tip';
import { SECTION_TOOLTIPS } from '@/lib/descriptions';
import { withBase } from '@/lib/base-path';

const FILE_TYPES = [
  {
    icon: Table,
    label: 'Zendingenbestand',
    desc: 'CSV met zendingdata per gemeente',
    color: 'text-dmi-primary',
    bg: 'bg-dmi-primary/8',
  },
  {
    icon: Table,
    label: 'Deelrittenbestand',
    desc: 'CSV met deelritdata per gemeente',
    color: 'text-dmi-orange',
    bg: 'bg-dmi-orange/8',
  },
  {
    icon: FileText,
    label: 'Codetabellen',
    desc: 'CSV/XLSX met gemeente- en klassecodes',
    color: 'text-dmi-teal',
    bg: 'bg-dmi-teal/8',
  },
  {
    icon: BookOpen,
    label: 'VESDI Lookup / NUTS',
    desc: 'XLSX referentietabellen',
    color: 'text-dmi-purple',
    bg: 'bg-dmi-purple/8',
  },
  {
    icon: Image,
    label: 'Gemeente-afbeelding',
    desc: 'PNG/JPG voor het voorblad',
    color: 'text-dmi-green',
    bg: 'bg-dmi-green/8',
  },
  {
    icon: Camera,
    label: 'ANPR bezoekdata',
    desc: 'CSV met ANPR-cameradata (bezoeken)',
    color: 'text-dmi-gold',
    bg: 'bg-dmi-gold/8',
  },
  {
    icon: FileText,
    label: 'ANPR Variabelen',
    desc: 'XLSX met ANPR lookup-tabellen',
    color: 'text-dmi-gold',
    bg: 'bg-dmi-gold/8',
  },
];

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-dmi-bg flex flex-col">
      {/* Top bar */}
      <header className="border-b border-dmi-primary/10 bg-white/60 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <img
            src={withBase('/images/dmi-logo.svg')}
            alt="DMI Ecosysteem"
            className="h-10 w-auto"
          />
          <div className="h-6 w-px bg-dmi-primary/15" />
          <span className="text-sm font-condensed font-semibold text-dmi-primary tracking-wide uppercase">
            VESDI Dashboard
          </span>
          <form action={withBase('/api/auth/logout')} method="post" className="ml-auto">
            <button
              type="submit"
              title={SECTION_TOOLTIPS.logout}
              className="flex items-center gap-1.5 text-xs text-dmi-primary/60 hover:text-dmi-primary transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Uitloggen
            </button>
          </form>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          {/* Hero section */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-condensed font-bold text-dmi-primary mb-3">
              Gemeentelijk VESDI-dashboard
            </h1>
            <p className="text-lg text-dmi-text/60 max-w-2xl mx-auto leading-relaxed">
              Bekijk de demo met data van de gemeente Utrecht, of upload de CBS-bestanden van je eigen gemeente om automatisch een interactief dashboard te genereren met inzichten over stedelijke distributie en logistiek.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload card — takes 2 columns */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg shadow-dmi-primary/5 p-8 space-y-6">
              <DemoCard />
              <div>
                <div className="flex items-center gap-1 mb-3">
                  <h2 className="text-sm font-semibold font-condensed text-dmi-text uppercase tracking-wide">
                    Of upload eigen bestanden
                  </h2>
                  <InfoTip text={SECTION_TOOLTIPS.dropZone} />
                </div>
                <FileDropZone />
              </div>
            </div>

            {/* Info sidebar */}
            <div className="space-y-5">
              {/* Accepted file types */}
              <div className="bg-white rounded-2xl shadow-lg shadow-dmi-primary/5 p-6">
                <div className="flex items-center gap-1 mb-4">
                  <h3 className="text-sm font-semibold font-condensed text-dmi-text uppercase tracking-wide">
                    Ondersteunde bestanden
                  </h3>
                  <InfoTip text={SECTION_TOOLTIPS.supportedFiles} />
                </div>
                <div className="space-y-3">
                  {FILE_TYPES.map((ft) => (
                    <div key={ft.label} className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-lg ${ft.bg} shrink-0`}>
                        <ft.icon className={`w-4 h-4 ${ft.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-dmi-text leading-tight">
                          {ft.label}
                        </p>
                        <p className="text-xs text-dmi-text/50 leading-tight">
                          {ft.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* How it works */}
              <div className="bg-white rounded-2xl shadow-lg shadow-dmi-primary/5 p-6">
                <div className="flex items-center gap-1 mb-4">
                  <h3 className="text-sm font-semibold font-condensed text-dmi-text uppercase tracking-wide">
                    Hoe werkt het?
                  </h3>
                  <InfoTip text={SECTION_TOOLTIPS.howItWorks} />
                </div>
                <ol className="space-y-3 text-sm text-dmi-text/70">
                  <li className="flex gap-3">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-dmi-primary text-white text-xs flex items-center justify-center font-bold">1</span>
                    <span>Sleep alle CBS-bestanden van je gemeente in het uploadveld</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-dmi-primary text-white text-xs flex items-center justify-center font-bold">2</span>
                    <span>Bestanden worden automatisch herkend en verwerkt</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-dmi-primary text-white text-xs flex items-center justify-center font-bold">3</span>
                    <span>Klik op &ldquo;Dashboard genereren&rdquo; om de resultaten te bekijken</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-dmi-primary/10 bg-white/40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-xs text-dmi-text/40">
              VESDI Dashboard &mdash; AGPL-3.0 License
            </p>
            <span className="text-dmi-text/20">|</span>
            <a
              href="https://github.com/robbertj85/vesdi-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-dmi-primary/50 hover:text-dmi-primary transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              GitHub
            </a>
            <a
              href="https://dmi-ecosysteem.nl"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-dmi-primary/50 hover:text-dmi-primary transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              dmi-ecosysteem.nl
            </a>
            <a
              href="https://www.cbs.nl/nl-nl/dossier/vesdi"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-dmi-primary/50 hover:text-dmi-primary transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              CBS VESDI
            </a>
          </div>
          <p className="text-xs text-dmi-text/30">
            v1.0
          </p>
        </div>
      </footer>
    </div>
  );
}
