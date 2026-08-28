"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export function useGeocode(lat, lng) {
  return useQuery({
    queryKey: ["pickup-points-geocode", lat, lng],
    queryFn: async () => {
      const response = await apiClient.get("/api/pickup-points/geocode", {
        params: { lat, lng },
      });
      return response.data;
    },
    enabled: lat !== undefined && lat !== null && lng !== undefined && lng !== null,
  });
}

export function useGeocodeSearch(query) {
  return useQuery({
    queryKey: ["pickup-points-geocode-search", query],
    queryFn: async () => {
      const response = await apiClient.get("/api/pickup-points/geocode/search", {
        params: { q: query },
      });
      return response.data;
    },
    enabled: !!query && query.trim().length > 2,
  });
}
