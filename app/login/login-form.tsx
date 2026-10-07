"use client";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter(); const ref = useRef<HTMLInputElement>(null); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const response = await fetch("/api/auth/login", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({pin:ref.current?.value}) });
    setBusy(false);
    if (!response.ok) { setError(response.status === 429 ? "Too many attempts. Try again shortly." : "Incorrect PIN"); ref.current?.select(); return; }
    router.push("/dashboard"); router.refresh();
  }
  return <form className="stack" action="/api/auth/login" method="post" onSubmit={submit}>
    <label>4-digit PIN<input ref={ref} name="pin" autoFocus required inputMode="numeric" pattern="[0-9]{4}" maxLength={4} type="password" autoComplete="current-password" /></label>
    {error && <div className="error" role="alert">{error}</div>}<button disabled={busy}>{busy?"Checking…":"Sign in"}</button>
  </form>;
}
