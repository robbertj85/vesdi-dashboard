/**
 * Steps of the interactive walkthrough ("Rondleiding").
 *
 * - `page`: route the step lives on; the tour navigates there first.
 * - `target`: value of a `data-tour="…"` attribute to spotlight. Omit for a
 *   centred card. If the element does not appear (e.g. no data for it), the
 *   step falls back to a centred card.
 * - `requires`: only include the step when that dataset is loaded.
 */
export interface TourStep {
  id: string;
  page?: string;
  target?: string;
  title: string;
  body: string;
  requires?: 'anpr' | 'vesdi';
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welkom',
    title: 'Welkom bij het VESDI-dashboard',
    body:
      'Deze rondleiding laat in ongeveer twee minuten zien wat CBS-goederenvervoerdata (VESDI) en ANPR-cameradata vertellen over stadslogistiek, aan de hand van de gemeente Utrecht. Gebruik de pijltjestoetsen of de knoppen hieronder.',
  },
  {
    id: 'navigatie',
    page: '/dashboard/voorblad',
    target: 'sidebar-nav',
    title: 'Navigatie',
    body:
      "Links staan alle pagina's, gegroepeerd per databron: de Wegvervoersenquête (VESDI), ANPR-cameraregistraties en systeempagina's zoals definities en datakwaliteit.",
  },
  {
    id: 'introductie',
    page: '/dashboard/introductie',
    target: 'intro-text',
    title: 'Wat is VESDI?',
    body:
      'VESDI kent twee perspectieven: zendingen (goederen van A naar B) en deelritten (de rit van een vrachtwagen tussen twee stops). Samen laten ze zien wát er vervoerd wordt én hoe de voertuigen rijden.',
  },
  {
    id: 'paginakop',
    page: '/dashboard/trends',
    target: 'page-header',
    title: 'Uitleg op elke pagina',
    body:
      'Elke pagina begint met een korte omschrijving. Achter het vraagteken (?) staat hoe u de pagina leest; ook elke grafiek, kaart, filter en kerncijfer heeft zo’n vraagteken.',
  },
  {
    id: 'trends',
    page: '/dashboard/trends',
    target: 'trend-charts',
    title: 'Ontwikkeling door de jaren',
    body:
      'De trendpagina zet 2021, 2022 en 2023 naast elkaar: aantallen deelritten en zendingen, het aandeel Euro-6 voertuigen en de beladingsgraad per stadslogistieke klasse. Beweeg over een grafiek voor de exacte waarden.',
    requires: 'vesdi',
  },
  {
    id: 'filters',
    page: '/dashboard/nationale-deelritten',
    target: 'filters',
    title: 'Filters',
    body:
      'Met de filterbalk kiest u het jaar, de Euronorm of ritten van en naar de zero-emissiezone. De filters gelden voor alle grafieken op de pagina en blijven staan als u naar een andere pagina gaat.',
    requires: 'vesdi',
  },
  {
    id: 'kerncijfers',
    page: '/dashboard/nationale-deelritten',
    target: 'kpis',
    title: 'Kerncijfers',
    body:
      'Bovenaan staan de kerncijfers voor de huidige selectie, zoals het totale brutogewicht en het aantal deelritten. Ze rekenen direct mee met de filters.',
    requires: 'vesdi',
  },
  {
    id: 'postcode',
    page: '/dashboard/nationale-deelritten-postcode',
    target: 'postcode-input',
    title: 'Tot op de postcode',
    body:
      'Waar wordt er in Utrecht geladen en gelost? Wissel tussen postcode-4 en het nauwkeuriger postcode-6. Grotere bubbels betekenen meer deelritten; zoom in op de kaart voor detail.',
    requires: 'vesdi',
  },
  {
    id: 'routekaart',
    page: '/dashboard/routekaart',
    target: 'route-controls',
    title: 'Routekaart',
    body:
      'De meest voorkomende herkomst-bestemmingsparen als lijnen op de kaart. Kies “Trajecten” om routes over het wegennet te laten berekenen en klik op een route voor Euronorm en goederensoort.',
    requires: 'vesdi',
  },
  {
    id: 'herkomst',
    page: '/dashboard/zendingen-overzicht',
    target: 'nuts-maps',
    title: 'Herkomst en bestemming',
    body:
      'Waar komen de goederen voor Utrecht vandaan en waar gaan ze heen? De kaarten tonen het aandeel zendingen per NUTS3-regio; donkerder betekent een groter aandeel.',
    requires: 'vesdi',
  },
  {
    id: 'anpr',
    page: '/dashboard/anpr-overzicht',
    target: 'page-header',
    title: 'ANPR: wie rijdt de stad in?',
    body:
      "ANPR-camera's registreren elk bezoek van bestel- en vrachtwagens. Waar VESDI een steekproef is, telt ANPR álle passages, inclusief bestelwagens (N1). Zo vullen de twee bronnen elkaar aan.",
    requires: 'anpr',
  },
  {
    id: 'emissie',
    page: '/dashboard/anpr-emissie',
    target: 'kpis',
    title: 'Hoe schoon is het wagenpark?',
    body:
      'Volg per maand het aandeel Euro-6 en zero-emissie voertuigen. Op de pagina “Analyse” staan trendlijnen en een toets of veranderingen statistisch significant zijn — nuttig voor beleid rond zero-emissiezones.',
    requires: 'anpr',
  },
  {
    id: 'datakwaliteit',
    page: '/dashboard/data-volledigheid',
    target: 'completeness',
    title: 'Datakwaliteit',
    body:
      'Hoe volledig zijn de bestanden? Per kolom ziet u welk deel van de rijen een waarde heeft. Zo weet u hoe stevig een conclusie staat.',
    requires: 'vesdi',
  },
  {
    id: 'klaar',
    title: 'Rondleiding voltooid!',
    body:
      'U kent nu de belangrijkste onderdelen. Verken de pagina’s zelf, of upload de CBS- en ANPR-bestanden van uw eigen gemeente. De rondleiding start u altijd opnieuw via “Rondleiding” in de zijbalk.',
  },
];
