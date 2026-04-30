import { api } from "./axios";

export async function getToken(code) {
  // GET http://localhost:3000/oidc/authorize
  const res = await api.get<string>(`/api/oauth2/${code}`);
  return res.data;
}
