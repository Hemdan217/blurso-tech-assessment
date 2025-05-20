import "./globals.css";
import { Inter } from "next/font/google";
import { NextAuthProvider } from "@/providers/next-auth-provider";
import { Toaster } from "@/components/ui/toaster";
import { Chatbot } from "@/components/chatbot";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Blurr.so HR Portal",
  description: "Internal HR portal for Blurr.so",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className={inter.className}>
        <NextAuthProvider>
          {children}
          <Toaster />
          <Chatbot />
        </NextAuthProvider>
      </body>
    </html>
  );
}
