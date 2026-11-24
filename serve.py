"""Local preview server for site/ with Vercel-style clean URLs (/give -> give.html).

    python serve.py [port]
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

SITE = Path(__file__).parent / "site"


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        clean = path.split("?", 1)[0].split("#", 1)[0]
        if clean not in ("", "/") and "." not in clean.rsplit("/", 1)[-1]:
            candidate = SITE / (clean.strip("/") + ".html")
            if candidate.exists():
                return str(candidate)
        return super().translate_path(path)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    server = ThreadingHTTPServer(("127.0.0.1", port), partial(Handler, directory=str(SITE)))
    print(f"Serving {SITE} at http://localhost:{port}")
    server.serve_forever()
