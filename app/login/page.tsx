// app/login/page.tsx — Auth page
"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Mail, Github, Chrome } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  const handleOAuth = async (provider: string) => {
    setLoading(provider);
    await signIn(provider, { callbackUrl: "/dashboard" });
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading("email");
    await signIn("resend", { email, callbackUrl: "/dashboard", redirect: false });
    setMagicSent(true);
    setLoading(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      {/* Background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl shadow-xl">
              🎙️
            </div>
            <span className="font-pixel text-lg text-white">TrustVoice</span>
          </div>
          <p className="text-gray-400 text-sm">Sign in to enter the founders world</p>
        </div>

        {magicSent ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">✉️</div>
            <div className="text-white font-semibold mb-1">Check your inbox!</div>
            <div className="text-gray-400 text-sm">
              We sent a magic link to <strong>{email}</strong>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
            {/* OAuth buttons */}
            <button
              onClick={() => handleOAuth("google")}
              disabled={!!loading}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <Chrome className="w-5 h-5" />
              {loading === "google" ? "Connecting..." : "Continue with Google"}
            </button>

            <button
              onClick={() => handleOAuth("github")}
              disabled={!!loading}
              className="w-full flex items-center justify-center gap-3 bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50 border border-white/10"
            >
              <Github className="w-5 h-5" />
              {loading === "github" ? "Connecting..." : "Continue with GitHub"}
            </button>

            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <div className="flex-1 h-px bg-white/10" />
              <span>or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Magic link */}
            <form onSubmit={handleMagicLink} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@startup.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-400/50 text-sm"
                required
              />
              <button
                type="submit"
                disabled={!!loading || !email}
                className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                {loading === "email" ? "Sending..." : "Send Magic Link"}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-gray-600 text-xs mt-6">
          By signing in you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
