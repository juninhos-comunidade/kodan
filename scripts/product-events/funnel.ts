import prisma from "../../packages/db/src/index";

import {
  formatProductFunnelReport,
  queryProductFunnel,
} from "../../apps/web/src/server/training/product-event-store";

function readDaysArgument(args: readonly string[]) {
  const value = args.find((argument) => argument.startsWith("--days="))
    ?.slice("--days=".length);
  const days = value ? Number(value) : 30;
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    throw new Error("Use --days com um número inteiro entre 1 e 365.");
  }
  return days;
}

const days = readDaysArgument(process.argv.slice(2));
const to = new Date();
to.setUTCHours(0, 0, 0, 0);
to.setUTCDate(to.getUTCDate() + 1);
const from = new Date(to);
from.setUTCDate(from.getUTCDate() - days);

const report = await queryProductFunnel(prisma, { from, to });

console.log(`Funil Kodan: ${from.toISOString().slice(0, 10)} a ${to.toISOString().slice(0, 10)}`);
console.log(formatProductFunnelReport(report));
