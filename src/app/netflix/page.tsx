"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { NetflixDashboard } from "@/components/netflix/NetflixDashboard";

export default function NetflixLobbyPage() {
  const router = useRouter();

  return (
    <NetflixDashboard
      onSwitchToWatchParty={() => {
        router.push("/");
      }}
    />
  );
}
