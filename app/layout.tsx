import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Prism — Evidence before confidence', description: 'Challenge the headline. Trace the evidence. A transparent data investigation lab.', icons: {icon:'/favicon.svg'} };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
