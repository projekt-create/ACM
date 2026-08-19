"use client";

import { useMutation } from "@tanstack/react-query";

export default function useUpdateProfile() {
  return useMutation({
    mutationFn: async (data) => {
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem("user");
        const user = stored ? JSON.parse(stored) : {};
        const updated = { ...user, ...data };
        window.localStorage.setItem("user", JSON.stringify(updated));
        return updated;
      }
      return data;
    },
  });
}
