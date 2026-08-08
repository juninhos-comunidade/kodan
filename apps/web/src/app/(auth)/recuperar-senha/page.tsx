import { authEmailDeliveryConfigured } from "@kodan/auth";

import { PasswordRecoveryForm } from "./password-recovery-form";

export default function RecuperarSenhaPage() {
  return <PasswordRecoveryForm enabled={authEmailDeliveryConfigured} />;
}
