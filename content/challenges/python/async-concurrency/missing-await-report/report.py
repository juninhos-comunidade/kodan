import asyncio


async def fetch_report() -> dict[str, str]:
    await asyncio.sleep(0.01)
    return {"id": "report-42"}


async def build_report() -> str:
    report = fetch_report()
    return report["id"]


print(asyncio.run(build_report()))
