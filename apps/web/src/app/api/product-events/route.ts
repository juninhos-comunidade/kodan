import { recordAnonymousProductEvent } from "@/server/api/service";
import { parseJsonBody } from "@/server/api/http";
import { productEventSchema } from "@/server/api/schemas";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, productEventSchema);
  if (!parsed.success) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const result = await recordAnonymousProductEvent(parsed.data);
  if (!result.success) {
    return Response.json({ error: result.error }, { status: 503 });
  }
  if (!result.recorded) {
    return Response.json({ error: "Evento inválido" }, { status: 400 });
  }
  return new Response(null, { status: 204 });
}
