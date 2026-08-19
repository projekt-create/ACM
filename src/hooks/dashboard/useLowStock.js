"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export default function useLowStock(threshold = 5) {
  return useQuery({
    queryKey: ["dashboard", "low-stock", threshold],
    queryFn: async () => (await apiClient.get("/api/dashboard/low-stock", { params: { threshold } })).data,
  });
}
