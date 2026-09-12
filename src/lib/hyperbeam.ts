interface HyperbeamApiResponse {
  session_id: string;
  embed_url: string;
  admin_token?: string;
}

// In-memory room session cache to keep all room members in the same VM session
const roomSessions = new Map<string, HyperbeamApiResponse>();

export async function getOrCreateHyperbeamSession(
  roomId: string,
  startUrl: string = "https://www.youtube.com"
): Promise<{
  sessionId: string;
  embedUrl: string;
  adminToken?: string;
  isDemo: boolean;
  message?: string;
}> {
  const apiKey = process.env.HYPERBEAM_API_KEY;

  // If no valid API key configured, return demo fallback
  if (
    !apiKey ||
    apiKey.trim() === "" ||
    apiKey.includes("your_key") ||
    apiKey.includes("your_hyperbeam")
  ) {
    return {
      sessionId: `demo-${roomId}`,
      embedUrl: "",
      isDemo: true,
      message: "Hyperbeam API key not configured. Running in interactive demo mode.",
    };
  }

  // Check if session already exists for this room
  const existing = roomSessions.get(roomId);
  if (existing) {
    return {
      sessionId: existing.session_id,
      embedUrl: existing.embed_url,
      adminToken: existing.admin_token,
      isDemo: false,
    };
  }

  // Request new VM session from Hyperbeam REST API
  try {
    const res = await fetch("https://engine.hyperbeam.com/v0/vm", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        start_url: startUrl,
        kiosk: false,
        timeout: {
          absolute: 7200, // 2 hours
          warning: 300,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Hyperbeam API error:", res.status, errText);
      throw new Error(`Hyperbeam API returned status ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as HyperbeamApiResponse;
    roomSessions.set(roomId, data);

    return {
      sessionId: data.session_id,
      embedUrl: data.embed_url,
      adminToken: data.admin_token,
      isDemo: false,
    };
  } catch (error) {
    console.error("Failed to create Hyperbeam VM session:", error);
    return {
      sessionId: `error-${roomId}`,
      embedUrl: "",
      isDemo: true,
      message: error instanceof Error ? error.message : "Failed to connect to Hyperbeam API",
    };
  }
}
