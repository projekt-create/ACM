"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export default function usePickupPoint(id) {
  return useQuery({
    queryKey: ["pickup-point", id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/pickup-points/${id}`);
      return response.data.data || response.data;
    },
    enabled: !!id,
  });
}
