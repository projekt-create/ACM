"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export default function useAdmin(id) {
  return useQuery({
    queryKey: ["admin", id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/admins/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}
