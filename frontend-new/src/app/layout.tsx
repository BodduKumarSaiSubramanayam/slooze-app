import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import dynamic from 'next/dynamic';

const ApolloWrapper = dynamic(() => import('@/lib/apollo-provider'), {
  ssr: false,
});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Slooze - Food Ordering',
  description: 'Role-based food ordering platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ApolloWrapper>
          <main className="min-h-screen bg-gray-50 flex flex-col">
            {children}
          </main>
        </ApolloWrapper>
      </body>
    </html>
  );
}
