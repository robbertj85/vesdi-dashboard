// Dutch descriptions for tooltips and page documentation

export const PAGE_DESCRIPTIONS = {
  voorblad: 'Het voorblad van het gemeentelijk VESDI-dashboard.',
  introductie: 'Achtergrond en navigatie voor het VESDI-dashboard.',
  trends:
    'Overzicht van trends over meerdere jaren: aantal deelritten, Euro-6 percentage, zendingen en beladingsgraad.',
  zendingenOverzicht:
    'Geografisch overzicht van zendingen naar en vanuit de gemeente op NUTS3-niveau.',
  nationaleZendingen:
    'Analyse van binnenlandse zendingen: aantallen, gewichten en verdeling per stadslogistieke klasse.',
  internationaleZendingen:
    'Analyse van grensoverschrijdende zendingen: import/export verdeling, handelspartners en emissiezone.',
  nationaleDeelritten:
    'Analyse van binnenlandse deelritten: aantallen, gewichten, brandstof, voertuig- en gewichtsklasse.',
  nationaleDeelrittenPostcode:
    'Gedetailleerde analyse per postcode: laad- en loslocaties met kaarten en voertuiginformatie.',
  routekaart:
    'Routekaart op basis van herkomst-bestemmingsparen. Kleurschaal geeft het aantal deelritten weer.',
  internationaleDeelrittenOverzicht:
    'Geografisch overzicht van internationale deelritten naar en vanuit de gemeente op NUTS3-niveau.',
  internationaleDeelritten:
    'Detailanalyse van internationale deelritten: handelspartners, voertuigkenmerken en postcode.',
  externeLinks:
    'Links naar relevante externe bronnen en documentatie.',
  definities:
    'Verklarende woordenlijst van begrippen die in het VESDI-dashboard worden gebruikt.',
  dataVolledigheid:
    'Overzicht van de datakwaliteit en volledigheid per veld in de geladen bestanden.',
  api:
    'REST API-documentatie op basis van OpenAPI 3.0.3. Endpoints voor zendingen, deelritten, aggregaties en metadata.',
  anprOverzicht:
    'Overzicht van vrachtverkeerbezoeken op basis van ANPR-cameraregistraties: aantallen, voertuigcategorieen en emissieklassen.',
  anprEmissie:
    'Maandelijkse trends in emissieklassen en voertuigcategorieen op basis van ANPR-data.',
  anprBedrijven:
    'Analyse van bezoeken per bedrijfstak (SBI-groep) en bedrijfsgrootte.',
  anprBezoekers:
    'Kenmerken van bezoekers: type bezoeker, bedrijfsgrootte en herkomstprovincie.',
  anprTijdpatronen:
    'Dag- en weekpatronen van vrachtverkeerbezoeken.',
} as const;

export const KPI_TOOLTIPS = {
  brutoGewicht:
    'Totaal bruto gewicht van alle zendingen/deelritten in kilogram.',
  zendingAantal:
    'Totaal aantal unieke zendingen (pakket van herkomst naar bestemming).',
  aantalDeelritten:
    'Totaal aantal deelritten (individuele vervoersbewegingen per voertuig).',
  beladingsgraad:
    'Gewogen gemiddelde beladingsgraad: het percentage van het laadvermogen dat benut wordt.',
  importPercentage:
    'Percentage van internationale zendingen dat geImporteerd wordt (herkomst buitenland).',
  exportPercentage:
    'Percentage van internationale zendingen dat geExporteerd wordt (bestemming buitenland).',
  euro6Percentage:
    'Percentage deelritten uitgevoerd door voertuigen met Euro-6 emissieclassificatie.',
  leegPercentage:
    'Percentage deelritten dat zonder lading wordt uitgevoerd.',
} as const;

export const CHART_TOOLTIPS = {
  stadslogistiekKlasse:
    'Verdeling van zendingen/deelritten over CBS stadslogistieke klassen (bijv. pakket, bouw, food).',
  emissiezoneLaden:
    'Aandeel zendingen waarvan de laadlocatie in een emissiezone ligt.',
  emissiezoneLossen:
    'Aandeel zendingen waarvan de loslocatie in een emissiezone ligt.',
  importExportLand:
    'Verdeling van internationale zendingen/deelritten per handelspartner.',
  brandstofsoort:
    'Verdeling van deelritten over brandstofsoorten (diesel, elektrisch, etc.).',
  gewichtsklasse:
    'Verdeling van deelritten over gewichtsklassen van voertuigen.',
  voertuigcategorie:
    'Verdeling van deelritten over voertuigcategorieen (bestelwagen, vrachtwagen, etc.).',
  beladingsgraadKlasse:
    'Gewogen gemiddelde beladingsgraad per stadslogistieke klasse per jaar.',
  voertuigTypePerYear:
    'Procentuele verdeling van voertuigtypen per jaar.',
  deelrittenPerKlasse:
    'Absoluut aantal deelritten per stadslogistieke klasse per jaar.',
  trendDeelrittenKms:
    'Aantal deelritten (lijn) en totale kilometers binnen de gemeente (stippellijn) per jaar.',
  trendEuro6:
    'Percentage deelritten met Euro-6 voertuigen per jaar.',
  trendZendingenGewicht:
    'Aantal zendingen (lijn) en bruto gewicht (stippellijn) per jaar.',
  pc4Laad:
    'Kaart met het aantal deelritten/zendingen per postcode-4 laadlocatie.',
  pc4Los:
    'Kaart met het aantal deelritten/zendingen per postcode-4 loslocatie.',
  beladingsgraadPC4:
    'Choroplethkaart met de gemiddelde beladingsgraad per laadpostcode.',
  nuts3Naar:
    'Aantal zendingen/deelritten naar de gemeente, gegroepeerd per NUTS3-herkomstregio.',
  nuts3Vanuit:
    'Aantal zendingen/deelritten vanuit de gemeente, gegroepeerd per NUTS3-bestemmingsregio.',
  anprVoertuigcategorie:
    'Verdeling van ANPR-bezoeken over Europese voertuigcategorieen (N1=licht, N2=middelzwaar, N3=zwaar).',
  anprEmissieklasse:
    'Verdeling van bezoeken over emissieklassen: Euro 0-5, Euro 6 en zero-emissie.',
  anprMaandelijkBezoeken:
    'Aantal bezoeken per maand, uitgesplitst naar emissieklasse.',
  anprMaandelijkVoertuig:
    'Aantal bezoeken per maand, uitgesplitst naar voertuigcategorie.',
  anprEmissiePerVoertuig:
    'Emissieklasseverdeling per voertuigcategorie.',
  anprEuro6Trend:
    'Maandelijks percentage Euro-6 en zero-emissie bezoeken.',
  anprSbiGroep:
    'Verdeling van bezoeken over bedrijfstakken (SBI-groep).',
  anprBedrijfsgrootte:
    'Verdeling van bezoeken over bedrijfsgroottes.',
  anprBezoekersType:
    'Verdeling van bezoeken naar type bezoeker: eenmalig, 2-12 keer of >12 keer per jaar.',
  anprHerkomstProvincie:
    'Verdeling van bezoeken naar rustprovincie van het voertuig.',
  anprTijdstip:
    'Verdeling van bezoeken over zes dagdelen.',
  anprWeekdag:
    'Verdeling van bezoeken over de dagen van de week.',
} as const;

/**
 * Longer "how to read this page" help, shown behind the (?) next to each page title.
 */
export const PAGE_HELP = {
  voorblad:
    'Startpunt van het dashboard. Gebruik de zijbalk links om naar de analysepagina\'s te gaan; elke pagina en grafiek heeft een (?) met uitleg.',
  introductie:
    'Leest u dit dashboard voor het eerst? Begin hier: deze pagina legt uit wat VESDI- en ANPR-data zijn, hoe ze verzameld worden en welke periode is geladen. Rechts staan snelkoppelingen naar alle pagina\'s.',
  trends:
    'Vergelijkt alle geladen jaren naast elkaar. Deze pagina negeert het jaarfilter, zodat u de ontwikkeling door de tijd ziet. Let op: verschillen tussen jaren kunnen deels door de steekproef komen.',
  zendingenOverzicht:
    'Links: waar komen zendingen naar de gemeente vandaan? Rechts: waar gaan zendingen vanuit de gemeente naartoe? Hoe donkerder de regio, hoe groter het aandeel. Beweeg over een regio voor de exacte waarde.',
  nationaleZendingen:
    'Alleen zendingen met laad- én loslocatie in Nederland. Gebruik de filters bovenaan om te selecteren op jaar, euronorm of emissiezone. De kaarten tonen de belangrijkste laad- en loslocaties per postcode.',
  internationaleZendingen:
    'Zendingen waarvan de laad- of loslocatie in het buitenland ligt. Filter op import of export om de handelsrichting te bekijken.',
  nationaleDeelritten:
    'Een deelrit is één rit van een voertuig tussen twee stops. Deze pagina laat zien welke voertuigen, brandstoffen en gewichtsklassen binnenlandse ritten van en naar de gemeente uitvoeren.',
  nationaleDeelrittenPostcode:
    'INPUT (links) toont waar ritten laden en lossen; wissel tussen postcode-4 en de nauwkeuriger postcode-6. OUTPUT (rechts) vat de kenmerken van deze ritten samen.',
  routekaart:
    'Toont de meest voorkomende herkomst-bestemmingsparen als lijnen of als berekende routes over het wegennet. Kies links hoeveel routes u wilt zien en klik op een route voor details.',
  internationaleDeelrittenOverzicht:
    'Europese kaarten met de herkomst (links) en bestemming (rechts) van grensoverschrijdende deelritten van en naar de gemeente.',
  internationaleDeelritten:
    'Details van grensoverschrijdende deelritten: per handelsland, per stadslogistieke klasse, per postcode in de gemeente en per voertuigkenmerk.',
  externeLinks:
    'Achtergrondinformatie en bronnen bij het CBS, het DMI Ecosysteem en andere organisaties. Links openen in een nieuw tabblad.',
  definities:
    'Woordenlijst van de begrippen die in grafieken en filters worden gebruikt. Handig als naslag naast de analysepagina\'s.',
  dataVolledigheid:
    'Laat per kolom zien welk percentage van de rijen een waarde heeft voor het gekozen jaar. Een lage score betekent dat analyses op die kolom op minder data rusten.',
  anprOverzicht:
    'ANPR-camera\'s registreren voertuigen die de gemeente binnenrijden. Deze pagina geeft het totaal aantal bezoeken en de verdeling naar voertuigcategorie.',
  anprEmissie:
    'Hoe schoon is het vrachtverkeer? Volg per maand het aandeel Euro-6 en zero-emissie voertuigen, uitgesplitst naar bestel- en vrachtwagens.',
  anprBedrijven:
    'Welke bedrijfstakken (SBI) en bedrijfsgroottes veroorzaken de bezoeken? Gebaseerd op de koppeling van het kenteken aan de eigenaar in het RDW- en bedrijvenregister.',
  anprBezoekers:
    'Hoe vaak komen voertuigen terug, en uit welke provincie komen ze? Eenmalige bezoekers vragen om een andere aanpak dan dagelijkse leveranciers.',
  anprTijdpatronen:
    'Op welke dagen en tijdstippen is het vrachtverkeer het drukst? Nuttig voor bijvoorbeeld venstertijden en handhaving.',
  anprAnalyse:
    'Statistische verdieping: trendlijnen met extrapolatie van de emissieklassen, en een toets of het aandeel per klasse tussen twee periodes significant verschilt.',
} as const;

/** Tooltips for UI sections that are not charts. */
export const SECTION_TOOLTIPS = {
  // Login / demo / upload
  login:
    'Deze demo-omgeving is afgeschermd met één gedeelde gebruikersnaam en wachtwoord. Na inloggen wordt automatisch de demodata van de gemeente Utrecht geladen.',
  demoCard:
    'Laadt de VESDI-wegvervoersenquête 2021-2023 en ANPR-data 2025 van de gemeente Utrecht. De bestanden worden in uw browser verwerkt; vervangt eventueel eerder geladen data.',
  dropZone:
    'Sleep losse bestanden of complete mappen hierheen. Het bestandstype wordt automatisch herkend aan de kolommen, niet aan de bestandsnaam. Alles blijft in uw browser; er wordt niets naar een server gestuurd.',
  supportedFiles:
    'Minimaal nodig: een zendingen- of deelrittenbestand (VESDI) of ANPR-bestanden. Codetabellen en lookup-bestanden zorgen dat codes als leesbare namen getoond worden.',
  howItWorks:
    'De verwerking gebeurt volledig in de browser en wordt bewaard in IndexedDB, zodat de data bij een volgend bezoek nog beschikbaar is.',
  detectedFiles:
    'Groen: herkend en verwerkt. Geel: herkend met waarschuwing. Rood: niet herkend of niet leesbaar.',

  // Sidebar sections
  navWegvervoer:
    'Pagina\'s op basis van de CBS Wegvervoersenquête (VESDI): zendingen (goederen van A naar B) en deelritten (voertuigbewegingen tussen twee stops). Alleen vrachtwagens (N2/N3).',
  navAnpr:
    'Pagina\'s op basis van ANPR-cameraregistraties: bezoeken van bestel- en vrachtwagens aan de gemeente, gekoppeld aan voertuig- en bedrijfskenmerken.',
  navSysteem:
    'Naslag en datakwaliteit: definities, externe bronnen en de volledigheid van de geladen bestanden.',
  logout:
    'Uitloggen uit de demo-omgeving. Geladen data blijft in deze browser bewaard.',

  // Filters
  filterBar:
    'Filters gelden voor alle grafieken op deze pagina en blijven bewaard als u naar een andere pagina gaat.',
  filterYear:
    'Kies het jaar van de wegvervoersenquête. Standaard wordt het meest recente jaar getoond.',
  filterEuronorm:
    'Toon alleen ritten met voertuigen van een bepaalde Euro-emissienorm. Euro 6 is de schoonste dieselnorm.',
  filterLaadEZ:
    'Filter op zendingen of ritten waarvan de laadlocatie binnen de (geplande) zero-emissiezone ligt.',
  filterLosEZ:
    'Filter op zendingen of ritten waarvan de loslocatie binnen de (geplande) zero-emissiezone ligt.',
  filterHandelsrichting:
    'Import: herkomst in het buitenland. Export: bestemming in het buitenland.',

  // Map / section headings
  nuts3NaarZendingen:
    'Aandeel van alle zendingen naar de gemeente per NUTS3-regio van herkomst (laadlocatie). Donkerder = groter aandeel.',
  nuts3VanuitZendingen:
    'Aandeel van alle zendingen vanuit de gemeente per NUTS3-regio van bestemming (loslocatie). Donkerder = groter aandeel.',
  nuts3NaarDeelritten:
    'Deelritten naar de gemeente, per Europese NUTS3-regio waar geladen werd. Donkerder = meer ritten.',
  nuts3VanuitDeelritten:
    'Deelritten vanuit de gemeente, per Europese NUTS3-regio waar gelost werd. Donkerder = meer ritten.',
  importExportLand:
    'Aantal zendingen of deelritten per buitenlands handelsland: geladen in dat land (import) of gelost in dat land (export).',
  pc4InGemeente:
    'Bubbelkaart van de 30 drukste postcodes binnen de gemeente voor internationale deelritten. Wissel tussen laad- en loslocaties.',
  voertuiginformatie:
    'Verdeling van internationale deelritten naar maximaal toegestaan gewicht, voertuigsoort of leeggewicht.',
  inputSection:
    'Waar wordt geladen en gelost? Bubbels tonen de 50 drukste postcodes; grotere bubbel = meer deelritten.',
  outputSection:
    'Kenmerken van de deelritten op deze pagina: gewicht, aantallen, Euro-6 aandeel, lege ritten, klassen en voertuigtypen.',
  pc4LaadZendingen:
    'Bubbelkaart van de laadlocaties van nationale zendingen per postcode. Grotere bubbel = meer zendingen.',
  pc4LosZendingen:
    'Bubbelkaart van de loslocaties van nationale zendingen per postcode. Grotere bubbel = meer zendingen.',
  routeAantal:
    'Hoeveel van de meest voorkomende herkomst-bestemmingsparen worden getekend. Meer routes geeft een vollediger beeld, maar laadt trager.',
  routeWeergave:
    'Rechte lijnen verbinden herkomst en bestemming direct. Trajecten worden berekend via OpenRouteService over het wegennet en tonen waar het verkeer waarschijnlijk rijdt.',
  routeLegenda:
    'Kleurschaal voor het aantal deelritten per route. De klassen worden automatisch afgeleid uit de getoonde data.',
  routeOmschrijving:
    'Uitleg over wat de kaart wel en niet laat zien.',
  completenessZendingen:
    'Per kolom het percentage rijen in het zendingenbestand met een ingevulde waarde, voor het gekozen jaar. Het percentage rechtsboven is het gemiddelde.',
  completenessDeelritten:
    'Per kolom het percentage rijen in het deelrittenbestand met een ingevulde waarde, voor het gekozen jaar. Het percentage rechtsboven is het gemiddelde.',
  kpiGemeente: 'De gemeente waarvoor de data is aangeleverd, automatisch herkend uit de bestanden.',
  kpiJaren: 'Alle jaren waarvoor zendingen- of deelrittenbestanden zijn geladen.',
  kpiZendingenRijen: 'Aantal rijen in het zendingenbestand voor het gekozen jaar.',
  kpiDeelrittenRijen: 'Aantal rijen in het deelrittenbestand voor het gekozen jaar.',
  introVesdi:
    'Zending = goederen van A naar B (kan meerdere ritten beslaan). Deelrit = het stuk rit van een voertuig tussen twee stops.',
  introAnpr:
    'ANPR = Automatic Number Plate Recognition. Het kenteken wordt gekoppeld aan RDW-gegevens; kentekens zelf zijn niet in de data opgenomen.',
  introDataverzameling:
    'De Wegvervoersenquête is een steekproef: aantallen zijn door het CBS opgehoogd naar het totaal en hebben dus een onzekerheidsmarge.',
  introVerslagperiode:
    'De periode waarop de geladen bestanden betrekking hebben.',
  introNav:
    'Snelkoppelingen naar alle pagina\'s, gegroepeerd per databron. Dezelfde pagina\'s vindt u in de zijbalk.',
} as const;

export const CHART_TOOLTIPS_EXTRA = {
  beladingsgraadPC4Laad:
    'Gemiddelde beladingsgraad (gewogen naar aantal deelritten) per postcode-4 waar geladen werd. Donkerder = voller beladen.',
  pc4LaadDeelritten:
    'Bubbelkaart van de 50 drukste laadpostcodes. Grotere bubbel = meer deelritten.',
  pc4LosDeelritten:
    'Bubbelkaart van de 50 drukste lospostcodes. Grotere bubbel = meer deelritten.',
} as const;
