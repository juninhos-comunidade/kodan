import type { ProductEventInput } from "@/server/training/product-event-store";
import { recordAnonymousProductEvent } from "@/server/api/service";

export async function POST(request: Request) {
  let event: unknown;
  try {
    event = await request.json();
  } catch {
    return Response.json({ error: "Evento inválido" }, { status: 400 });
  }

  const result = await recordAnonymousProductEvent(event as ProductEventInput);
  if (!result.success) {
    return Response.json({ error: result.error }, { status: 503 });
  }
  if (!result.recorded) {
    return Response.json({ error: "Evento inválido" }, { status: 400 });
  }
  return new Response(null, { status: 204 });
}
