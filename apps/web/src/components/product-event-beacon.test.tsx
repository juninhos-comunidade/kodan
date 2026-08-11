import { expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const recordProductEvent = mock(async () => ({ success: true }));
mock.module("@/app/actions", () => ({ recordProductEvent }));

const { ProductEventBeacon } = await import("./product-event-beacon");

test("não transforma renderização do servidor em efeito de analytics", () => {
  const markup = renderToStaticMarkup(
    <ProductEventBeacon
      event={{ name: "home_viewed" }}
      dedupeKey="home"
    />,
  );

  expect(markup).toBe("");
  expect(recordProductEvent).not.toHaveBeenCalled();
});
