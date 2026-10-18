export function safeAuthRedirect(path: string | null): string {
  return path?.startsWith("/") && !path.startsWith("//") && !/[\\\u0000-\u001f\u007f]/.test(path)
    ? path
    : "/dashboard";
}
