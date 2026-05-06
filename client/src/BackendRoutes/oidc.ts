import { api } from "./axios";

export async function getToken(code, freeAPI) {
  // GET http://localhost:3000/oidc/authorize
  let res;
  if (!freeAPI) {
    res = await api.get<string>(`/api/oauth2/${code}`);
  } else {
    res = await api.get<string>(`/api/freeAPI/${code}`);
  }

  return res.data;
}
export async function healthRoute() {
  const res = await api.get<string>(`/health`);
  return res.data;
}
