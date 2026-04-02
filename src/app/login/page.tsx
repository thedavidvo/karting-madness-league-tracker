import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { login } from "@/app/actions";
import { hasStoredCredentials, isAuthenticated } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getError(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await isAuthenticated()) {
    redirect("/");
  }

  const resolved = (await searchParams) ?? {};
  const errorCode = getError(resolved.error);
  const hasCredentials = hasStoredCredentials();

  return (
    <main className="container login-page-shell">
      <section className="card stack-sm login-card">
        <Image src="/Karting-Madness.png" alt="Karting Madness" width={200} height={58} priority />
        <p className="eyebrow">Karting Madness League Tracker</p>
        <h1>Sign In</h1>
        <p className="small muted">Use your dashboard username and password to continue.</p>

        {!hasCredentials ? (
          <p className="small" style={{ color: "#f7b0a9" }}>
            Login credentials are not configured yet. Temporary access is enabled for now.
          </p>
        ) : null}

        {errorCode === "invalid-credentials" ? <p className="small" style={{ color: "#f7b0a9" }}>Invalid username or password.</p> : null}
        {errorCode === "missing-config" ? (
          <p className="small" style={{ color: "#f7b0a9" }}>
            Missing login credentials. Add DASHBOARD_USERNAME and DASHBOARD_PASSWORD in your .env file.
          </p>
        ) : null}

        <form action={login} className="stack-sm">
          <label>
            Username
            <input name="username" autoComplete="username" required />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button type="submit">Sign In</button>
        </form>

        <div className="split-links" style={{ justifyContent: "flex-start" }}>
          <Link href="/standings" className="small-button">
            View Public Standings
          </Link>
        </div>

      </section>
    </main>
  );
}
