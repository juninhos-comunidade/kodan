type PaymentResult =
  | { status: "approved"; receipt: string }
  | { status: "declined"; reason: string };

export function describePayment(result: PaymentResult) {
  if (result.status === "approved") {
    return `Aprovado: ${result.receipt}`;
  }

  return `Recusado: ${result.receipt}`;
}
