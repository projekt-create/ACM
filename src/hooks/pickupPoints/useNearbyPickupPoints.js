"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export default function useNearbyPickupPoints(params) {
  const enabled = !!(params?.lat && params?.lng);
  return useQuery({
    queryKey: ["pickup-points-nearby", params],
    queryFn: async () => {
      const response = await apiClient.get("/api/pickup-points/nearby", { params });
      return response.data;
    },
    enabled,
  });
}
