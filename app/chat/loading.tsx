"use client";

export default function ChatLoading() {
  return (
    <div className="flex h-[calc(100vh-64px)] flex-col bg-chat-surface px-4 py-6">
      <div className="mb-4 h-5 w-24 animate-pulse rounded bg-white/10" />
      <div className="flex-1 space-y-4 overflow-hidden">
        <div className="h-16 animate-pulse rounded-lg bg-white/5" />
        <div className="h-16 animate-pulse rounded-lg bg-white/5" />
        <div className="h-16 animate-pulse rounded-lg bg-white/5" />
      </div>
      <div className="mt-6 h-12 animate-pulse rounded-lg bg-white/10" />
    </div>
  );
}
