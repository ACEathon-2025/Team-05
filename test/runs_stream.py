#!/usr/bin/env python3
"""
Simple script to POST to <DEPLOYMENT_URL>/runs/stream with a data:image base64 image
and stream updates from the server. Mirrors the curl example the user provided.

Usage examples:
  python runs_stream.py --url https://example.com --api-key sk-... --image ./photo.jpg
  python runs_stream.py --url https://example.com --api-key sk-... --image ./photo.jpg --question "What is in this image?"

The script requires the `requests` package.
"""
from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import os
import sys
from typing import Optional

try:
    import requests
except Exception as exc:  # pragma: no cover - informative runtime failure
    print("This script requires the 'requests' package. Install with: pip install requests", file=sys.stderr)
    raise


def build_data_url(image_path: str, mime: Optional[str] = None) -> str:
    """Read an image file and return a data: URL with base64 content."""
    if not os.path.isfile(image_path):
        raise FileNotFoundError(image_path)
    with open(image_path, "rb") as f:
        b = f.read()
    b64 = base64.b64encode(b).decode("ascii")
    if not mime:
        mime, _ = mimetypes.guess_type(image_path)
    if not mime:
        mime = "application/octet-stream"
    return f"data:{mime};base64,{b64}"


def make_payload(assistant_id: str, question: str, data_url: str, stream_mode: Optional[str] = None) -> dict:
    payload = {
        "assistant_id": assistant_id,
        "input": {
            "messages": [
                {
                    "role": "human",
                    "content": [
                        {"type": "text", "text": question},
                        {"type": "image_url", "image_url": {"url": data_url}},
                    ],
                }
            ]
        },
    }
    if stream_mode:
        payload["stream_mode"] = stream_mode
    return payload


def stream_run(url: str, api_key: Optional[str], payload: dict) -> list:
    """Perform the POST request and return a list of parsed stream items.

    Each streaming line is attempted to be parsed as JSON. If parsing fails,
    the raw text is stored under the key 'raw'.
    """
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["X-Api-Key"] = api_key
    full_url = url.rstrip("/") + "/runs/stream"
    items: list = []
    with requests.post(full_url, headers=headers, data=json.dumps(payload), stream=True) as resp:
        if resp.status_code >= 400:
            # Print the body then exit
            try:
                print(f"Error: {resp.status_code} - {resp.reason}")
                print(resp.text)
            except Exception:
                print(f"Error: {resp.status_code} - {resp.reason} (no body)")
            sys.exit(1)

        # Iterate over streaming lines. The server may send newline-delimited JSON or chunks.
        for line in resp.iter_lines(decode_unicode=True):
            if line is None:
                continue
            line = line.strip()
            if not line:
                continue
            # Some servers prefix with 'data: ' for SSE-like streams — strip that.
            if line.startswith("data:"):
                line = line[len("data:"):].strip()
                if not line:
                    continue

            # Try to parse JSON, but store raw text if parsing fails.
            try:
                parsed = json.loads(line)
                items.append(parsed)
                print(json.dumps(parsed, indent=2, ensure_ascii=False))
            except Exception:
                items.append({"raw": line})
                print(line)

    return items


def run_wait(url: str, api_key: Optional[str], payload: dict) -> tuple:
    """POST to /runs/wait and return the parsed response (dict or list).

    Prints the response (pretty JSON when possible) and returns the parsed
    object so the caller can save it to disk.
    """
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["X-Api-Key"] = api_key
    full_url = url.rstrip("/") + "/runs/wait"
    resp = requests.post(full_url, headers=headers, data=json.dumps(payload))
    if resp.status_code >= 400:
        try:
            print(f"Error: {resp.status_code} - {resp.reason}")
            print(resp.text)
        except Exception:
            print(f"Error: {resp.status_code} - {resp.reason} (no body)")
        sys.exit(1)

    # Always capture raw text
    raw_text = resp.text
    # Try to parse JSON, but still keep raw_text regardless
    try:
        parsed = resp.json()
        print(json.dumps(parsed, indent=2, ensure_ascii=False))
    except Exception:
        parsed = None
        print(raw_text)

    return parsed, raw_text


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="POST a streaming run with an embedded base64 image and print updates")
    p.add_argument("--url", required=True, help="Base deployment URL, e.g. https://api.example.com")
    p.add_argument("--api-key", required=False, help="API key for X-Api-Key header")
    p.add_argument("--image", required=True, help="Path to image file to embed as data:image/...;base64,...")
    p.add_argument("--assistant-id", default="facetohealth", help="assistant_id to send (default: agent)")
    p.add_argument("--question", default="What is in this image?", help="Text prompt to include with the image")
    p.add_argument("--output", required=False, default="run_output.json", help="Path to write final JSON output (default: run_output.json)")
    p.add_argument("--wait", action="store_true", help="Use /runs/wait (blocking) instead of /runs/stream")
    p.add_argument("--raw-output", required=False, default=None, help="Path to write raw response text when using --wait (default: <output>.raw)")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    try:
        data_url = build_data_url(args.image)
    except FileNotFoundError:
        print(f"Image file not found: {args.image}", file=sys.stderr)
        sys.exit(2)

    # Only include stream_mode when streaming
    payload = make_payload(args.assistant_id, args.question, data_url, stream_mode=None if args.wait else "updates")
    endpoint = "/runs/wait" if args.wait else "/runs/stream"
    print(f"Sending request to {args.url.rstrip('/')}{endpoint} ...", file=sys.stderr)
    try:
        if args.wait:
            parsed, raw_text = run_wait(args.url, args.api_key, payload)
            # Choose what to save as the main JSON output: parsed JSON if available, else raw wrapped
            items_to_save = parsed if parsed is not None else {"raw": raw_text}
        else:
            items = stream_run(args.url, args.api_key, payload)
            items_to_save = items
    except requests.exceptions.RequestException as exc:
        print(f"Network error: {exc}", file=sys.stderr)
        sys.exit(3)

    # Write collected items to the output JSON file
    try:
        with open(args.output, "w", encoding="utf-8") as fh:
            json.dump(items_to_save, fh, indent=2, ensure_ascii=False)
        # If items_to_save is a list, get its length, otherwise print '1'
        count = len(items_to_save) if isinstance(items_to_save, list) else 1
        print(f"Saved {count} item(s) to {args.output}", file=sys.stderr)
    except Exception as exc:
        print(f"Failed to write output file {args.output}: {exc}", file=sys.stderr)
        sys.exit(4)

    # If using --wait, optionally write the raw response to a separate file
    if args.wait:
        raw_path = args.raw_output if args.raw_output else f"{args.output}.raw"
        try:
            with open(raw_path, "w", encoding="utf-8") as fh:
                fh.write(raw_text)
            print(f"Saved raw response to {raw_path}", file=sys.stderr)
        except Exception as exc:
            print(f"Failed to write raw output file {raw_path}: {exc}", file=sys.stderr)
            sys.exit(5)


if __name__ == "__main__":
    main()
