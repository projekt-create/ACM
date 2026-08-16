"use client";

import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

const API_URL = "https://backend.magnateshop.uz/";

export default function useLogin() {
  const { login } = useAuth();

  return useMutation({
    mutationFn: async (credentials) => {
      const response = await axios.post(`${API_URL}api/auth/login`, credentials);
      return response.data;
    },
    onSuccess: (response) => {
      login(response);
    },
  });
}
