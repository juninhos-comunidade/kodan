def summarize_active(rows: list[dict[str, object]]) -> tuple[int, list[object]]:
    ids = (row["id"] for row in rows if row["active"])

    total = sum(1 for _ in ids)
    return total, list(ids)


rows = [
    {"id": "a", "active": True},
    {"id": "b", "active": False},
    {"id": "c", "active": True},
]

print(summarize_active(rows))
