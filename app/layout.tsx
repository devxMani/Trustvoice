// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrustVoice — The Voice-AI Founders World",
  description:
    "A pixel-art multiplayer world exclusively for voice-AI founders. Connect Stripe to verify revenue and unlock new zones.",
  keywords: ["voice AI", "founders", "pixel world", "multiplayer", "LiveKit"],
  openGraph: {
    title: "TrustVoice — The Voice-AI Founders World",
    description: "Verified revenue. Real founders. Spatial voice.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Pixel font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
