import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/security";
import LoginForm from "./login-form";

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/dashboard");
  return <main className="auth"><section className="auth-card">
    <p className="muted">Lincoln College</p><h1>PAT Test &amp; Trace</h1>
    <LoginForm />
  </section></main>;
}
