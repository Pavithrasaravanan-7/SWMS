import sys
sys.stdout = open(r"C:\Users\ELCOT\AppData\Local\Temp\opencode\swms_routes_result.txt", "w", encoding="utf-8", errors="replace")
path = r"C:\Users\ELCOT\Downloads\swms-app-fastapi-neon-project (3)\swms-app-fastapi-neon-project (2)\swms-app-fastapi-neon-project\backend_fastapi\main.py"
src = open(path, encoding="utf-8").read()
try:
    compile(src, path, "exec")
    print("WHOLE FILE COMPILE: OK")
except SyntaxError as e:
    print("WHOLE FILE COMPILE: FAIL")
    print(f"  msg={e.msg!r} lineno={e.lineno} offset={e.offset}")
    print(f"  text_line={e.text!r}")
else:
    # also validate decorator->def adjacency for the two SWMS routes
    import re
    lines = src.split("\n")
    print("")
    print(f"total lines = {len(lines)}")
    decs = [(i) for i, l in enumerate(lines, 1) if l.strip().startswith("@app.")]
    for i in decs:
        nxt = None
        for j in range(i, min(i + 20, len(lines))):
            s = lines[j + 1 - 1] if False else lines[j]
            if s.strip().startswith("def "):
                nxt = j + 1
                break
        print(f"  L{i}: {lines[i-1].strip()[:60]}")
        print(f"       -> following def at line {nxt}: {lines[nxt-1].strip()[:50] if nxt else 'NONE (ORPHAN!)'}")
    print("")
    print("ai-audit route present:", sum(1 for l in lines if '@app.post("/api/swms/ai-audit")' in l))
    print("swms/data get present :", sum(1 for l in lines if '@app.get("/api/swms/data"' in l))
