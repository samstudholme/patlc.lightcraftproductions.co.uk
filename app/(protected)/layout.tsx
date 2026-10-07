import Link from "next/link";
import { requirePageSession } from "@/lib/security";

export default async function ProtectedLayout({children}:{children:React.ReactNode}) {
  await requirePageSession();
  return <div className="shell"><header className="topbar"><div className="brand">Lincoln College PAT</div>
    <Link href="/dashboard">Dashboard</Link><Link href="/scan">Scan</Link><Link href="/find">Find Asset</Link><Link href="/register">PAT Register</Link>
    <form action="/api/auth/logout" method="post"><button>Sign out</button></form>
  </header><main className="content">{children}</main></div>;
}
