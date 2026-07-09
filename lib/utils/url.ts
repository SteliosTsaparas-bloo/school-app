export function getAppBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

export function getStudentUrl(token: string) {
  return `${getAppBaseUrl()}/student/${token}`;
}
