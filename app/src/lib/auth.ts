/** 登录态工具：token 存于 localStorage，随 tRPC 请求头发送 */
const TOKEN_KEY = "jixiang_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
