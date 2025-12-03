"use client";

/**
 * @deprecated This component is legacy code.
 * 
 * The chat interface now uses the Thesys C1Chat component from @thesysai/genui-sdk
 * which handles message rendering with rich generative UI components internally.
 * 
 * This component is kept for reference or potential custom implementations
 * that don't use the C1Chat component (e.g., using @crayonai/react-ui/Shell directly).
 * 
 * See: components/chat/chat-interface.tsx for the active implementation
 */

import React, { useCallback, useState } from "react";
import type { Message } from "@/lib/slices/chat";
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";

interface MessageItemProps {
  message: Message;
}

/** @deprecated Use C1Chat component instead */
export default function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);

  const handleCopy = useCallback(() => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(message.content).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [message.content]);

  const getUserInitials = useCallback((): string => {
    if (!user?.full_name || user.full_name.trim() === "") return "U";

    const names = user.full_name
      .trim()
      .split(" ")
      .filter((name) => name.length > 0);

    if (names.length === 0) return "U";
    if (names.length === 1) return names[0][0]!.toUpperCase();

    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }, [user?.full_name]);

  if (isUser) {
    return (
      <div className="group w-full border-b border-black/10 bg-[#343541] text-white">
        <div className="mx-auto flex max-w-3xl gap-4 p-4 md:px-6 md:py-6">
          <div className="flex flex-shrink-0 items-center justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#c96a2f] text-sm font-semibold text-white">
              {getUserInitials()}
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="whitespace-pre-wrap text-[15px] leading-7">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group w-full border-b border-black/10 bg-[#444654] text-white">
      <div className="mx-auto flex max-w-3xl gap-4 p-4 md:px-6 md:py-6">
        <div className="flex flex-shrink-0 items-center justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#19c37d]">
            {/* Simple OpenAI-style logo */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 41 41"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M37.5324 16.8707C37.9808 15.5241 38.1363 14.0974 37.9886 12.6859C37.8409 11.2744 37.3934 9.91076 36.676 8.68622C35.6126 6.83404 33.9882 5.3676 32.0373 4.4985C30.0864 3.62941 27.9098 3.40259 25.8215 3.85078C24.8796 2.7893 23.7219 1.94125 22.4257 1.36341C21.1295 0.785575 19.7249 0.491269 18.3058 0.500197C16.1708 0.495044 14.0893 1.16803 12.3614 2.42214C10.6335 3.67624 9.34853 5.44666 8.6917 7.47815C7.30085 7.76286 5.98686 8.3414 4.8377 9.17505C3.68854 10.0087 2.73073 11.0782 2.02839 12.312C0.956464 14.1591 0.498905 16.2988 0.721698 18.4228C0.944492 20.5467 1.83612 22.5449 3.268 24.1293C2.81966 25.4759 2.66413 26.9026 2.81182 28.3141C2.95951 29.7256 3.40701 31.0892 4.12437 32.3138C5.18791 34.1659 6.8123 35.6322 8.76321 36.5013C10.7141 37.3704 12.8907 37.5973 14.9789 37.1492C15.9208 38.2107 17.0786 39.0587 18.3747 39.6366C19.6709 40.2144 21.0755 40.5087 22.4946 40.4998C24.6307 40.5054 26.7133 39.8321 28.4418 38.5772C30.1704 37.3223 31.4556 35.5506 32.1119 33.5179C33.5027 33.2332 34.8167 32.6547 35.9659 31.821C37.115 30.9874 38.0728 29.9178 38.7752 28.684C39.8458 26.8371 40.3023 24.6979 40.0789 22.5748C39.8556 20.4517 38.9639 18.4544 37.5324 16.8707Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <p className="whitespace-pre-wrap text-[15px] leading-7">
            {message.content}
          </p>

          <div className="mt-4 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2 text-xs text-gray-400 hover:bg-gray-700/50 hover:text-white"
            >
              <Copy className="mr-1 h-3.5 w-3.5" />
              {copied ? "Copied" : ""}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-gray-400 hover:bg-gray-700/50 hover:text-white"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-gray-400 hover:bg-gray-700/50 hover:text-white"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-gray-400 hover:bg-gray-700/50 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-gray-400 hover:bg-gray-700/50 hover:text-white"
            >
              <Share className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
