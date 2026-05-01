import { api } from "./axios";

export async function getCheckBoxState() {
  const res = await api.get(`/api/checkboxState`);
  return res.data;
}
