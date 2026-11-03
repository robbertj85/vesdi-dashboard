'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Link2, Loader2, LogIn, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InfoTip } from '@/components/ui/info-tip';
import { SECTION_TOOLTIPS } from '@/lib/descriptions';
import { withBase } from '@/lib/base-path';

const inputClass =
  'w-full h-10 rounded-lg border border-dmi-primary/20 bg-white px-3 text-sm outline-none focus:border-dmi-primary focus:ring-2 focus:ring-dmi-primary/15';

/** Accepts a full invite URL, a path, or just the code. */
function inviteCodeFrom(input: string): string | null {
  const trimmed = input.trim();
  const fromUrl = trimmed.match(/uitnodiging\/([A-Za-z0-9_-]{6,})/);
  if (fromUrl) return fromUrl[1];
  return /^[A-Za-z0-9_-]{6,}$/.test(trimmed) ? trimmed : null;
}

/** Personal link: the normal way in for survey respondents. */
function InviteLinkForm() {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const code = inviteCodeFrom(value);
        if (!code) return setError('Dit lijkt geen geldige uitnodigingslink.');
        window.location.assign(withBase(`/uitnodiging/${encodeURIComponent(code)}`));
      }}
      className="space-y-2"
    >
      <div className="flex gap-2">
        <input
          className={inputClass}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder="Plak hier je persoonlijke link"
          aria-label="Persoonlijke link"
        />
        <Button type="submit" className="h-10 bg-dmi-primary hover:bg-dmi-primary/90 text-white" disabled={!value.trim()}>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
      {error && <p role="alert" className="text-xs text-dmi-red">{error}</p>}
    </form>
  );
}

/** Shared username/password: for administrators and demo visitors without a personal link. */
function PasswordForm({ next }: { next?: string }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(withBase('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Inloggen mislukt');
        setBusy(false);
        return;
      }
      // Full navigation so the new session cookie is sent with every request
      window.location.assign(withBase(data.next || '/demo'));
    } catch {
      setError('Geen verbinding met de server');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor="username" className="text-sm font-medium text-dmi-text">Gebruikersnaam</label>
        <input id="username" name="username" autoComplete="username" required value={username}
          onChange={(e) => setUsername(e.target.value)} className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-dmi-text">Wachtwoord</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required value={password}
          onChange={(e) => setPassword(e.target.value)} className={inputClass} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-dmi-red bg-dmi-red/8 rounded-lg px-3 py-2">{error}</p>
      )}
      <Button type="submit" disabled={busy} className="w-full h-10 font-semibold bg-dmi-orange hover:bg-dmi-orange/90 text-white">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
        Inloggen
      </Button>
    </form>
  );
}

function LoginContent() {
  const params = useSearchParams();
  const next = params.get('next') ?? undefined;
  const inviteError = params.get('fout') === 'uitnodiging';
  const [sharedLogin, setSharedLogin] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(withBase('/api/auth/status'), { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { sharedLogin: boolean }) => setSharedLogin(d.sharedLogin))
      .catch(() => setSharedLogin(true));
  }, []);

  return (
    <div className="space-y-6">
      {inviteError && (
        <p role="alert" className="text-sm text-dmi-red bg-dmi-red/8 rounded-lg px-3 py-2">
          Deze uitnodigingslink is ongeldig of ingetrokken. Vraag een nieuwe link aan bij het DMI Ecosysteem.
        </p>
      )}

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-dmi-primary" />
          <h2 className="font-condensed font-bold text-dmi-primary">Uitgenodigd per e-mail?</h2>
        </div>
        <p className="text-sm text-dmi-text/70 leading-relaxed">
          Klik op de persoonlijke link in je e-mail; je hoeft dan niet in te loggen. Werkt dat niet, plak
          de link dan hieronder.
        </p>
        <InviteLinkForm />
      </section>

      {sharedLogin && (
        <section className="space-y-3 pt-5 border-t border-dmi-primary/10">
          <div className="flex items-center gap-2">
            <LogIn className="w-4 h-4 text-dmi-primary" />
            <h2 className="font-condensed font-bold text-dmi-primary">Inloggen met wachtwoord</h2>
          </div>
          <p className="text-xs text-dmi-text/60">Alleen voor beheerders. Deelnemers aan de enquête gebruiken hun persoonlijke link.</p>
          <PasswordForm next={next} />
        </section>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-dmi-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-4 mb-8">
          <img src={withBase('/images/dmi-logo.svg')} alt="DMI Ecosysteem" className="h-12 w-auto" />
          <div className="h-8 w-px bg-dmi-primary/15" />
          <span className="text-sm font-condensed font-semibold text-dmi-primary tracking-wide uppercase">
            VESDI Dashboard
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-lg shadow-dmi-primary/5 p-8">
          <div className="flex items-center gap-2 mb-1">
            <Link2 className="w-4 h-4 text-dmi-primary" />
            <h1 className="text-lg font-condensed font-bold text-dmi-primary">Demo-omgeving</h1>
            <InfoTip text={SECTION_TOOLTIPS.login} />
          </div>
          <p className="text-sm text-dmi-text/60 mb-6 leading-relaxed">
            Bekijk het dashboard met VESDI- en ANPR-data van de gemeente Utrecht en geef je mening in de enquête.
          </p>
          <Suspense>
            <LoginContent />
          </Suspense>
        </div>

        <p className="text-xs text-dmi-text/40 text-center mt-6">
          Geen link ontvangen? Neem contact op met het DMI Ecosysteem.
        </p>
      </div>
    </div>
  );
}
