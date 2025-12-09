import { NextRequest } from "next/server";
import {
  buildThesysChatOptionsResponse,
  handleThesysChatPost,
} from "@/lib/api/features/chat/thesys-chat-proxy";

export const POST = (request: NextRequest) => handleThesysChatPost(request);

export const OPTIONS = () => buildThesysChatOptionsResponse();

