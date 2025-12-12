import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";

async function buildCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

async function proxyRequest(request: NextRequest, path: string) {
  const url = new URL(request.url);
  const targetUrl = `${FASTAPI_BASE_URL}/api/v1/${path}${url.search}`;
  const cookieHeader = await buildCookieHeader();

  const headers = new Headers();
  headers.set("Cookie", cookieHeader);
  
  // Forward content-type for POST/PUT/PATCH
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
    credentials: "include",
  };

  // Forward body for methods that have one
  if (["POST", "PUT", "PATCH"].includes(request.method)) {
    const body = await request.text();
    if (body) {
      fetchOptions.body = body;
    }
  }

  let response: Response;
  try {
    response = await fetch(targetUrl, fetchOptions);
  } catch (error) {
    console.error(`[Proxy] Failed to fetch ${targetUrl}:`, error);
    return NextResponse.json(
      { 
        error: "Backend connection failed", 
        detail: `Could not connect to ${FASTAPI_BASE_URL}. Make sure NEXT_PUBLIC_FASTAPI_URL is set correctly.`,
        target: targetUrl 
      },
      { status: 502 }
    );
  }

  // Handle Set-Cookie headers from backend
  const responseHeaders = new Headers();
  const setCookieHeaders = response.headers.getSetCookie();
  
  // Copy other headers
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") {
      responseHeaders.set(key, value);
    }
  });

  // Create response
  const responseBody = await response.text();
  const nextResponse = new NextResponse(responseBody, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });

  // Forward Set-Cookie headers
  for (const cookie of setCookieHeaders) {
    nextResponse.headers.append("Set-Cookie", cookie);
  }

  return nextResponse;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join("/"));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join("/"));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join("/"));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join("/"));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join("/"));
}

