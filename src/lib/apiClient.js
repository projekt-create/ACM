import axios from "axios";

function getAccessToken() {
  if (typeof document === "undefined") return null;

  const token = document.cookie
    .split("; ")
    .find((item) => item.startsWith("access_token="))
    ?.split("=")[1];

  return token ? decodeURIComponent(token) : null;
}

const apiClient = axios.create({
  baseURL: "https://backend.magnateshop.uz",
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
