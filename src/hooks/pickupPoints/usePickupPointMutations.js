"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export function useCreatePickupPoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const response = await apiClient.post("/api/pickup-points", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickup-points"] });
      queryClient.invalidateQueries({ queryKey: ["pickup-points-cities"] });
    },
  });
}

export function useUpdatePickupPoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isPut = false, data }) => {
      const response = isPut
        ? await apiClient.put(`/api/pickup-points/${id}`, data)
        : await apiClient.patch(`/api/pickup-points/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pickup-points"] });
      queryClient.invalidateQueries({ queryKey: ["pickup-point", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["pickup-points-cities"] });
    },
  });
}

export function useUpdatePickupPointStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }) => {
      const response = await apiClient.patch(`/api/pickup-points/${id}/status`, { isActive });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pickup-points"] });
      queryClient.invalidateQueries({ queryKey: ["pickup-point", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["pickup-points-cities"] });
    },
  });
}

export function useDeletePickupPoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.delete(`/api/pickup-points/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickup-points"] });
      queryClient.invalidateQueries({ queryKey: ["pickup-points-cities"] });
    },
  });
}

export function useUploadPickupPointImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData, onUploadProgress }) => {
      const response = await apiClient.post(`/api/pickup-points/${id}/image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pickup-points"] });
      queryClient.invalidateQueries({ queryKey: ["pickup-point", variables.id] });
    },
  });
}

export function useDeletePickupPointImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.delete(`/api/pickup-points/${id}/image`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["pickup-points"] });
      queryClient.invalidateQueries({ queryKey: ["pickup-point", id] });
    },
  });
}

export function useUploadPickupPointVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData, onUploadProgress }) => {
      const response = await apiClient.post(`/api/pickup-points/${id}/video`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pickup-points"] });
      queryClient.invalidateQueries({ queryKey: ["pickup-point", variables.id] });
    },
  });
}

export function useDeletePickupPointVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.delete(`/api/pickup-points/${id}/video`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["pickup-points"] });
      queryClient.invalidateQueries({ queryKey: ["pickup-point", id] });
    },
  });
}
