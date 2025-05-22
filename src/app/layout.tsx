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
import Image from 'next/image'
import Link from 'next/link'
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
          colorPrimary: '#ffffff',
          colorBackground: '#101828',
          colorText: '#ffffff',
          colorTextSecondary: '#ffffff',
          colorInputText: '#ffffff',
          colorInputBackground: '#101828',
          colorTextOnPrimaryBackground: '#101828',
        } }}>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900`}>
          <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b-[2px] border-gray-800">
            <div className="max-w-3xl mx-auto px-4">
              <div className="flex justify-between items-center h-16">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                <h1 className="hidden" aria-hidden="true">POVIA Minigame</h1>                
                  <div className="relative h-10 w-32">
                    <Image 
                      src="/pov-ia-logo.webp" 
                      alt="POV-IA Logo"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </Link>

                <nav className="flex items-center gap-2">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="px-4 py-2 text-md font-semibold text-white hover:bg-blue-900/50 rounded-md transition-colors cursor-pointer">
                        Iniciar sesión
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="px-4 py-2 text-md font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors cursor-pointer">
                        Registrarse
                      </button>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    <UserButton />
                  </SignedIn>
                </nav>
              </div>
            </div>
          </header>
          <UserSyncer />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}