import { post } from "@/apis";
import { ENDPOINT } from "@/lib";
import { clearSession, saveSession } from "@/lib/auth/refreshToken";
import { LoginCredentials, LoginResponse } from "@/src/types";

export async function loginFn(credentials: LoginCredentials) {
  const response = await post<LoginResponse>(ENDPOINT.auth.login, credentials);

  if (response.code !== "200" || !response.data) {
    throw new Error(response.message);
  }

  await saveSession(response.data);
  return response.data;
}

export async function logoutFn(idUser: number) {
  const data = {
    user_id: idUser,
  };
  const response = await post<LoginResponse>(ENDPOINT.auth.logout, data);

  await clearSession();

  if (response.code !== "200") {
    throw new Error(response.message);
  }

  return response.data;
}
