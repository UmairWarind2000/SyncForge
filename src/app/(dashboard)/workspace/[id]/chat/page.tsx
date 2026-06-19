// src/app/(dashboard)/workspace/[id]/chat/page.tsx

import { ChatPanel } from "@/components/chat/ChatPanel";

type PageProps = { params: Promise<{ id: string }> };

export default async function ChatPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="h-full">
      <ChatPanel workspaceId={id} />
    </div>
  );
}