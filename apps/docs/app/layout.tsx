import { Sidebar } from '@/components/Sidebar';
// SPDX-License-Identifier: Apache-2.0
import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Forge Docs',
  description: 'Dogfood docs site authored through the Forge producer loop.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          <Sidebar />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
