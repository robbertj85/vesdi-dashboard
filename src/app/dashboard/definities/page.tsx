'use client';

import { PageHeader } from '@/components/layout/page-header';
import { PAGE_HELP } from '@/lib/descriptions';
import { Card } from '@/components/ui/card';
import { PAGE_COLORS, DMI_COLORS } from '@/lib/colors';

const DEFINITIONS = [
  {
    term: 'Zending',
    description:
      'Een individueel pakket of goederenstroom van herkomst (laadlocatie) naar bestemming (loslocatie). Eén zending kan meerdere deelritten omvatten.',
  },
  {
    term: 'Deelrit',
    description:
      'Een individuele vervoersbeweging door één voertuig. Eén rit kan meerdere deelritten bevatten (bijv. meerdere stops).',
  },
  {
    term: 'Stadslogistieke klasse',
    description:
      'CBS-classificatie van het type stadsdistributie, bijvoorbeeld "Retail (food)", "Post en pakketten", "Bouw (gebouwen, wegen)", etc.',
  },
  {
    term: 'Euronorm',
    description:
      'Europese emissieclassificatie voor voertuigen. Euro 6 is de meest recente en schoonste norm. Euro 0-5 zijn oudere, meer vervuilende classificaties.',
  },
  {
    term: 'Emissiezone',
    description:
      'Een geografisch afgebakend gebied (zero-emissiezone) waar beperkingen gelden voor vervuilende voertuigen. Gebaseerd op PC6-toewijzing.',
  },
  {
    term: 'Bruto gewicht',
    description:
      'Het totale gewicht van de lading in kilogram, inclusief verpakking.',
  },
  {
    term: 'Beladingsgraad',
    description:
      'Het percentage van het beschikbare laadvermogen van een voertuig dat daadwerkelijk wordt benut. Een gewogen gemiddelde over alle deelritten.',
  },
  {
    term: 'NUTS3',
    description:
      'Europees regionaal indelingsniveau 3 (Nomenclature of Territorial Units for Statistics). In Nederland correspondeert NUTS3 met COROP-regio\'s.',
  },
  {
    term: 'PC4 / PC6',
    description:
      'Postcode op 4-cijfer of 6-cijfer niveau. PC4 geeft een groter gebied aan, PC6 is specifiek tot straatniveau.',
  },
  {
    term: 'ROI (Region of Interest)',
    description:
      'De gemeente waarvoor het dashboard is gegenereerd. Gedetecteerd via de dummy_laadInROI en dummy_losInROI kolommen in de data.',
  },
  {
    term: 'Nationaal',
    description:
      'Een zending of deelrit waarbij zowel de laad- als loslocatie in Nederland liggen (LaadLand = NL en LosLand = NL).',
  },
  {
    term: 'Internationaal',
    description:
      'Een zending of deelrit waarbij de laad- of loslocatie buiten Nederland ligt.',
  },
  {
    term: 'Import',
    description:
      'Een internationale zending/deelrit waarbij de laadlocatie in het buitenland ligt (goederen komen Nederland binnen).',
  },
  {
    term: 'Export',
    description:
      'Een internationale zending/deelrit waarbij de loslocatie in het buitenland ligt (goederen verlaten Nederland).',
  },
  {
    term: 'Lege deelrit',
    description:
      'Een deelrit waarbij het voertuig zonder lading rijdt. Wordt gemeten via het veld aantalLegeDeelritten.',
  },
  {
    term: 'Brandstofsoort',
    description:
      'Het type brandstof dat het voertuig gebruikt, zoals diesel, benzine, elektrisch of aardgas.',
  },
  {
    term: 'Voertuigsoort (RDW)',
    description:
      'Classificatie van het voertuigtype volgens de Rijksdienst voor het Wegverkeer, zoals bestelwagen, trekker of vrachtwagen.',
  },
  {
    term: 'Max toegestaan gewicht',
    description:
      'Het maximaal toegestane gewicht van het voertuig inclusief lading, ingedeeld in klassen.',
  },
];

export default function DefinitiesPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Definities"
        tooltip={PAGE_HELP.definities}
        color={DMI_COLORS.green}
        description="Verklarende woordenlijst van begrippen in het VESDI-dashboard."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEFINITIONS.map((def) => (
          <Card key={def.term} className="p-4">
            <h3 className="text-sm font-bold text-dmi-text mb-1">
              {def.term}
            </h3>
            <p className="text-xs text-dmi-text/70 leading-relaxed">
              {def.description}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
