"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export default function useApiHealth() {
  return useQuery({
    queryKey: ["api-health"],
    queryFn: async () => {
      const response = await apiClient.get("/api");
      return response.data;
    },
  });
}
