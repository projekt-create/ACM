"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export default function usePickupPoints(params) {
  return useQuery({
    queryKey: ["pickup-points", params],
    queryFn: async () => {
      const response = await apiClient.get("/api/pickup-points", { params });
      return response.data;
    },
  });
}
