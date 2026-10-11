// components/ui/AgentDemoModal.tsx
// Interactive live demo tester for any founder's voice AI agent

"use client";

import { useState } from "react";
import { Bot, Send, Volume2, Sparkles, X, Activity, Radio } from "lucide-react";
import { Button } from "./button";

interface AgentDemoModalProps {
  targetUserId: string;
  agentName?: string;
  founderName: string;
  startup?: string;
  onClose: () => void;
}

interface MessageTurn {
  sender: "user" | "agent";
  text: string;
  latencyMs?: number;
  timestamp: Date;
}

export function AgentDemoModal({
  targetUserId,
  agentName = "Founder Agent",
  founderName,
  startup,
  onClose,
}: AgentDemoModalProps) {
  const [messages, setMessages] = useState<MessageTurn[]>([
    {
      sender: "agent",
      text: `Hello! I'm ${agentName}, built by ${founderName}. Ask me anything about what we're building, or test my conversational latency!`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [lastLatency, setLastLatency] = useState<number | null>(null);

  const quickPrompts = [
    "Pitch me your startup in 2 sentences",
    "What's your voice AI stack & latency?",
    "Book a 15-minute demo call with me",
    "Tell me about your pricing model",
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isCalling) return;

    const userTurn: MessageTurn = {
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userTurn]);
    setInput("");
    setIsCalling(true);

    try {
      const res = await fetch("/api/agent/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          message: textToSend,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setLastLatency(data.latencyMs);

        const agentTurn: MessageTurn = {
          sender: "agent",
          text: data.reply,
          latencyMs: data.latencyMs,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, agentTurn]);

        // If Web Speech API is supported, speak the agent's response out loud!
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(data.reply);
            utterance.rate = 1.05;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
          } catch {
            // Speech synthesis failed or blocked by browser policy
          }
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "agent",
            text: data.error || "Agent could not be reached.",
            timestamp: new Date(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "agent",
          text: "Connection to agent failed. Please verify the webhook URL.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-5 text-white shadow-2xl max-w-lg w-full relative backdrop-blur-md">
      {/* Close button */}
      <button
        onClick={() => {
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }
          onClose();
        }}
        className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 relative">
          <Bot className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-white">{agentName}</h3>
            {lastLatency !== null && (
              <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Activity className="w-3 h-3" /> {lastLatency}ms TTFT
              </span>
            )}
          </div>
          <p className="text-white/40 text-xs">
            Created by <span className="text-white/70 font-semibold">{founderName}</span>
            {startup ? ` · ${startup}` : ""}
          </p>
        </div>
      </div>

      {/* Audio Visualizer Bar */}
      <div className="bg-black/50 border border-white/10 rounded-xl p-2.5 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-white/60">
          <Radio className={`w-4 h-4 ${isCalling ? "text-purple-400 animate-pulse" : "text-gray-500"}`} />
          <span className="font-mono text-[11px]">
            {isCalling ? "Agent streaming voice synthesis..." : "Interactive Voice Agent Online"}
          </span>
        </div>
        <div className="flex items-end gap-1 h-4">
          {[40, 70, 30, 90, 60, 100, 50, 80].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                isCalling ? "bg-purple-400" : "bg-white/20"
              }`}
              style={{
                height: isCalling ? `${h}%` : "30%",
                animation: isCalling ? `pulse 0.5s ease-in-out infinite ${i * 0.1}s` : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* Conversational Stream */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-3 h-56 overflow-y-auto space-y-2.5 mb-3">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3.5 py-2 text-xs leading-relaxed ${
                m.sender === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-white/10 text-white/90 rounded-bl-none border border-white/10"
              }`}
            >
              {m.text}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/30 mt-0.5 px-1 font-mono">
              <span>{m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
              {m.latencyMs !== undefined && (
                <span className="text-purple-400">({m.latencyMs}ms)</span>
              )}
            </div>
          </div>
        ))}
        {isCalling && (
          <div className="flex items-center gap-2 text-xs text-purple-400 font-mono py-1">
            <span className="animate-spin">🌀</span> Synthesizing response...
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {quickPrompts.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSend(q)}
            disabled={isCalling}
            className="text-[10px] bg-white/5 hover:bg-white/15 border border-white/10 rounded-lg px-2 py-1 text-white/70 transition-colors text-left"
          >
            &quot;{q}&quot;
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={`Talk with ${agentName}...`}
          disabled={isCalling}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400"
        />
        <Button
          onClick={() => handleSend()}
          disabled={isCalling || !input.trim()}
          size="sm"
          className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 rounded-xl"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
