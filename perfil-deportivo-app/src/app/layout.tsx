import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Potrero Deportivo",
  description:
    "Llevá el registro de tus clubes, partidos y puntos, y compartí tu perfil deportivo en redes sociales.",
  // Habilita "Instalar app" / "Agregar a inicio" (celular y PC). Los iconos
  // (favicon, apple-touch-icon, 192/512 del manifest) se generan en
  // icon.tsx, apple-icon.tsx e icon-192/icon-512 -- ver src/lib/appIcon.tsx.
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    title: "Potrero Deportivo",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#1568b8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Footer />
      </body>
    </html>
  );
}
