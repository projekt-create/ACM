"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export default function usePickupPointStats() {
  return useQuery({
    queryKey: ["DashboardPickup-point-stats"],
    queryFn: async () => {
      const res = await apiClient.get("api/dashboard/pickup-point-stats")
      return res.data
    }
  })
}
