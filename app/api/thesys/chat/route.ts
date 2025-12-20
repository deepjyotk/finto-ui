import { NextRequest } from "next/server";
import {
  buildThesysChatOptionsResponse,
  handleThesysChatPost,
} from "@/lib/api/thesys_api";

export const POST = (request: NextRequest) => handleThesysChatPost(request);

export const OPTIONS = () => buildThesysChatOptionsResponse();

