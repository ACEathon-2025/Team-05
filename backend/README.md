# FaceToHealth Agent API — Usage Guide

This guide explains how to call the FaceToHealth Agent HTTP API, including payload structure, curl examples (Bash and PowerShell), and Python helpers in this repo.

## Run the backend (LangGraph dev)

You have two easy ways to run the backend locally. Pick either uv (recommended if you have it) or pip/venv.

### 1) Prepare environment variables

Copy the example env and fill in the required keys:

```powershell
Copy-Item env.example .env
# Then edit .env and provide values (examples):
# GOOGLE_API_KEY=...
# PARALLEL_API_KEY=...
```

The app loads `.env` automatically (see `langgraph.json`). In code, `PARALLEL_API_KEY` is used as `MCP_API_KEY` in `agents.py`.

### 2A) Run with uv (recommended)

```powershell
# From the project root
uv sync
uv run langgraph dev --port 2024
```

This will start the dev server at http://localhost:2024. The CLI reads `langgraph.json` to find the graph (`facetohealth`).

### 2B) Run with pip + venv

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -U pip
pip install .
langgraph dev --port 2024
```

If `langgraph` is not found, ensure your virtual environment is activated and that installation succeeded. You can also try `python -m pip install "langgraph-cli[inmem]>=0.4.2"` explicitly.

### Verify the server

```powershell
# Optional: quick health probe (may return 404 for root, which is OK)
curl http://localhost:2024/
```

Your API will be available at:
- http://localhost:2024/runs/stream
- http://localhost:2024/runs/wait

## Endpoints

- POST {DEPLOYMENT_URL}/runs/stream
	- Streams intermediate updates as newline-delimited JSON (or `data: {json}` SSE-like lines).
	- Use when you want real-time updates as the graph runs.

- POST {DEPLOYMENT_URL}/runs/wait
	- Waits until the run completes and returns the final result in a single response.
	- Use when you only care about the final output.

Note: Replace `{DEPLOYMENT_URL}` with your server base URL, e.g. `http://localhost:2024`.

## Request payload

All requests share the same base payload shape:

```
{
	"assistant_id": "facetohealth",
	"input": {
		"messages": [
			{
				"role": "human",
				"content": [
					{ "type": "text", "text": "What is in this image?" },
					{ "type": "image_url", "image_url": { "url": "data:image/png;base64,<BASE64>" } }
				]
			}
		]
	}
}
```

- `assistant_id`: Matches a graph defined in `langgraph.json` (here: `facetohealth`).
- `input.messages[0].content` can be text-only or multimodal (text + image). The image is sent as a `data:` URL.

For streaming ONLY, include:

```
"stream_mode": "updates" | "values"
```

Omit `stream_mode` when calling `/runs/wait`.

## curl examples

### Bash (Linux/macOS)

Streaming updates (`/runs/stream`):

```bash
curl -s --request POST \
	--url "$DEPLOYMENT_URL/runs/stream" \
	--header 'Content-Type: application/json' \
	--data '{
		"assistant_id": "facetohealth",
		"input": {
			"messages": [{
				"role": "human",
				"content": [
					{"type": "text", "text": "Analyze this skin condition"},
					{"type": "image_url", "image_url": {"url": "data:image/png;base64,BASE64_HERE"}}
				]
			}]
		},
		"stream_mode": "updates"
	}'
```

Wait for final result (`/runs/wait`):

```bash
curl -s --request POST \
	--url "$DEPLOYMENT_URL/runs/wait" \
	--header 'Content-Type: application/json' \
	--data '{
		"assistant_id": "facetohealth",
		"input": {
			"messages": [{
				"role": "human",
				"content": [
					{"type": "text", "text": "Analyze this skin condition"},
					{"type": "image_url", "image_url": {"url": "data:image/png;base64,BASE64_HERE"}}
				]
			}]
		}
	}'
```

Optional auth header (if your deployment requires it):

```bash
	--header "X-Api-Key: $LANGSMITH_API_KEY"
```

### PowerShell (Windows)

PowerShell escaping is different; prefer `Invoke-RestMethod` for readability:

```powershell
$payload = @{
	assistant_id = "facetohealth"
	input = @{ messages = @(
		@{ role = "human"; content = @(
			@{ type = "text"; text = "Analyze this skin condition" },
			@{ type = "image_url"; image_url = @{ url = "data:image/png;base64,BASE64_HERE" } }
		) }
	) }
	stream_mode = "updates"  # Remove this line if calling /runs/wait
} | ConvertTo-Json -Depth 8

$headers = @{ 'Content-Type' = 'application/json' }
# $headers['X-Api-Key'] = $env:LANGSMITH_API_KEY  # optional auth

Invoke-RestMethod -Method Post -Uri "$env:DEPLOYMENT_URL/runs/stream" -Headers $headers -Body $payload
```

If you want to stick with curl on PowerShell, use single quotes around JSON and escape quotes carefully.

## Python helpers

- `test.py` — Minimal streaming client for `/runs/stream` that:
	- embeds a local image as `data:image/...;base64,...`
	- handles SSE-style `data: {json}` lines
	- prints the final message content
	- removes ```json fences from the final output

- `runs_stream.py` — A more complete client that supports both `/runs/stream` and `/runs/wait`, and can save outputs to disk.

Example (streaming) run:

```powershell
python .\test.py
```

Example (choose wait mode and save output):

```powershell
python .\runs_stream.py --url "http://localhost:2024" --image ".\photo.png" --assistant-id "facetohealth" --question "Analyze this" --wait --output "output.json"
```

## Troubleshooting

- Empty `{}` from `/runs/wait`:
	- Ensure you are NOT sending `stream_mode` in the payload for `/runs/wait`.
	- Verify `assistant_id` matches a configured graph in `langgraph.json`.
	- Check server logs to confirm the run executes and returns a result.
	- Use the raw capture in `runs_stream.py` (`--raw-output`) to inspect the exact body.

- Image not recognized:
	- Ensure the `data:` URL MIME type matches the file (e.g., `image/png` for `.png`).
	- Large images can bloat the request; consider resizing to a reasonable resolution.

- PowerShell JSON quoting issues:
	- Prefer `Invoke-RestMethod` with a PowerShell hashtable piped to `ConvertTo-Json`.
	- If you must use curl, use single quotes and escape embedded quotes properly.

## Security

- If your deployment requires an API key, avoid hard-coding it:
	- Use an environment variable and add the header `X-Api-Key: <KEY>` when needed.
	- Avoid pasting secrets into terminals that may be logged.

---

For questions or improvements, open an issue or ask for a tailored example with your exact payload and environment.

