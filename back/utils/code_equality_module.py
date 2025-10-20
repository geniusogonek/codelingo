def normalize_code(code: str) -> str:
    lines = code.strip().splitlines()

    while lines and not lines[0].strip():
        lines.pop(0)

    while lines and not lines[-1].strip():
        lines.pop()

    indents = [len(line) - len(line.lstrip()) for line in lines if line.strip()]
    min_indent = min(indents) if indents else 0
    normalized = list(filter(lambda e: e, [line[min_indent:] if line.strip() else "" for line in lines]))

    return "\n".join(normalized)
