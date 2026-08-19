"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export default function useCategoryStats() {
  return useQuery({
    queryKey: ["dashboard", "category-stats"],
    queryFn: async () => (await apiClient.get("/api/dashboard/category-stats")).data,
  });
}
