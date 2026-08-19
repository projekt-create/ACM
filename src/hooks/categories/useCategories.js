"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export default function useCategories(params) {
  return useQuery({
    queryKey: ["categories", params],
    queryFn: async () => {
      const response = await apiClient.get("/api/categories", { params });
      return response.data.data;
    },
  });
}
