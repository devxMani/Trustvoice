// app/dashboard/DashboardClient.tsx
// Client component for the Stripe verification form

"use client";

import { useState } from "react";
import { ExternalLink, Key, CheckCircle } from "lucide-react";

interface DashboardClientProps {
  hasStripe: boolean;
  connectUrl: string;
}

export function DashboardClient({ hasStripe, connectUrl }: DashboardClientProps) {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    revenueCents: number;
    tier: string;
    chargeCount: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [method, setMethod] = useState<"connect" | "key">("key");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/stripe/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Verification failed");
      } else {
        setResult(data);
        setApiKey("");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 text-center">
        <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
        <div className="text-green-400 font-bold text-lg">
          ${(result.revenueCents / 100).toLocaleString()} verified
        </div>
        <div className="text-gray-400 text-sm mt-1">
          {result.chargeCount} charges · Tier: <strong className="text-white">{result.tier}</strong>
        </div>
        <div className="text-gray-500 text-xs mt-3">
          Revenue re-verified every 24h. Refresh the page to see your new tier.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Method selector */}
      <div className="flex rounded-xl bg-white/5 p-1 gap-1">
        <button
          onClick={() => setMethod("key")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            method === "key"
              ? "bg-white/10 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          API Key
        </button>
        <button
          onClick={() => setMethod("connect")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            method === "connect"
              ? "bg-white/10 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Stripe Connect
        </button>
      </div>

      {method === "key" ? (
        <form onSubmit={handleVerify} className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Stripe Secret Key (read-only recommended)
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk_live_..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-400/50 text-sm font-mono"
              />
            </div>
            <p className="text-gray-600 text-xs mt-1">
              Use a restricted key with read-only access to Charges.
            </p>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !apiKey.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Verifying..." : "Verify Revenue"}
          </button>
        </form>
      ) : (
        <div className="text-center space-y-3">
          <p className="text-gray-400 text-sm">
            Connect via Stripe OAuth for automatic re-verification.
          </p>
          {hasStripe ? (
            <div className="text-green-400 text-sm flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Stripe already connected
            </div>
          ) : (
            <a
              href={connectUrl}
              className="inline-flex items-center gap-2 bg-[#635BFF] hover:bg-[#5248e8] text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Connect with Stripe
            </a>
          )}
        </div>
      )}
    </div>
  );
}
