"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const ADMIN_EMAILS = [
  'admin@azphur.com',
  'tuofratello@email.com',
  'tuamailprincipale@email.com',
];

const REMEMBER_KEY = 'az_remembered_email';

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="m4 8 8 5.5L20 8" />
  </svg>
);
const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4.5" y="10.5" width="15" height="10" rx="3" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </svg>
);
const EyeIcon = ({ off }: { off: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
);
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);
const AppleIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="#0f172a" aria-hidden="true">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Hero illustration (original artwork: sun, solar field, EV charge)  */
/* ------------------------------------------------------------------ */

const HeroIllustration = () => (
  <svg className="azl-illustration" viewBox="0 0 420 270" role="img" aria-label="Solar panels and an electric car charging">
    <defs>
      <radialGradient id="azlSun" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
        <stop offset="60%" stopColor="#ffffff" stopOpacity=".35" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="azlPanel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0e7490" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="azlCar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#d6f3f7" />
      </linearGradient>
    </defs>

    {/* sun */}
    <circle cx="322" cy="62" r="74" fill="url(#azlSun)" />
    <circle cx="322" cy="62" r="26" fill="#ffffff" />

    {/* hills */}
    <path d="M0 210 C70 160 150 170 220 195 C290 220 350 175 420 190 L420 270 L0 270 Z" fill="rgba(255,255,255,.22)" />
    <path d="M0 232 C90 200 170 220 250 226 C330 232 380 212 420 218 L420 270 L0 270 Z" fill="rgba(255,255,255,.34)" />

    {/* solar field */}
    <g>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${38 + i * 58} ${150 + (i % 2) * 6})`}>
          <path d="M0 52 L16 0 H62 L46 52 Z" fill="url(#azlPanel)" stroke="#ffffff" strokeOpacity=".7" strokeWidth="1.5" />
          <path d="M5 34 H52 M10 17 H57 M24 0 L8 52 M40 0 L24 52" stroke="#67e8f9" strokeOpacity=".55" strokeWidth="1" />
          <path d="M23 52 V74 M12 74 H34" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
    </g>

    {/* charger */}
    <g transform="translate(236 128)">
      <rect x="0" y="0" width="34" height="84" rx="10" fill="#ffffff" />
      <rect x="6" y="9" width="22" height="18" rx="5" fill="#0891b2" />
      <path d="M18 12 L13 20 H18 L16 25 L23 16 H18 Z" fill="#ffffff" />
      <path d="M34 48 C58 48 52 82 76 82" fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
      <rect x="-6" y="82" width="46" height="8" rx="4" fill="rgba(15,23,42,.35)" />
    </g>

    {/* car */}
    <g transform="translate(296 150)">
      <path d="M6 58 C6 44 12 38 24 34 L44 14 C48 9 54 7 60 7 H92 C100 7 106 11 110 18 L120 34 C128 36 132 42 132 52 V62 H6 Z" fill="url(#azlCar)" />
      <path d="M52 17 H64 V34 H40 Z M72 17 H92 L102 34 H72 Z" fill="#0891b2" fillOpacity=".55" />
      <rect x="6" y="56" width="126" height="8" rx="4" fill="#0f172a" fillOpacity=".15" />
      <circle cx="36" cy="64" r="13" fill="#0f172a" />
      <circle cx="36" cy="64" r="5" fill="#67e8f9" />
      <circle cx="102" cy="64" r="13" fill="#0f172a" />
      <circle cx="102" cy="64" r="5" fill="#67e8f9" />
    </g>

    {/* sparkles */}
    <g fill="#ffffff">
      <circle cx="120" cy="86" r="3" opacity=".8" />
      <circle cx="200" cy="48" r="2.4" opacity=".7" />
      <circle cx="60" cy="58" r="2" opacity=".6" />
      <path d="M372 150 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z" opacity=".85" />
    </g>
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Splash screen — used while the session is being checked            */
/* ------------------------------------------------------------------ */

export function AzphurSplash() {
  return (
    <main className="azs-root" aria-label="Loading AZPHUR" role="status">
      <style jsx global>{`
        html, body { margin: 0; background: #f2fafb; }
        .azs-root {
          min-height: 100dvh; display: grid; place-items: center; overflow: hidden; position: relative;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif;
          background:
            radial-gradient(circle at 50% 30%, rgba(34,211,238,.28), transparent 38%),
            linear-gradient(160deg, #ffffff 0%, #e8f8fa 100%);
        }
        .azs-root::before {
          content: ""; position: absolute; inset: 0; opacity: .35; pointer-events: none;
          background-image:
            linear-gradient(rgba(14,116,144,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14,116,144,.05) 1px, transparent 1px);
          background-size: 44px 44px;
          mask-image: radial-gradient(circle at 50% 45%, #000 0%, transparent 70%);
        }
        .azs-center { position: relative; display: flex; flex-direction: column; align-items: center; padding: 24px; }

        /* logo + motto slide in from the left towards the right */
        .azs-brand { display: flex; align-items: center; gap: 20px; }
        .azs-mark {
          width: 84px; height: 84px; border-radius: 28px; display: grid; place-items: center; flex: 0 0 auto;
          background: #fff; border: 1px solid rgba(8,145,178,.14);
          box-shadow: 0 22px 50px rgba(8,145,178,.18);
          animation: azsFromLeft .85s cubic-bezier(.2,.8,.2,1) both;
        }
        .azs-mark img { width: 52px; height: auto; display: block; }
        .azs-text { animation: azsFromLeft .85s cubic-bezier(.2,.8,.2,1) both .18s; }
        .azs-name { margin: 0; font-size: 34px; font-weight: 900; letter-spacing: 5px; line-height: 1; color: #0f2a3d; }
        .azs-tag { margin: 10px 0 0; font-size: 11px; font-weight: 800; letter-spacing: 1.6px; color: #0891b2; white-space: nowrap; }

        /* spinner fades in once the brand has arrived */
        .azs-spinner {
          width: 38px; height: 38px; margin-top: 44px; border-radius: 50%;
          border: 3px solid rgba(8,145,178,.16); border-top-color: #06b6d4; border-right-color: #0891b2;
          opacity: 0;
          animation: azsFadeIn .4s ease-out forwards 1s, azsSpin .8s linear infinite;
        }

        @keyframes azsFromLeft { from { opacity: 0; transform: translateX(-110px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes azsFadeIn { to { opacity: 1; } }
        @keyframes azsSpin { to { transform: rotate(360deg); } }

        @media (max-width: 560px) {
          .azs-brand { flex-direction: column; gap: 18px; text-align: center; }
          .azs-mark { width: 76px; height: 76px; border-radius: 25px; }
          .azs-mark img { width: 46px; }
          .azs-name { font-size: 28px; letter-spacing: 4px; padding-left: 4px; }
          .azs-tag { font-size: 10px; letter-spacing: 1.1px; white-space: normal; max-width: 260px; margin-left: auto; margin-right: auto; }
          .azs-spinner { margin-top: 36px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .azs-mark, .azs-text { animation: none; }
          .azs-spinner { animation: azsFadeIn .01s forwards, azsSpin 1.6s linear infinite; }
        }
      `}</style>
      <div className="azs-center">
        <div className="azs-brand">
          <div className="azs-mark"><img src="/logo-azphur.avif" alt="AZPHUR" /></div>
          <div className="azs-text">
            <h1 className="azs-name">AZPHUR</h1>
            <p className="azs-tag">SHAPING SUSTAINABLE POSSIBILITIES</p>
          </div>
        </div>
        <div className="azs-spinner" aria-hidden="true" />
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Post-login routing (same rules as the /login page)                 */
/* ------------------------------------------------------------------ */

async function resolveDestination(userEmail: string, accessToken: string): Promise<string> {
  if (ADMIN_EMAILS.includes(userEmail)) return '/login'; // /login shows the admin routing panel for an active admin session

  // Funding partner (verified server-side)
  try {
    const res = await fetch('/api/v1/funding-engine?scope=partner', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if ((res.headers.get('content-type') || '').includes('application/json')) {
      const json = await res.json();
      if (res.ok && json.success && json.partner) return '/funding-partners';
    }
  } catch (err) {
    console.error('Funding partner access check failed:', err);
  }

  const [solarCheck, mod1Check] = await Promise.all([
    supabase.from('solar_allowed_customers').select('email').eq('email', userEmail).maybeSingle(),
    supabase.from('module_01_customers').select('email').eq('email', userEmail).maybeSingle(),
  ]);

  // Customer with both Solar and S2B: the home grid shows both modules
  if (solarCheck.data && mod1Check.data) return '/';

  const { data: installer } = await supabase.from('installers_whitelist').select('email').eq('email', userEmail).maybeSingle();
  if (installer) return '/partner';

  const { data: partner } = await supabase.from('partner_whitelist').select('email').eq('email', userEmail).maybeSingle();
  if (partner) return '/login'; // provider workspace chooser lives on /login

  const { data: driver } = await supabase.from('driver_profiles').select('email').eq('email', userEmail).maybeSingle();
  if (driver) return '/EV/driver';

  const { data: ev } = await supabase.from('module_05_customers').select('email').eq('email', userEmail).maybeSingle();
  if (ev) return '/EV';

  if (solarCheck.data) return '/solar-quote';
  if (mod1Check.data) return '/s2b';

  return '/'; // brand-new account: the home shows "Choose your ecosystem"
}

/* ------------------------------------------------------------------ */
/*  Landing + login                                                    */
/* ------------------------------------------------------------------ */

type PublicAzphurLandingProps = {
  onRegister: () => void;
  /** kept for backwards compatibility with the old signature; no longer needed */
  onLogin?: () => void;
};

export default function PublicAzphurLanding({ onRegister }: PublicAzphurLandingProps) {
  const router = useRouter();

  const [mode, setMode] = useState<'login' | 'recovery'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(REMEMBER_KEY);
      if (saved) setEmail(saved);
    } catch { /* storage unavailable */ }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setNotice('');
    setLoading(true);

    const emailNormalized = email.toLowerCase().trim();
    const isAdminUser = ADMIN_EMAILS.includes(emailNormalized);

    try {
      (window as unknown as { IS_ADMIN_LOGGING_IN?: boolean }).IS_ADMIN_LOGGING_IN = isAdminUser;

      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: emailNormalized, password });

      if (authError || !data.session || !data.user) {
        (window as unknown as { IS_ADMIN_LOGGING_IN?: boolean }).IS_ADMIN_LOGGING_IN = false;
        setError(authError?.message || 'Email or password not recognized. Please try again.');
        setLoading(false);
        return;
      }

      try {
        if (remember) window.localStorage.setItem(REMEMBER_KEY, emailNormalized);
        else window.localStorage.removeItem(REMEMBER_KEY);
      } catch { /* ignore */ }

      if (!isAdminUser) {
        (window as unknown as { IS_ADMIN_LOGGING_IN?: boolean }).IS_ADMIN_LOGGING_IN = false;
      }

      const destination = await resolveDestination(emailNormalized, data.session.access_token);
      if (destination === '/') {
        // Already on "/": the auth listener in the home page swaps this view for the dashboard.
        router.refresh();
      } else {
        router.push(destination);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong while signing in. Please try again.');
      setLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const { error: recErr } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (recErr) throw recErr;
      setNotice('Reset link sent. Check your inbox to choose a new password.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send the reset link.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    if (oauthLoading) return;
    setError('');
    setOauthLoading(provider);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (oauthError) {
      setError(`${provider === 'google' ? 'Google' : 'Apple'} sign-in is not available yet.`);
      setOauthLoading(null);
    }
  };

  return (
    <div className="azl-root">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@800&display=swap');
        html, body { margin: 0; background: #f2fafb; }
        .azl-root, .azl-root * { box-sizing: border-box; }
        .azl-root {
          min-height: 100dvh; color: #0f2a3d; background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif;
          animation: azlFade .55s ease-out both;
        }
        @keyframes azlFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .azl-split { min-height: 100dvh; display: flex; flex-direction: column; }

        /* ---------- HERO (top on phone, left on desktop) ---------- */
        .azl-hero {
          position: relative; overflow: hidden; color: #fff;
          padding: 26px 24px 0; min-height: 300px;
          border-radius: 0 0 34px 34px;
          background:
            radial-gradient(circle at 85% 8%, rgba(255,255,255,.28), transparent 34%),
            linear-gradient(150deg, #0e7490 0%, #0891b2 45%, #22d3ee 100%);
          display: flex; flex-direction: column;
        }
        .azl-hero::before {
          content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .5;
          background-image:
            linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: linear-gradient(to bottom, #000, transparent 85%);
        }
        .azl-brand { position: relative; display: flex; align-items: center; gap: 12px; }
        .azl-brand-logo { width: 42px; height: 42px; border-radius: 14px; background: #fff; display: grid; place-items: center; box-shadow: 0 8px 20px rgba(8,47,73,.22); flex: 0 0 auto; }
        .azl-brand-logo img { width: 26px; height: auto; display: block; }
        .azl-brand-name { font-size: 30px; font-weight: 900; letter-spacing: -.5px; line-height: 1; }
        .azl-brand-name i { font-style: normal; color: #cffafe; }
        .azl-hero-copy { position: relative; margin-top: 14px; max-width: 280px; }
        .azl-hero-copy p { margin: 0; font-size: 17px; line-height: 1.35; font-weight: 500; color: rgba(255,255,255,.92); }
        .azl-hero-desktop-only { display: none; }
        .azl-illustration { position: relative; display: block; width: 100%; max-width: 440px; height: auto; margin: auto -6px 0 auto; }

        /* ---------- FORM SIDE ---------- */
        .azl-form-side { flex: 1; display: flex; justify-content: center; padding: 30px 24px 34px; background: #fff; }
        .azl-card { width: 100%; max-width: 440px; }
        .azl-title { margin: 0; font-size: 31px; font-weight: 900; letter-spacing: -1px; color: #0b1f2e; }
        .azl-sub { margin: 8px 0 0; font-size: 14px; line-height: 1.5; color: #6b7f8e; }

        .azl-form { display: grid; gap: 14px; margin-top: 26px; }
        .azl-field {
          display: flex; align-items: center; gap: 12px; height: 58px; padding: 0 16px;
          border-radius: 20px; border: 1.5px solid transparent; background: #f1f6f7; color: #7a8d9b;
          transition: border-color .18s ease, background .18s ease, box-shadow .18s ease, color .18s ease;
        }
        .azl-field:focus-within { border-color: #22d3ee; background: #ecfcfe; color: #0891b2; box-shadow: 0 0 0 4px rgba(34,211,238,.14); }
        .azl-field input {
          flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: transparent;
          font: inherit; font-size: 16px; font-weight: 500; color: #0b1f2e;
        }
        .azl-field input::placeholder { color: #8fa1ad; font-weight: 500; }
        .azl-eye { border: 0; background: transparent; color: #7a8d9b; padding: 6px; margin-right: -6px; cursor: pointer; display: grid; place-items: center; border-radius: 10px; }
        .azl-eye:hover { color: #0891b2; }

        .azl-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 2px; }
        .azl-check { display: inline-flex; align-items: center; gap: 10px; font-size: 13.5px; font-weight: 600; color: #4b6272; cursor: pointer; user-select: none; }
        .azl-check input { position: absolute; opacity: 0; pointer-events: none; }
        .azl-check-box { width: 24px; height: 24px; border-radius: 8px; border: 1.5px solid #b9d3d9; background: #fff; display: grid; place-items: center; color: transparent; transition: .16s ease; flex: 0 0 auto; }
        .azl-check input:checked + .azl-check-box { background: #06b6d4; border-color: #06b6d4; color: #fff; }
        .azl-check input:focus-visible + .azl-check-box { box-shadow: 0 0 0 4px rgba(34,211,238,.25); }
        .azl-link { border: 0; background: transparent; padding: 4px 0; font: inherit; font-size: 13.5px; font-weight: 800; color: #0891b2; cursor: pointer; }
        .azl-link:hover { color: #0e7490; text-decoration: underline; }

        .azl-msg { margin: 0; padding: 12px 14px; border-radius: 14px; font-size: 13px; line-height: 1.45; font-weight: 600; }
        .azl-msg--error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
        .azl-msg--ok { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }

        .azl-primary {
          height: 58px; border: 0; border-radius: 999px; cursor: pointer; color: #fff;
          font-size: 17px; font-weight: 800; letter-spacing: .2px;
          background: linear-gradient(100deg, #0c4a5e 0%, #0891b2 55%, #22d3ee 100%);
          box-shadow: 0 16px 30px rgba(8,145,178,.28);
          transition: transform .18s ease, box-shadow .18s ease, filter .18s ease; margin-top: 6px;
        }
        .azl-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 20px 36px rgba(8,145,178,.34); filter: brightness(1.04); }
        .azl-primary:disabled { opacity: .7; cursor: wait; }

        .azl-divider { display: flex; align-items: center; gap: 14px; margin: 24px 0 16px; color: #8fa1ad; font-size: 13px; font-weight: 600; }
        .azl-divider::before, .azl-divider::after { content: ""; flex: 1; height: 1px; background: #e2edef; }
        .azl-social { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .azl-social-btn {
          height: 54px; border: 0; border-radius: 999px; background: #f1f6f7; color: #0b1f2e; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          font: inherit; font-size: 15px; font-weight: 800; transition: background .18s ease, transform .18s ease;
        }
        .azl-social-btn:hover:not(:disabled) { background: #e3f4f7; transform: translateY(-1px); }
        .azl-social-btn:disabled { opacity: .6; cursor: wait; }
        .azl-signup { margin: 26px 0 0; text-align: center; font-size: 14.5px; color: #5b7080; }
        .azl-signup button { border: 0; background: transparent; padding: 0; font: inherit; font-weight: 900; color: #0891b2; cursor: pointer; }
        .azl-signup button:hover { text-decoration: underline; }
        .azl-secure { margin: 18px 0 0; text-align: center; font-size: 11px; font-weight: 700; letter-spacing: .6px; color: #9db0bb; }

        /* ---------- HOW IT WORKS ---------- */
        .azl-how { padding: 8px 24px 40px; background: #fff; }
        .azl-how-inner { max-width: 1040px; margin: 0 auto; }
        .azl-how-head { display: flex; align-items: center; gap: 10px; margin: 0 0 16px; color: #0891b2; font: 800 10px "JetBrains Mono", monospace; letter-spacing: 1.6px; }
        .azl-how-head::before { content: ""; width: 26px; height: 2px; background: #06b6d4; }
        .azl-steps { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .azl-step { display: flex; gap: 14px; align-items: flex-start; padding: 18px; border-radius: 22px; background: #f6fbfc; border: 1px solid #e0eff2; }
        .azl-step b { flex: 0 0 auto; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: #d9f6fa; color: #0e7490; font: 800 12px "JetBrains Mono", monospace; }
        .azl-step strong { display: block; font-size: 15px; color: #0b1f2e; }
        .azl-step span { display: block; margin-top: 4px; font-size: 13px; line-height: 1.5; color: #64798a; }
        .azl-footer { padding: 0 24px 28px; text-align: center; font-size: 10px; font-weight: 700; letter-spacing: .8px; color: #8fa1ad; background: #fff; }

        /* ---------- DESKTOP ---------- */
        @media (min-width: 960px) {
          .azl-split { flex-direction: row; padding: 16px; gap: 16px; background: #f2fafb; }
          .azl-hero {
            flex: 1.08; border-radius: 36px; padding: 44px 48px 0; min-height: calc(100dvh - 32px);
          }
          .azl-brand-logo { width: 50px; height: 50px; border-radius: 16px; }
          .azl-brand-logo img { width: 31px; }
          .azl-brand-name { font-size: 36px; }
          .azl-hero-copy { margin-top: 56px; max-width: 470px; }
          .azl-hero-copy p { font-size: 20px; }
          .azl-hero-desktop-only { display: block; margin: 28px 0 0; max-width: 470px; }
          .azl-hero-headline { margin: 0; font-size: clamp(40px, 4.4vw, 62px); line-height: 1.02; font-weight: 800; letter-spacing: -2.4px; }
          .azl-hero-headline span { color: #cffafe; }
          .azl-hero-points { display: flex; flex-wrap: wrap; gap: 10px; margin: 26px 0 0; padding: 0; list-style: none; }
          .azl-hero-points li { padding: 9px 15px; border-radius: 999px; font-size: 13px; font-weight: 700; background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.32); backdrop-filter: blur(6px); }
          .azl-illustration { max-width: 560px; margin-bottom: 0; }
          .azl-form-side { flex: .92; align-items: center; padding: 40px 32px; border-radius: 36px; box-shadow: 0 24px 60px rgba(15,23,42,.06); }
          .azl-title { font-size: 36px; }
          .azl-steps { grid-template-columns: repeat(3, 1fr); }
          .azl-how { padding-top: 40px; background: #f2fafb; }
          .azl-footer { background: #f2fafb; }
        }
        @media (min-width: 960px) and (max-height: 760px) {
          .azl-hero-copy { margin-top: 28px; }
        }
        @media (prefers-reduced-motion: reduce) { .azl-root { animation: none; } }
      `}</style>

      <div className="azl-split">
        {/* ---------------- HERO ---------------- */}
        <section className="azl-hero" aria-label="AZPHUR">
          <div className="azl-brand">
            <div className="azl-brand-logo"><img src="/logo-azphur.avif" alt="" /></div>
            <div className="azl-brand-name">AZPHUR<i>.</i></div>
          </div>

          <div className="azl-hero-copy">
            <p>Shaping sustainable<br />possibilities.</p>
            <div className="azl-hero-desktop-only">
              <h2 className="azl-hero-headline">What do you <span>need</span> today?</h2>
              <ul className="azl-hero-points">
                <li>Solar quotes</li>
                <li>EV charging</li>
                <li>Verified partners</li>
                <li>Funding options</li>
              </ul>
            </div>
          </div>

          <HeroIllustration />
        </section>

        {/* ---------------- LOGIN ---------------- */}
        <section className="azl-form-side">
          <div className="azl-card">
            {mode === 'login' ? (
              <>
                <h1 className="azl-title">Welcome Back</h1>
                <p className="azl-sub">Log in to your AZPHUR workspace to continue your project.</p>

                <form className="azl-form" onSubmit={handleLogin} noValidate={false}>
                  <label className="azl-field">
                    <MailIcon />
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="Email or phone"
                      aria-label="Email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>

                  <label className="azl-field">
                    <LockIcon />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Password"
                      aria-label="Password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="azl-eye"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      <EyeIcon off={!showPassword} />
                    </button>
                  </label>

                  <div className="azl-row">
                    <label className="azl-check">
                      <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                      <span className="azl-check-box">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                      </span>
                      Remember me
                    </label>
                    <button type="button" className="azl-link" onClick={() => { setMode('recovery'); setError(''); setNotice(''); }}>
                      Forgot Password?
                    </button>
                  </div>

                  {error && <p className="azl-msg azl-msg--error" role="alert">{error}</p>}

                  <button type="submit" className="azl-primary" disabled={loading}>
                    {loading ? 'Signing in…' : 'Log In'}
                  </button>
                </form>

                <div className="azl-divider">Or continue with</div>
                <div className="azl-social">
                  <button type="button" className="azl-social-btn" disabled={oauthLoading !== null} onClick={() => handleOAuth('google')}>
                    <GoogleIcon /> Google
                  </button>
                  <button type="button" className="azl-social-btn" disabled={oauthLoading !== null} onClick={() => handleOAuth('apple')}>
                    <AppleIcon /> Apple
                  </button>
                </div>

                <p className="azl-signup">
                  Don&apos;t have an account? <button type="button" onClick={onRegister}>Sign Up</button>
                </p>
                <p className="azl-secure">SECURE ACCESS · ENCRYPTED END TO END</p>
              </>
            ) : (
              <>
                <h1 className="azl-title">Reset password</h1>
                <p className="azl-sub">Enter the email of your account and we will send you a secure link to choose a new password.</p>

                <form className="azl-form" onSubmit={handleRecovery}>
                  <label className="azl-field">
                    <MailIcon />
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="Your account email"
                      aria-label="Account email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>

                  {error && <p className="azl-msg azl-msg--error" role="alert">{error}</p>}
                  {notice && <p className="azl-msg azl-msg--ok" role="status">{notice}</p>}

                  <button type="submit" className="azl-primary" disabled={loading}>
                    {loading ? 'Sending…' : 'Send reset link'}
                  </button>
                </form>

                <p className="azl-signup">
                  <button type="button" onClick={() => { setMode('login'); setError(''); setNotice(''); }}>← Back to Log In</button>
                </p>
              </>
            )}
          </div>
        </section>
      </div>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section className="azl-how" aria-label="How AZPHUR works">
        <div className="azl-how-inner">
          <p className="azl-how-head">HOW IT WORKS</p>
          <div className="azl-steps">
            <div className="azl-step"><b>01</b><div><strong>Create your account</strong><span>Sign up in seconds and get access to the workspace that fits you.</span></div></div>
            <div className="azl-step"><b>02</b><div><strong>Tell us what you need</strong><span>Request a free quote and compare proposals from verified partners.</span></div></div>
            <div className="azl-step"><b>03</b><div><strong>Track every step</strong><span>Follow your project from request to completion in one place.</span></div></div>
          </div>
        </div>
      </section>
      <footer className="azl-footer">© 2026 AZPHUR INC. ALL RIGHTS RESERVED.</footer>
    </div>
  );
}
