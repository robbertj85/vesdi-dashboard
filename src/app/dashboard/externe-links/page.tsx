'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { PAGE_COLORS } from '@/lib/colors';
import { PAGE_DESCRIPTIONS, PAGE_HELP } from '@/lib/descriptions';
import { Building2, BarChart3, FolderOpen, Package, Target, ExternalLink } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const LINKS: { title: string; description: string; url: string; icon: LucideIcon }[] = [
  {
    title: 'DMI Ecosysteem',
    description: 'Dutch Metropolitan Innovations - platform voor duurzame stedelijke logistiek',
    url: 'https://dmi-ecosysteem.nl',
    icon: Building2,
  },
  {
    title: 'CBS VESDI dossier',
    description: 'Centraal Bureau voor de Statistiek - VESDI dataplatform en documentatie',
    url: 'https://www.cbs.nl/nl-nl/dossier/vesdi',
    icon: BarChart3,
  },
  {
    title: 'VESDI achtergrond',
    description: 'Informatie over het VESDI-project en microdatabestanden',
    url: 'https://www.cbs.nl/nl-nl/onze-diensten/maatwerk-en-microdata/microdata-zelf-onderzoek-doen/microdatabestanden/vesdi-verkeersintensiteiten-stedelijke-distributie',
    icon: FolderOpen,
  },
  {
    title: 'Post- en pakketmonitor',
    description: 'ACM monitor voor post- en pakketstromen in Nederland',
    url: 'https://www.acm.nl/nl/onderwerpen/telecommunicatie/post/post-en-pakketmonitor',
    icon: Package,
  },
  {
    title: 'VESDI maatwerkverzoeken',
    description: 'Aanvullende VESDI-data op maat aanvragen bij het CBS',
    url: 'https://www.cbs.nl/nl-nl/onze-diensten/maatwerk-en-microdata/maatwerk',
    icon: Target,
  },
];

export default function ExterneLinkPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Externe links"
        tooltip={PAGE_HELP.externeLinks}
        color={PAGE_COLORS.externeLinks.accent}
        description={PAGE_DESCRIPTIONS.externeLinks}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {LINKS.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Card className="p-6 h-full hover:shadow-lg transition-shadow cursor-pointer group">
              <link.icon className="w-8 h-8 mb-4 text-dmi-text/60" />
              <h3 className="font-semibold text-dmi-text mb-2 group-hover:text-dmi-purple transition-colors">
                {link.title}
              </h3>
              <p className="text-sm text-dmi-text/60 mb-4">
                {link.description}
              </p>
              <div className="flex items-center gap-1 text-xs text-dmi-purple">
                <ExternalLink className="w-3 h-3" />
                <span>Openen</span>
              </div>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
