"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export default function useCars(params) {
  return useQuery({
    queryKey: ["cars", params],
    queryFn: async () => {
      const response = await apiClient.get("/api/products", { params });
      return response.data.data;
    },
  });
}
