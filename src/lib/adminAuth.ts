const ADMIN_EMAIL = "ugen.kwon@gmail.com";

export function isAdminEmail(email: string | undefined): boolean {
  return email === ADMIN_EMAIL;
}
