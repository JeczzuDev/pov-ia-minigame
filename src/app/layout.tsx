import { type Metadata } from 'next'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import UserSyncer from '../components/UserSyncer'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'POVIA Minigame',
  description: '¡Tu eres la IA! Responde los prompts lo más rápido posible y suma puntos en el ranking.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  return (
    <ClerkProvider appearance={
      { baseTheme: dark,
        variables: {
          colorPrimary: '#1c398e',
          colorBackground: '#0a0a0a',
          colorText: '#ffffff',
          colorTextOnPrimaryBackground: '#ffffff',
        } }}>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <header className="flex justify-end items-center p-4 gap-4 h-16">
            <SignedOut>
              <SignInButton mode="modal" />
              <SignUpButton mode="modal" />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          <UserSyncer />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}