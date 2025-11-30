"use client";

/**
 * @deprecated This component is legacy code.
 *
 * The chat interface now uses the Thesys C1Chat component from @thesysai/genui-sdk
 * which provides its own welcome/empty state UI.
 *
 * This component is kept for reference or potential custom implementations
 * that don't use the C1Chat component.
 *
 * See: components/chat/chat-interface.tsx for the active implementation
 */

import React from "react";

/** @deprecated Use C1Chat component instead which has built-in welcome screen */
export default function WelcomeScreen() {
  return (
    <div className="flex h-full items-center justify-center bg-[#050509]">
      <div className="max-w-2xl px-4 text-center">
        <div className="mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <h1 className="mb-3 text-3xl font-semibold text-white">
          Welcome to Finto AI
        </h1>
        <p className="text-sm text-gray-400">
          Ask anything about your portfolio, investments, or market insights.
          I&apos;ll respond with rich, interactive UI powered by Thesys C1.
        </p>
      </div>
    </div>
  );
}
