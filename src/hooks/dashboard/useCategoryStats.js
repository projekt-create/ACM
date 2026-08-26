"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export default function useCategoryStats() {
  return useQuery({
    queryKey: ["DashboardCategory-stats"],
    queryFn: async () => {
      const res = await apiClient.get("api/dashboard/category-stats")
      return res.data
    }
  });
}
