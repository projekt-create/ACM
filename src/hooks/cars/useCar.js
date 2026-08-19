"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export default function useCar(id) {
  return useQuery({
    queryKey: ["car", id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/products/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}
