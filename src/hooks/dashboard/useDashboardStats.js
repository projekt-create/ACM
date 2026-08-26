"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export default function useDashboardStats() {
  return useQuery({
    queryKey: ["DashboardStats"],
    queryFn: async () => {
      const res = await apiClient.get("api/dashboard/stats")
      return res.data
    }
  })
}
