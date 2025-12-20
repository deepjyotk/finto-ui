import { NextRequest, NextResponse } from "next/server";

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";
const CHAT_ENDPOINT = `${FASTAPI_BASE_URL}/api/v1/thesys/chat`;
const SESSION_ENDPOINT = `${FASTAPI_BASE_URL}/api/v1/thesys/session`;

type ThesysChatBody = {
  message_payload?: { content?: string };
  prompt?: { content?: string };
  content?: string;
  message?: string;
  session_id?: string;
  sessionId?: string;
  broker_id?: string;
  brokerId?: string;
};

const extractSessionId = (body: ThesysChatBody, searchParams: URLSearchParams) =>
  searchParams.get("session_id") ||
  searchParams.get("sessionId") ||
  body.session_id ||
  body.sessionId ||
  null;

const extractBrokerId = (body: ThesysChatBody, searchParams: URLSearchParams) =>
  searchParams.get("broker_id") ||
  searchParams.get("brokerId") ||
  body.broker_id ||
  body.brokerId ||
  null;

const normalizeChatPayload = (body: ThesysChatBody, sessionId: string, brokerId: string) => {
  let content = "";

  if (body.message_payload?.content) {
    content = body.message_payload.content;
  } else if (body.prompt?.content) {
    content = body.prompt.content;
  } else if (typeof body.content === "string") {
    content = body.content;
  } else if (typeof body.message === "string") {
    content = body.message;
  }

  return {
    message_payload: {
      content,
    },
    session_id: sessionId,
    broker_id: brokerId,
  };
};

const isEventStream = (response: Response) => {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("text/event-stream");
};

const buildEventStreamResponse = (backendResponse: Response) => {
  const { readable, writable } = new TransformStream();

  backendResponse.body?.pipeTo(writable).catch((err) => {
    console.error("[Thesys Chat] Stream pipe error:", err);
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
};

const createThesysSession = async (cookieHeader: string) => {
  const response = await fetch(SESSION_ENDPOINT, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`);
  }

  const data = await response.json();
  return data.session_id as string;
};

const forwardThesysChat = async ({
  payload,
  cookieHeader,
}: {
  payload: { message_payload: { content: string }; session_id: string; broker_id: string };
  cookieHeader: string;
}) => {
  return fetch(CHAT_ENDPOINT, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify(payload),
  });
};

export const handleThesysChatPost = async (request: NextRequest) => {
  try {
    const body = (await request.json()) as ThesysChatBody;
    const searchParams = request.nextUrl.searchParams;
    const cookieHeader = request.headers.get("cookie") || "";

    let sessionId = extractSessionId(body, searchParams);
    const brokerId = extractBrokerId(body, searchParams);

    if (!sessionId) {
      sessionId = await createThesysSession(cookieHeader);
      console.log("[Thesys Chat] Created new session:", sessionId);
    }

    if (!brokerId) {
      return NextResponse.json(
        { error: "broker_id is required" },
        { status: 400 }
      );
    }

    const payload = normalizeChatPayload(body, sessionId, brokerId);
    const backendResponse = await forwardThesysChat({ payload, cookieHeader });

    if (!backendResponse.ok && !isEventStream(backendResponse)) {
      const errorText = await backendResponse.text();
      console.error("[Thesys Chat] Backend error:", backendResponse.status, errorText);
      return NextResponse.json(
        { error: errorText || "Backend request failed" },
        { status: backendResponse.status }
      );
    }

    if (isEventStream(backendResponse)) {
      return buildEventStreamResponse(backendResponse);
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Thesys Chat] Proxy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
};

export const buildThesysChatOptionsResponse = () =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });

