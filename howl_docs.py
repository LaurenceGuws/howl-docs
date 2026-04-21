#!/usr/bin/env python3
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from http import HTTPStatus
import json
import mimetypes
import os
import subprocess
import sys
from urllib.parse import parse_qs, quote, unquote, urlparse


class HowlDocsHandler(SimpleHTTPRequestHandler):
    repo_root = Path.cwd()
    project_registry: list[dict[str, str]] = []
    project_mounts: dict[str, dict[str, Path | str]] = {}

    @classmethod
    def content_root(cls, project_id: str | None) -> Path:
        if project_id:
            mount = cls.project_mounts.get(project_id)
            if mount:
                repo_root = mount.get("repo_root")
                if isinstance(repo_root, Path):
                    return repo_root
        return cls.repo_root

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path != "/__search":
            self.send_error(404, "File not found")
            return
        self.handle_search()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/__projects":
            self.handle_project_registry()
            return
        if parsed.path.startswith("/__project_config/"):
            self.handle_project_config_file(parsed.path)
            return
        if parsed.path.startswith("/__project_repo/"):
            self.handle_project_repo_file(parsed.path)
            return
        super().do_GET()

    def send_head(self):
        parsed = urlparse(self.path)
        request_path = parsed.path
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            if not request_path.endswith("/"):
                self.send_response(HTTPStatus.MOVED_PERMANENTLY)
                next_path = f"{request_path}/"
                next_url = next_path
                if parsed.query:
                    next_url = f"{next_url}?{parsed.query}"
                if parsed.fragment:
                    next_url = f"{next_url}#{parsed.fragment}"
                self.send_header("Location", next_url)
                self.send_header("Content-Length", "0")
                self.send_header("Cache-Control", "no-store")
                self.send_header("Pragma", "no-cache")
                self.send_header("Expires", "0")
                self.end_headers()
                return None
            for index in self.index_pages:
                candidate = os.path.join(path, index)
                if os.path.isfile(candidate):
                    path = candidate
                    break
            else:
                self.send_error(HTTPStatus.NOT_FOUND, "File not found")
                return None
        if path.endswith("/"):
            self.send_error(HTTPStatus.NOT_FOUND, "File not found")
            return None
        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(HTTPStatus.NOT_FOUND, "File not found")
            return None

        try:
            fs = os.fstat(f.fileno())
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-type", self.guess_type(path))
            self.send_header("Content-Length", str(fs.st_size))
            self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
            self.send_header("Cache-Control", "no-store")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
            self.end_headers()
            return f
        except Exception:
            f.close()
            raise

    def handle_project_registry(self) -> None:
        data = json.dumps(self.project_registry).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def project_mount(self, project_id: str) -> dict[str, Path | str] | None:
        return self.project_mounts.get(project_id)

    def split_project_path(self, request_path: str, prefix: str) -> tuple[str, str] | None:
        suffix = request_path.removeprefix(prefix)
        if "/" not in suffix:
            return None
        project_id, rel_path = suffix.split("/", 1)
        project_id = unquote(project_id)
        rel_path = unquote(rel_path)
        if not project_id or not rel_path:
            return None
        return project_id, rel_path

    def handle_project_config_file(self, request_path: str) -> None:
        parts = self.split_project_path(request_path, "/__project_config/")
        if parts is None:
            self.send_error(400, "Invalid project config path")
            return
        project_id, rel_path = parts
        mount = self.project_mount(project_id)
        if mount is None:
            self.send_error(404, "Project not found")
            return
        config_root = mount.get("config_root")
        if not isinstance(config_root, Path):
            self.send_error(404, "Project config root not found")
            return
        candidate = self.resolve_mounted_file(config_root, rel_path)
        if candidate is None:
            self.send_error(404, "File not found")
            return
        self.serve_file(candidate)

    def handle_project_repo_file(self, request_path: str) -> None:
        parts = self.split_project_path(request_path, "/__project_repo/")
        if parts is None:
            self.send_error(400, "Invalid project repo path")
            return
        project_id, rel_path = parts
        mount = self.project_mount(project_id)
        if mount is None:
            self.send_error(404, "Project not found")
            return
        repo_root = mount.get("repo_root")
        if not isinstance(repo_root, Path):
            self.send_error(404, "Project repo root not found")
            return
        candidate = self.resolve_mounted_file(repo_root, rel_path)
        if candidate is None:
            self.send_error(404, "File not found")
            return
        self.serve_file(candidate)

    def resolve_mounted_file(self, mounted_root: Path, rel_path: str) -> Path | None:
        try:
            candidate = (mounted_root / rel_path).resolve()
            candidate.relative_to(mounted_root)
        except Exception:
            return None
        if not candidate.is_file():
            return None
        return candidate

    def handle_search(self) -> None:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            self.send_error(400, "Missing request body")
            return

        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            self.send_error(400, "Invalid JSON")
            return

        query = str(payload.get("query", "")).strip()
        docs = payload.get("docs", [])
        limit = int(payload.get("limit", 80))
        limit = max(1, min(limit, 200))

        self.send_response(200)
        self.send_header("Content-Type", "application/x-ndjson; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()

        if not query or not isinstance(docs, list):
            return

        project_id = payload.get("projectId")
        if project_id is not None and not isinstance(project_id, str):
            project_id = None
        content_root = self.content_root(project_id)
        files: list[str] = []
        for rel_path in docs:
            if not isinstance(rel_path, str):
                continue
            candidate = (content_root / rel_path).resolve()
            try:
                candidate.relative_to(content_root)
            except ValueError:
                continue
            if candidate.is_file():
                files.append(str(candidate))

        if not files:
            return

        proc = subprocess.Popen(
            [
                "rg",
                "--json",
                "--smart-case",
                "--color",
                "never",
                "--max-columns",
                "300",
                "--",
                query,
                *files,
            ],
            cwd=content_root,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        hits = 0
        assert proc.stdout is not None
        assert proc.stderr is not None

        try:
            for raw in proc.stdout:
                event = json.loads(raw)
                if event.get("type") != "match":
                    continue
                data = event.get("data", {})
                path_data = data.get("path", {})
                path_text = path_data.get("text", "")
                try:
                    relative_path = str(Path(path_text).resolve().relative_to(content_root))
                except Exception:
                    continue
                line_text = data.get("lines", {}).get("text", "").rstrip("\r\n")
                line_number = int(data.get("line_number", 1))

                for submatch in data.get("submatches", []):
                    match_text = submatch.get("match", {}).get("text", "")
                    result = {
                        "path": relative_path,
                        "line": line_number,
                        "column": int(submatch.get("start", 0)) + 1,
                        "preview": line_text,
                        "matchText": match_text,
                        "start": int(submatch.get("start", 0)),
                        "end": int(submatch.get("end", 0)),
                    }
                    self.wfile.write((json.dumps(result) + "\n").encode("utf-8"))
                    self.wfile.flush()
                    hits += 1
                    if hits >= limit:
                        proc.kill()
                        proc.wait()
                        return
        finally:
            if proc.poll() is None:
                proc.wait()

        stderr_text = proc.stderr.read().strip()
        if proc.returncode not in (0, 1) and stderr_text:
            error = {"error": stderr_text}
            self.wfile.write((json.dumps(error) + "\n").encode("utf-8"))
            self.wfile.flush()

    def serve_file(self, candidate: Path) -> None:
        content_type = mimetypes.guess_type(str(candidate))[0] or "application/octet-stream"
        data = candidate.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", f"{content_type}; charset=utf-8" if content_type.startswith("text/") else content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)


def resolve_config_path(repo_root: Path, raw_arg: str) -> Path:
    direct = Path(raw_arg).expanduser()
    if not direct.is_absolute():
        direct = (Path.cwd() / direct).resolve()
    else:
        direct = direct.resolve()
    if direct.is_file():
        return direct
    raise FileNotFoundError(raw_arg)


def resolve_repo_root(config_path: Path) -> Path:
    try:
        proc = subprocess.run(
            ["git", "-C", str(config_path.parent), "rev-parse", "--show-toplevel"],
            check=True,
            capture_output=True,
            text=True,
        )
        return Path(proc.stdout.strip()).resolve()
    except Exception:
        return config_path.parent


def project_id_from_config_path(config_path: Path) -> str:
    stem = config_path.name
    if stem.endswith(".json"):
        stem = stem[:-5]
    if stem.startswith("project."):
        stem = stem.removeprefix("project.")
    safe = "".join(ch if ch.isalnum() or ch in {"-", "_"} else "-" for ch in stem.lower())
    safe = safe.strip("-_")
    return safe or "project"


def project_metadata_from_manifest(config_path: Path, fallback_project_id: str) -> dict[str, str]:
    try:
        payload = json.loads(config_path.read_text(encoding="utf-8"))
    except Exception:
        payload = {}
    title = payload.get("title")
    category = payload.get("category")
    label = (
        title.strip()
        if isinstance(title, str) and title.strip()
        else fallback_project_id.replace("-", " ").replace("_", " ").title()
    )
    normalized_category = (
        category.strip()
        if isinstance(category, str) and category.strip()
        else "Other"
    )
    return {
        "label": label,
        "category": normalized_category,
    }


def main() -> int:
    repo_root = Path(__file__).resolve().parent
    os.chdir(repo_root)

    built_entry = repo_root / "build" / "js" / "main.js"
    if not built_entry.exists():
        print("docs explorer build output is missing.")
        print("run:")
        print('  cd "/path/to/howl-docs"')
        print("  npm install")
        print("  npm run build")
        return 1

    host = "127.0.0.1"
    port = 8000
    selected_project_id = None
    HowlDocsHandler.project_registry = [
        {
            "id": "howl-docs",
            "label": "Howl Docs",
            "category": "Infrastructure",
            "configPath": "/app_architecture/docs_browser/project.howl-docs.json",
            "repoBasePath": ".",
        }
    ]
    HowlDocsHandler.project_mounts = {}

    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    if len(sys.argv) > 2:
        for raw_config in sys.argv[2:]:
            try:
                config_path = resolve_config_path(repo_root, raw_config)
            except FileNotFoundError:
                print(f"config file not found: {raw_config}")
                return 1
            project_id = project_id_from_config_path(config_path)
            suffix = 2
            while project_id in {entry["id"] for entry in DocsExplorerHandler.project_registry}:
                project_id = f"{project_id}-{suffix}"
                suffix += 1
            project_metadata = project_metadata_from_manifest(config_path, project_id)
            DocsExplorerHandler.project_mounts[project_id] = {
                "config_root": config_path.parent,
                "repo_root": resolve_repo_root(config_path),
                "config_name": config_path.name,
            }
            DocsExplorerHandler.project_registry.append(
                {
                    "id": project_id,
                    "label": project_metadata["label"],
                    "category": project_metadata["category"],
                    "configPath": f"/__project_config/{quote(project_id)}/{quote(config_path.name)}",
                    "repoBasePath": f"/__project_repo/{quote(project_id)}/",
                }
            )
            if selected_project_id is None:
                selected_project_id = project_id

    DocsExplorerHandler.repo_root = repo_root
    server = ThreadingHTTPServer((host, port), DocsExplorerHandler)
    print(f"serving {repo_root}")
    url = f"http://{host}:{port}/"
    if selected_project_id:
        url = f"{url}?project={quote(selected_project_id)}"
    print(f"open {url}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
