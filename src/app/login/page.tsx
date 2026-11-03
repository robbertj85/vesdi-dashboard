'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, LogIn, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InfoTip } from '@/components/ui/info-tip';
import { SECTION_TOOLTIPS } from '@/lib/descriptions';

function LoginForm() {
  const params = useSearchParams();
  const next = params.get('next') ?? undefined;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
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
      window.location.assign(data.next || '/demo');
    } catch {
      setError('Geen verbinding met de server');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="username" className="text-sm font-medium text-dmi-text">
          Gebruikersnaam
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          required
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full h-10 rounded-lg border border-dmi-primary/20 bg-white px-3 text-sm outline-none focus:border-dmi-primary focus:ring-2 focus:ring-dmi-primary/15"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-dmi-text">
          Wachtwoord
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-10 rounded-lg border border-dmi-primary/20 bg-white px-3 text-sm outline-none focus:border-dmi-primary focus:ring-2 focus:ring-dmi-primary/15"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-dmi-red bg-dmi-red/8 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={busy}
        className="w-full h-11 text-base font-semibold bg-dmi-orange hover:bg-dmi-orange/90 text-white"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
        Inloggen
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-dmi-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-4 mb-8">
          <img src="/images/dmi-logo.svg" alt="DMI Ecosysteem" className="h-12 w-auto" />
          <div className="h-8 w-px bg-dmi-primary/15" />
          <span className="text-sm font-condensed font-semibold text-dmi-primary tracking-wide uppercase">
            VESDI Dashboard
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-lg shadow-dmi-primary/5 p-8">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-dmi-primary" />
            <h1 className="text-lg font-condensed font-bold text-dmi-primary">Demo-omgeving</h1>
            <InfoTip text={SECTION_TOOLTIPS.login} />
          </div>
          <p className="text-sm text-dmi-text/60 mb-6 leading-relaxed">
            Log in met de gedeelde demo-inloggegevens om het dashboard te bekijken met
            VESDI- en ANPR-data van de gemeente Utrecht.
          </p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-xs text-dmi-text/40 text-center mt-6">
          Geen inloggegevens? Neem contact op met het DMI Ecosysteem.
        </p>
      </div>
    </div>
  );
}
