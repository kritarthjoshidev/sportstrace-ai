import { NextRequest, NextResponse } from "next/server";


const BACKEND_ORIGIN = (process.env.SPORTSTRACE_BACKEND_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

export const dynamic = "force-dynamic";

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const pathname = path.join("/");
  const targetUrl = new URL(`${BACKEND_ORIGIN}/${pathname}`);
  targetUrl.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const method = request.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);
  const body = hasBody ? await request.arrayBuffer() : undefined;

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("transfer-encoding");
    responseHeaders.delete("content-length");

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      {
        detail:
          "SportsTrace backend is unreachable on port 8000. Start the FastAPI server, then retry the upload.",
        target: targetUrl.toString(),
        suggested_command:
          ".\\.venv\\Scripts\\python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000",
      },
      { status: 503 }
    );
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE, proxy as OPTIONS };
