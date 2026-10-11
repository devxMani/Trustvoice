// app/api/agent/demo/route.ts
// POST: Proxies speech or text query to a founder's Voice Agent webhook
// Supports custom endpoints, Vapi, Bland AI, or provides intelligent fallback demo

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { targetUserId, message } = body as {
      targetUserId: string;
      message?: string;
    };

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    const targetProfile = await prisma.profile.findUnique({
      where: { userId: targetUserId },
      include: {
        user: { select: { name: true } },
      },
    });

    if (!targetProfile) {
      return NextResponse.json({ error: "Agent owner not found" }, { status: 404 });
    }

    const agentName = targetProfile.agentName || `${targetProfile.user.name || "Founder"}'s Voice Agent`;
    const userQuery = message || "Hello! Can you introduce yourself and tell me what you build?";

    const startTime = Date.now();

    // If the founder has provided a webhook URL, attempt to call it
    if (targetProfile.agentWebhookUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout

        const response = await fetch(targetProfile.agentWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "TrustVoice-AgentProxy/1.0",
          },
          body: JSON.stringify({
            caller: session.user.name || "Anonymous Founder",
            callerId: session.user.id,
            query: userQuery,
            timestamp: new Date().toISOString(),
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json().catch(() => null);
          const latencyMs = Date.now() - startTime;
          const replyText =
            data?.reply ||
            data?.message ||
            data?.transcript ||
            (typeof data === "string" ? data : JSON.stringify(data));

          return NextResponse.json({
            success: true,
            agentName,
            reply: replyText || "I received your message! (Connected via live webhook)",
            latencyMs,
            audioUrl: data?.audioUrl || null,
            startup: targetProfile.startup,
            isLiveWebhook: true,
          });
        }
      } catch (webhookErr) {
        console.warn("[agent/demo] Webhook call failed, falling back to simulation:", webhookErr);
      }
    }

    // Default intelligent simulation if no webhook configured or during development
    const latencyMs = Math.floor(Math.random() * 80) + 120; // 120-200ms realistic voice AI TTFT
    const simulatedReplies = [
      `Hey! I'm ${agentName} built by ${targetProfile.user.name || "this founder"}. We're building voice infrastructure at ${targetProfile.startup || "stealth"}. Our verified revenue is tier ${targetProfile.tier}! What kind of voice stack are you building?`,
      `Hi there! Thanks for testing ${agentName}. We handle inbound customer workflows with sub-300ms latency. Glad to meet another founder in the ${targetProfile.tier} zone!`,
      `What's up! I'm an autonomous outbound agent for ${targetProfile.startup || "voice workflows"}. You can connect your own webhook in dashboard settings to replace this demo with your live Vapi/Bland endpoint!`,
    ];

    const reply = simulatedReplies[Math.floor(Math.random() * simulatedReplies.length)];

    return NextResponse.json({
      success: true,
      agentName,
      reply,
      latencyMs,
      audioUrl: null,
      startup: targetProfile.startup,
      isLiveWebhook: false,
    });
  } catch (error) {
    console.error("[agent/demo]", error);
    return NextResponse.json({ error: "Agent invocation failed" }, { status: 500 });
  }
}
