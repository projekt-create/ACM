"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export default function useActiveCategories() {
  return useQuery({
    queryKey: ["categories", "active"],
    queryFn: async () => {
      const response = await apiClient.get("/api/categories", { params: { isActive: true } });
      return response.data.data;
    },
  });
}
