import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Secure Voting System',
  description: 'A high-fidelity voting platform ensuring voter anonymity, immutability, and verifiable audit trails.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
