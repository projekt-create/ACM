"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export default function useUpdateCar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isStatusChange, ...data }) => {
      const url = isStatusChange ? `/api/products/${id}/status` : `/api/products/${id}`;
      const response = await apiClient.patch(url, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      queryClient.invalidateQueries({ queryKey: ["car", variables.id] });
    },
  });
}
