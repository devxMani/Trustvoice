// components/ui/CharacterCustomizer.tsx
// Character and Voice Agent customization modal

"use client";

import { useState } from "react";
import { Check, Bot, Sparkles, User, Link as LinkIcon, Save, X } from "lucide-react";
import { Button } from "./button";

const SKIN_OPTIONS = [
  { id: "0", label: "Fair", color: "#ffcc99" },
  { id: "1", label: "Peach", color: "#ffaa77" },
  { id: "2", label: "Olive", color: "#cc8855" },
  { id: "3", label: "Bronze", color: "#99663c" },
  { id: "4", label: "Deep", color: "#663322" },
];

const OUTFIT_OPTIONS = [
  { id: "0", label: "Blaze", color: "#ff6633" },
  { id: "1", label: "Cobalt", color: "#3366ff" },
  { id: "2", label: "Emerald", color: "#33cc66" },
  { id: "3", label: "Violet", color: "#cc33cc" },
  { id: "4", label: "Gold", color: "#ffcc00" },
];

const HAIR_OPTIONS = [
  { id: "0", label: "Brunette", color: "#4a2c0a" },
  { id: "1", label: "Blonde", color: "#c8a832" },
  { id: "2", label: "Crimson", color: "#e04020" },
  { id: "3", label: "Navy", color: "#1040c0" },
  { id: "4", label: "Cyan", color: "#20a0c0" },
];

const PET_OPTIONS = [
  { id: "plant", name: "Sprout", emoji: "🌱", desc: "Starter companion for budding founders" },
  { id: "robot", name: "CyberBot", emoji: "🤖", desc: "Trained on millions of voice calls" },
  { id: "rocket", name: "Astra", emoji: "🚀", desc: "Fuel for hypergrowth startups" },
  { id: "crown", name: "Apex", emoji: "👑", desc: "Whale royalty with diamond aura" },
];

interface CharacterCustomizerProps {
  initialSkin?: string;
  initialOutfit?: string;
  initialHair?: string;
  initialPet?: string;
  initialAgentName?: string;
  initialAgentWebhookUrl?: string;
  initialStartup?: string;
  initialBio?: string;
  onSaveSuccess?: (updated: {
    characterSkin: string;
    characterOutfit: string;
    characterHair: string;
    petType: string;
    agentName?: string;
    agentWebhookUrl?: string;
    startup?: string;
    bio?: string;
  }) => void;
  onClose?: () => void;
}

export function CharacterCustomizer({
  initialSkin = "0",
  initialOutfit = "0",
  initialHair = "0",
  initialPet = "plant",
  initialAgentName = "",
  initialAgentWebhookUrl = "",
  initialStartup = "",
  initialBio = "",
  onSaveSuccess,
  onClose,
}: CharacterCustomizerProps) {
  const [skin, setSkin] = useState(initialSkin);
  const [outfit, setOutfit] = useState(initialOutfit);
  const [hair, setHair] = useState(initialHair);
  const [pet, setPet] = useState(initialPet);
  const [agentName, setAgentName] = useState(initialAgentName);
  const [agentWebhookUrl, setAgentWebhookUrl] = useState(initialAgentWebhookUrl);
  const [startup, setStartup] = useState(initialStartup);
  const [bio, setBio] = useState(initialBio);
  const [activeSection, setActiveSection] = useState<"avatar" | "agent" | "founder">("avatar");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/profile/customize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterSkin: skin,
          characterOutfit: outfit,
          characterHair: hair,
          petType: pet,
          agentName,
          agentWebhookUrl,
          startup,
          bio,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        onSaveSuccess?.({
          characterSkin: skin,
          characterOutfit: outfit,
          characterHair: hair,
          petType: pet,
          agentName,
          agentWebhookUrl,
          startup,
          bio,
        });

        // Broadcast to Phaser game scene via custom event so the sprite refreshes immediately
        window.dispatchEvent(
          new CustomEvent("trustvoice-customization-updated", {
            detail: { characterSkin: skin, characterOutfit: outfit, petType: pet },
          })
        );

        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const selectedSkinObj = SKIN_OPTIONS.find((s) => s.id === skin) || SKIN_OPTIONS[0];
  const selectedOutfitObj = OUTFIT_OPTIONS.find((o) => o.id === outfit) || OUTFIT_OPTIONS[0];
  const selectedHairObj = HAIR_OPTIONS.find((h) => h.id === hair) || HAIR_OPTIONS[0];
  const selectedPetObj = PET_OPTIONS.find((p) => p.id === pet) || PET_OPTIONS[0];

  return (
    <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 text-white shadow-2xl max-w-md w-full relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xl">
          ✨
        </div>
        <div>
          <h3 className="font-bold text-base text-white">Founder Studio</h3>
          <p className="text-white/40 text-xs">Customize avatar, companion pet & AI agent</p>
        </div>
      </div>

      {/* Live Avatar Preview Badge */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-3 mb-4 flex items-center justify-around">
        <div className="flex flex-col items-center">
          <div className="text-[10px] text-white/50 mb-1 font-mono">AVATAR</div>
          <div className="relative w-14 h-16 rounded-lg bg-gray-800 border border-white/20 flex flex-col items-center justify-center overflow-hidden">
            {/* Hair */}
            <div
              className="w-8 h-3 rounded-t-sm"
              style={{ backgroundColor: selectedHairObj.color }}
            />
            {/* Face */}
            <div
              className="w-7 h-5 flex items-center justify-around px-1"
              style={{ backgroundColor: selectedSkinObj.color }}
            >
              <div className="w-1 h-1 bg-black rounded-full" />
              <div className="w-1 h-1 bg-black rounded-full" />
            </div>
            {/* Shirt */}
            <div
              className="w-9 h-6 rounded-b-sm"
              style={{ backgroundColor: selectedOutfitObj.color }}
            />
          </div>
          <span className="text-[10px] text-white/70 mt-1 font-semibold">{selectedOutfitObj.label}</span>
        </div>

        <div className="h-12 w-px bg-white/10" />

        <div className="flex flex-col items-center">
          <div className="text-[10px] text-white/50 mb-1 font-mono">PET</div>
          <div className="w-14 h-16 rounded-lg bg-gray-800 border border-white/20 flex items-center justify-center text-3xl">
            {selectedPetObj.emoji}
          </div>
          <span className="text-[10px] text-white/70 mt-1 font-semibold">{selectedPetObj.name}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-white/5 rounded-lg p-1 mb-4">
        <button
          onClick={() => setActiveSection("avatar")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
            activeSection === "avatar" ? "bg-white/15 text-white" : "text-white/40 hover:text-white"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Avatar
        </button>
        <button
          onClick={() => setActiveSection("agent")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
            activeSection === "agent" ? "bg-white/15 text-white" : "text-white/40 hover:text-white"
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          Voice Agent
        </button>
        <button
          onClick={() => setActiveSection("founder")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
            activeSection === "founder" ? "bg-white/15 text-white" : "text-white/40 hover:text-white"
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          Profile
        </button>
      </div>

      {/* Tab: Avatar */}
      {activeSection === "avatar" && (
        <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
          {/* Skin Tone */}
          <div>
            <label className="text-xs text-white/70 block mb-1.5 font-medium">Skin Tone</label>
            <div className="flex gap-2">
              {SKIN_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSkin(opt.id)}
                  className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all ${
                    skin === opt.id ? "border-white scale-110 shadow-lg" : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: opt.color }}
                  title={opt.label}
                >
                  {skin === opt.id && <Check className="w-4 h-4 text-black stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Outfit Color */}
          <div>
            <label className="text-xs text-white/70 block mb-1.5 font-medium">Outfit Palette</label>
            <div className="flex gap-2">
              {OUTFIT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setOutfit(opt.id)}
                  className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all ${
                    outfit === opt.id ? "border-white scale-110 shadow-lg" : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: opt.color }}
                  title={opt.label}
                >
                  {outfit === opt.id && <Check className="w-4 h-4 text-black stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Hair Color */}
          <div>
            <label className="text-xs text-white/70 block mb-1.5 font-medium">Hair Color</label>
            <div className="flex gap-2">
              {HAIR_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setHair(opt.id)}
                  className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all ${
                    hair === opt.id ? "border-white scale-110 shadow-lg" : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: opt.color }}
                  title={opt.label}
                >
                  {hair === opt.id && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Companion Pet */}
          <div>
            <label className="text-xs text-white/70 block mb-1.5 font-medium">Companion Pet</label>
            <div className="grid grid-cols-2 gap-2">
              {PET_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setPet(opt.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                    pet === opt.id
                      ? "border-blue-500 bg-blue-500/15"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{opt.name}</div>
                    <div className="text-[10px] text-white/40 truncate">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Voice Agent */}
      {activeSection === "agent" && (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          <div>
            <label className="text-xs text-white/70 block mb-1">Agent Name</label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="e.g. Maya AI, Nexus Voice"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="text-xs text-white/70 block mb-1">
              Live Agent Webhook URL
            </label>
            <input
              type="url"
              value={agentWebhookUrl}
              onChange={(e) => setAgentWebhookUrl(e.target.value)}
              placeholder="https://api.vapi.ai/... or your server"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400 font-mono"
            />
            <p className="text-[10px] text-white/40 mt-1">
              When other founders click &quot;Demo My Agent&quot;, TrustVoice will POST their query directly to this webhook and stream the response!
            </p>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-xs text-purple-200">
            <span className="font-bold flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Compatible Providers
            </span>
            Works out of the box with Vapi, Bland.ai, Retell, ElevenLabs Conversational, or any HTTP JSON endpoint.
          </div>
        </div>
      )}

      {/* Tab: Founder Profile */}
      {activeSection === "founder" && (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          <div>
            <label className="text-xs text-white/70 block mb-1">Startup / Company</label>
            <input
              type="text"
              value={startup}
              onChange={(e) => setStartup(e.target.value)}
              placeholder="e.g. VoiceScale.ai"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-xs text-white/70 block mb-1">Founder Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Building ultra-low latency voice dispatch for logistics..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>
        </div>
      )}

      {/* Footer / Save Button */}
      <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
        {savedSuccess ? (
          <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Saved & Updated Live!
          </span>
        ) : (
          <span className="text-[10px] text-white/40 font-mono">Changes sync in real-time</span>
        )}

        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4"
        >
          <Save className="w-3.5 h-3.5 mr-1.5" />
          {saving ? "Saving..." : "Save Customization"}
        </Button>
      </div>
    </div>
  );
}
