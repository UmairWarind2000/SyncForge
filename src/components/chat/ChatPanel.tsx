// src/components/chat/ChatPanel.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Send } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setMessages, addOptimisticMessage } from "@/store/slices/chatSlice";
import { useGetMessagesQuery } from "@/store/api/boardApi";
import { useSocket } from "@/hooks/useSocket";
import { UserAvatar } from "@/components/layout/UserAvatar";

interface ChatPanelProps {
  workspaceId: string;
}

export function ChatPanel({ workspaceId }: ChatPanelProps) {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const { emit } = useSocket(workspaceId);

  const messages = useAppSelector((s) => s.chat.messages[workspaceId] ?? []);
  const typingUsers = useAppSelector((s) => s.chat.typingUsers);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load message history from API
  const { data: serverMessages } = useGetMessagesQuery(workspaceId);

  useEffect(() => {
    if (serverMessages) {
      dispatch(
        setMessages({
          workspaceId,
          messages: serverMessages.map((m) => ({
            ...m,
            authorName: m.authorName ?? "Unknown",
            authorImage: m.authorImage ?? null,
          })),
        })
      );
    }
  }, [serverMessages, workspaceId, dispatch]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing indicator
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);

      if (!isTyping) {
        setIsTyping(true);
        emit("chat:typing", {
          workspaceId,
          userId: session?.user?.id,
          userName: session?.user?.name,
        });
      }

      // Stop typing after 2s of no input
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      typingTimerRef.current = setTimeout(() => {
        setIsTyping(false);
        emit("chat:stop-typing", {
          workspaceId,
          userId: session?.user?.id,
        });
      }, 2000);
    },
    [isTyping, workspaceId, session, emit]
  );

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !session?.user) return;

    const tempId = `temp-${Date.now()}`;

    // Optimistic message — shows instantly before server confirms
    dispatch(
      addOptimisticMessage({
        workspaceId,
        message: {
          id: tempId,
          content: input.trim(),
          createdAt: new Date().toISOString(),
          authorId: session.user.id,
          authorName: session.user.name ?? "You",
          authorImage: session.user.image ?? null,
          tempId,
          isPending: true,
        },
      })
    );

    // Send via Socket.io
    emit("chat:message", {
      workspaceId,
      content: input.trim(),
      authorId: session.user.id,
      authorName: session.user.name,
      authorImage: session.user.image,
      tempId,
    });

    setInput("");
    setIsTyping(false);
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
  }

  const typingNames = Object.values(typingUsers).filter(Boolean);

  return (
    <div className="flex flex-col h-full">
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hello! 👋
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.authorId === session?.user?.id;
          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : ""}`}
            >
              <UserAvatar
                name={msg.authorName}
                image={msg.authorImage}
                size="sm"
                className="shrink-0 mt-0.5"
              />
              <div
                className={`max-w-xs ${isOwn ? "items-end" : "items-start"} flex flex-col`}
              >
                {!isOwn && (
                  <span className="text-xs text-muted-foreground mb-1">
                    {msg.authorName}
                  </span>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${isOwn
                    ? `bg-primary text-primary-foreground rounded-tr-sm ${msg.isPending ? "opacity-70" : ""
                    }`
                    : "bg-muted rounded-tl-sm"
                    }`}
                >
                  {msg.content}
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingNames.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs text-muted-foreground">
              {typingNames.join(", ")} {typingNames.length === 1 ? "is" : "are"} typing…
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="border-t p-3 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Send a message…"
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}