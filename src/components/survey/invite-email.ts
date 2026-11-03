/**
 * Invitation e-mail: a template with {naam}, {gemeente} and {link} placeholders,
 * opened as a new message in the admin's mail client (Outlook) so it can be
 * checked and sent one at a time.
 */

export interface EmailTemplate {
  subject: string;
  body: string;
}

export const DEFAULT_TEMPLATE: EmailTemplate = {
  subject: 'Je mening gevraagd: VESDI-dashboard stadslogistiek',
  body: `Beste {naam},

Namens het DMI Ecosysteem nodig ik je uit om het VESDI-dashboard te bekijken en je mening te geven. Het dashboard laat zien wat CBS-data over goederenvervoer (VESDI) en ANPR-cameradata vertellen over stadslogistiek, met de gemeente Utrecht als voorbeeld.

IenW en DMI overwegen om deze CBS-data in te kopen voor 20 à 25 gemeenten. Met een korte enquête (ca. 10 minuten) willen we nagaan of dat echt nodig is: welke informatie heb je voor gemeente {gemeente} echt nodig, en zou je gemeente na de eerste drie jaar (betaald door DMI) zelf een contract met het CBS afsluiten?

Je persoonlijke link (geen wachtwoord nodig):
{link}

De link is persoonlijk, dus stuur hem niet door. Via dezelfde link kun je je antwoorden later nog aanpassen.

Alvast hartelijk dank!

Met vriendelijke groet,
`,
};

export interface Recipient {
  naam: string;
  gemeente: string;
  email: string;
  link: string;
}

export function fillTemplate(text: string, r: Recipient): string {
  return text
    .replaceAll('{naam}', r.naam)
    .replaceAll('{gemeente}', r.gemeente)
    .replaceAll('{link}', r.link);
}

/** Line breaks must be CRLF in mailto bodies for Outlook to keep them. */
const enc = (s: string) => encodeURIComponent(s.replace(/\r?\n/g, '\r\n'));

/** mailto: link — opens a new message in the default mail app (e.g. Outlook). */
export function mailtoUrl(t: EmailTemplate, r: Recipient): string {
  return `mailto:${encodeURIComponent(r.email)}?subject=${enc(fillTemplate(t.subject, r))}&body=${enc(fillTemplate(t.body, r))}`;
}

/** Outlook on the web compose deeplink, for when Outlook is not the default mail app. */
export function outlookWebUrl(t: EmailTemplate, r: Recipient): string {
  const q = new URLSearchParams({ to: r.email, subject: fillTemplate(t.subject, r), body: fillTemplate(t.body, r) });
  return `https://outlook.office.com/mail/deeplink/compose?${q.toString()}`;
}

/** Windows/Outlook reject mailto URLs much longer than ~2000 characters. */
export const MAILTO_SAFE_LENGTH = 2000;
