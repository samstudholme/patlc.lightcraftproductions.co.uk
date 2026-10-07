import "./globals.css";

export const metadata = { title: "Lincoln College PAT", description: "PAT Test & Trace" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
