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
  error?: string;
}> {
  const apiKey = process.env.HYPERBEAM_API_KEY?.trim();

  if (!apiKey || apiKey.includes("your_key") || apiKey.includes("your_hyperbeam")) {
    return {
      sessionId: "",
      embedUrl: "",
      error: "Hyperbeam API key is not configured in environment variables.",
    };
  }

  // Check if session already exists for this room
  const existing = roomSessions.get(roomId);
  if (existing) {
    return {
      sessionId: existing.session_id,
      embedUrl: existing.embed_url,
      adminToken: existing.admin_token,
    };
  }

  // Helper to send creation request to Hyperbeam REST API
  const requestVmCreation = async () => {
    return await fetch("https://engine.hyperbeam.com/v0/vm", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        start_url: startUrl || "https://www.youtube.com",
        kiosk: false,
        timeout: {
          absolute: 7200, // 2 hours
          warning: 300,
        },
      }),
    });
  };

  try {
    let res = await requestVmCreation();

    // If active VM limit was exceeded (e.g. 1 concurrent VM limit on test/starter tier),
    // automatically cleanup stale previous VMs and retry immediately.
    if (res.status === 400) {
      const errJson = await res.clone().json().catch(() => ({}));
      if (errJson.code === "err_exceeded_vm_limit") {
        console.warn("Hyperbeam VM limit reached. Automatically terminating stale previous VMs...");
        try {
          const listRes = await fetch("https://engine.hyperbeam.com/v0/vm", {
            headers: { Authorization: `Bearer ${apiKey}` },
          });

          if (listRes.ok) {
            const listData = (await listRes.json()) as { results?: Array<{ id: string }> };
            for (const vm of listData.results || []) {
              console.log("Terminating stale VM:", vm.id);
              await fetch(`https://engine.hyperbeam.com/v0/vm/${vm.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${apiKey}` },
              }).catch(() => {});
            }
            // Retry VM creation
            res = await requestVmCreation();
          }
        } catch (cleanupErr) {
          console.error("Failed to clean up stale Hyperbeam VMs:", cleanupErr);
        }
      }
    }

    // If rate-limited (429), seamlessly attach to the active running VM on the account
    if (res.status === 429) {
      console.warn("Hyperbeam rate limit hit. Recovering active VM session...");
      try {
        const listRes = await fetch("https://engine.hyperbeam.com/v0/vm", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (listRes.ok) {
          const listData = (await listRes.json()) as { results?: Array<{ id: string }> };
          const activeVm = listData.results?.[0];
          if (activeVm?.id) {
            const detailRes = await fetch(`https://engine.hyperbeam.com/v0/vm/${activeVm.id}`, {
              headers: { Authorization: `Bearer ${apiKey}` },
            });
            if (detailRes.ok) {
              const activeData = (await detailRes.json()) as HyperbeamApiResponse;
              roomSessions.set(roomId, activeData);
              return {
                sessionId: activeData.session_id,
                embedUrl: activeData.embed_url,
                adminToken: activeData.admin_token,
              };
            }
          }
        }
      } catch (rateLimitErr) {
        console.error("Rate limit recovery error:", rateLimitErr);
      }
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error("Hyperbeam API error:", res.status, errText);
      return {
        sessionId: "",
        embedUrl: "",
        error: `Hyperbeam API error (${res.status}): ${errText}`,
      };
    }

    const data = (await res.json()) as HyperbeamApiResponse;
    roomSessions.set(roomId, data);

    return {
      sessionId: data.session_id,
      embedUrl: data.embed_url,
      adminToken: data.admin_token,
    };
  } catch (error) {
    console.error("Failed to create Hyperbeam VM session:", error);
    return {
      sessionId: "",
      embedUrl: "",
      error: error instanceof Error ? error.message : "Failed to connect to Hyperbeam API",
    };
  }
}
