"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export default function useAdmins() {
  return useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      const response = await apiClient.get("/api/admins");
      return response.data.data;
    },
  });
}
