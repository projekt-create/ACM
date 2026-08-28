"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export function usePickupPointCities() {
  return useQuery({
    queryKey: ["pickup-points-cities"],
    queryFn: async () => {
      const response = await apiClient.get("/api/pickup-points/cities");
      return response.data;
    },
  });
}

export function usePickupPointProducts(id, params) {
  return useQuery({
    queryKey: ["pickup-point-products", id, params],
    queryFn: async () => {
      const response = await apiClient.get(`/api/pickup-points/${id}/products`, { params });
      return response.data;
    },
    enabled: !!id,
  });
}
