import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";
import { CacheProvider } from "@/context/CacheContext";

const inter = Inter({ subsets: ["latin"] });

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4F46E5", // Indigo color from your theme
};

export const metadata = {
  title: "CodeReflex - AI-Powered Interview Platform",
  description: "Practice interviews with AI and get real-time feedback",
  icons: {
    icon: [
      {
        url: "/icon.png",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "/icon-192.png",
        type: "image/png",
        sizes: "192x192",
      },
      {
        url: "/icon-512.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    shortcut: [{ url: "/icon.png", type: "image/png" }],
    apple: {
      url: "/apple-icon.png",
      type: "image/png",
      sizes: "180x180",
    },
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CacheProvider>
          <ToastProvider>{children}</ToastProvider>
        </CacheProvider>
      </body>
    </html>
  );
}
