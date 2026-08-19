"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export default function useCategory(id) {
  return useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/categories/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}
