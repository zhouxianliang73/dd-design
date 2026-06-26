#!/usr/bin/env python3
"""scheme-center intake — 将 WhatsApp/微信消息与附件写入 projects/。"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
INTAKE_DIR = ROOT / "intake"
PROJECTS_DIR = ROOT / "projects"
STATE_DIR = INTAKE_DIR / ".state"

DOC_EXT = {".pdf", ".ppt", ".pptx", ".doc", ".docx", ".xlsx", ".xls", ".csv"}
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic"}
QUOTE_EXT = {".pdf", ".xlsx", ".xls", ".csv"}


def load_yaml(path: Path) -> dict:
    try:
        import yaml  # type: ignore
    except ImportError:
        print("[ERR] 需要 PyYAML: pip install pyyaml", file=sys.stderr)
        sys.exit(1)
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {}


def load_config() -> dict:
    for name in ("config.local.yaml", "config.yaml", "config.example.yaml"):
        path = INTAKE_DIR / name
        if path.exists():
            return load_yaml(path)
    print("[ERR] 未找到 intake/config.yaml", file=sys.stderr)
    sys.exit(1)


def slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^\w\u4e00-\u9fff]+", "-", text, flags=re.UNICODE)
    return text.strip("-") or "unnamed"


def resolve_project_slug(cfg: dict, channel: str, chat_name: str) -> str:
    ch = (cfg.get("channels") or {}).get(channel) or {}
    for rule in ch.get("groups") or []:
        needle = str(rule.get("match", ""))
        if needle and needle.lower() in chat_name.lower():
            return str(rule["project_slug"])
    return slugify(chat_name)


def project_dir(slug: str) -> Path:
    return PROJECTS_DIR / slug


def ensure_project(slug: str, chat_name: str, channel: str) -> Path:
    dest = project_dir(slug)
    if dest.exists():
        return dest

    template = PROJECTS_DIR / "_template"
    dest.mkdir(parents=True, exist_ok=True)
    (dest / "materials").mkdir(exist_ok=True)
    (dest / "quotes").mkdir(exist_ok=True)

    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    if (template / "project.json").exists():
        project = json.loads((template / "project.json").read_text(encoding="utf-8"))
    else:
        project = {"version": 1}

    project.update(
        {
            "slug": slug,
            "name": chat_name,
            "sources": [{"channel": channel, "chat": chat_name}],
            "createdAt": now,
            "updatedAt": now,
        }
    )
    (dest / "project.json").write_text(
        json.dumps(project, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    comm_path = dest / "comm-structure.json"
    if not comm_path.exists():
        if (template / "comm-structure.json").exists():
            comm = json.loads((template / "comm-structure.json").read_text(encoding="utf-8"))
        else:
            comm = {"version": 1, "blocks": []}
        comm["projectId"] = chat_name
        comm_path.write_text(json.dumps(comm, ensure_ascii=False, indent=2), encoding="utf-8")

    conv_path = dest / "conversation.jsonl"
    if not conv_path.exists():
        conv_path.write_text("", encoding="utf-8")

    cmp_path = dest / "quotes" / "comparison.json"
    if not cmp_path.exists() and (template / "quotes" / "comparison.json").exists():
        shutil.copy2(template / "quotes" / "comparison.json", cmp_path)

    print(f"[NEW] 创建项目 {slug}")
    return dest


def guess_role(cfg: dict, sender: str, text: str) -> str:
    blob = f"{sender} {text}".lower()
    client_hits = sum(1 for k in cfg.get("roles", {}).get("client_signals", []) if k.lower() in blob)
    team_hits = sum(1 for k in cfg.get("roles", {}).get("team_signals", []) if k.lower() in blob)
    if team_hits > client_hits:
        return "team"
    if client_hits > 0:
        return "client"
    return "unknown"


def is_quote_file(cfg: dict, filename: str, text: str = "") -> bool:
    blob = f"{filename} {text}".lower()
    return any(k.lower() in blob for k in cfg.get("quote_keywords", []))


def append_message(project: Path, record: dict) -> None:
    line = json.dumps(record, ensure_ascii=False)
    with (project / "conversation.jsonl").open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def touch_project(project: Path, record: dict) -> None:
    path = project / "project.json"
    if not path.exists():
        return
    data = json.loads(path.read_text(encoding="utf-8"))
    data["updatedAt"] = record.get("ts") or datetime.now(timezone.utc).isoformat()
    src = {"channel": record.get("channel"), "chat": record.get("chat")}
    sources = data.setdefault("sources", [])
    if src not in sources:
        sources.append(src)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def store_attachment(cfg: dict, project: Path, src: Path, text: str = "") -> dict | None:
    if not src.exists() or not src.is_file():
        return None

    ext = src.suffix.lower()
    if is_quote_file(cfg, src.name, text) and ext in QUOTE_EXT:
        bucket = project / "quotes"
    elif ext in IMAGE_EXT:
        bucket = project / "materials" / "images"
    elif ext in DOC_EXT:
        bucket = project / "materials" / "docs"
    else:
        bucket = project / "materials" / "other"

    bucket.mkdir(parents=True, exist_ok=True)
    dest = bucket / src.name
    counter = 1
    while dest.exists():
        dest = bucket / f"{src.stem}_{counter}{src.suffix}"
        counter += 1

    shutil.copy2(src, dest)
    rel = dest.relative_to(project).as_posix()
    print(f"  [FILE] {rel}")
    return {"path": rel, "name": dest.name, "kind": bucket.name}


def ingest_message(cfg: dict, payload: dict) -> str:
    channel = payload.get("channel", "unknown")
    chat = payload.get("chat") or payload.get("chat_name") or "未命名群"
    slug = payload.get("project_slug") or resolve_project_slug(cfg, channel, chat)
    project = ensure_project(slug, chat, channel)

    text = payload.get("text") or payload.get("body") or ""
    sender = payload.get("sender") or payload.get("from") or ""
    ts = payload.get("ts") or datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    record = {
        "ts": ts,
        "channel": channel,
        "chat": chat,
        "sender": sender,
        "role": payload.get("role") or guess_role(cfg, sender, text),
        "type": payload.get("type", "text"),
        "text": text,
    }

    attachment = payload.get("attachment") or payload.get("file")
    if attachment:
        stored = store_attachment(cfg, project, Path(attachment), text)
        if stored:
            record["attachment"] = stored
            if stored["kind"] == "quotes":
                record["type"] = "quote"

    append_message(project, record)
    touch_project(project, record)
    print(f"[OK] {slug} ← {sender or chat}: {text[:60]}")
    return slug


def ingest_file(cfg: dict, jsonl_path: Path) -> list[str]:
    touched: list[str] = []
    for line in jsonl_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        payload = json.loads(line)
        touched.append(ingest_message(cfg, payload))
    return touched


def list_projects() -> None:
    rows = []
    for d in sorted(PROJECTS_DIR.iterdir()):
        if not d.is_dir() or d.name.startswith("_"):
            continue
        pj = d / "project.json"
        if not pj.exists():
            continue
        data = json.loads(pj.read_text(encoding="utf-8"))
        conv = d / "conversation.jsonl"
        msg_count = sum(1 for ln in conv.read_text(encoding="utf-8").splitlines() if ln.strip()) if conv.exists() else 0
        rows.append((d.name, data.get("name", ""), data.get("status", ""), msg_count, data.get("updatedAt", "")))

    if not rows:
        print("[INFO] 尚无项目")
        return
    print(f"{'slug':<28} {'name':<24} {'status':<10} {'msgs':>5}  updated")
    print("-" * 90)
    for slug, name, status, msgs, updated in rows:
        print(f"{slug:<28} {name[:22]:<24} {status:<10} {msgs:>5}  {updated[:19]}")


def main() -> None:
    parser = argparse.ArgumentParser(description="scheme-center intake")
    sub = parser.add_subparsers(dest="cmd")

    p_msg = sub.add_parser("message", help="写入单条消息")
    p_msg.add_argument("--channel", required=True, choices=["whatsapp", "wechat"])
    p_msg.add_argument("--chat", required=True, help="群名或会话名")
    p_msg.add_argument("--sender", default="")
    p_msg.add_argument("--text", default="")
    p_msg.add_argument("--role", choices=["client", "team", "unknown"])
    p_msg.add_argument("--file", help="附件绝对路径")
    p_msg.add_argument("--project", help="强制 project slug")

    p_batch = sub.add_parser("batch", help="批量导入 JSONL（每行一条消息 JSON）")
    p_batch.add_argument("file", type=Path)

    sub.add_parser("list", help="列出 projects/")

    args = parser.parse_args()
    cfg = load_config()

    if args.cmd == "list":
        list_projects()
        return

    if args.cmd == "batch":
        ingest_file(cfg, args.file)
        return

    if args.cmd == "message":
        payload = {
            "channel": args.channel,
            "chat": args.chat,
            "sender": args.sender,
            "text": args.text,
            "role": args.role,
            "attachment": args.file,
            "project_slug": args.project,
        }
        ingest_message(cfg, payload)
        return

    parser.print_help()


if __name__ == "__main__":
    main()
