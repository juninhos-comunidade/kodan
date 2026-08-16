def add_tag(tag: str, tags: list[str] | None = None) -> list[str]:
    if tags is None:
        tags = []

    tags.append(tag)
    return tags


first = add_tag("python")
second = add_tag("backend")
