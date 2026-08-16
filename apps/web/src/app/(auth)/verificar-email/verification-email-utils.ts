export const PENDING_VERIFICATION_EMAIL_KEY = "kodan:pending-verification-email";

export function rememberPendingVerificationEmail(email: string) {
  try {
    window.sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, email);
  } catch {
    // A tela de verificação permite informar o endereço novamente.
  }
}
