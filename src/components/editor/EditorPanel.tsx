// src/components/editor/EditorPanel.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import { Code2, Sparkles } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setFiles, openFile } from "@/store/slices/editorSlice";
import { FileTree } from "./FileTree";
import { TabBar }   from "./TabBar";
import { AiPanel }  from "./AiPanel";
import { Button }   from "@/components/ui/button";

const MonacoEditorComponent = dynamic(
  () =>
    import("./MonacoEditor").then((mod) => ({
      default: mod.MonacoEditorComponent,
    })),
  {
    ssr:     false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading editor…</p>
      </div>
    ),
  }
);

interface EditorPanelProps {
  workspaceId: string;
}

export function EditorPanel({ workspaceId }: EditorPanelProps) {
  const dispatch = useAppDispatch();
  const { files, openTabs, activeFileId } = useAppSelector((s) => s.editor);

  const [isLoadingFiles, setIsLoadingFiles]   = useState(true);
  const [showAiPanel, setShowAiPanel]         = useState(false);
  const [selectedCode, setSelectedCode]       = useState("");
  // Ref to call insert function from inside MonacoEditor
  const insertCodeRef = useRef<((code: string) => void) | null>(null);

  useEffect(() => {
    async function loadFiles() {
      try {
        const res  = await fetch(`/api/files?workspaceId=${workspaceId}`);
        const data = await res.json();
        if (data.success) dispatch(setFiles(data.data));
      } finally {
        setIsLoadingFiles(false);
      }
    }
    loadFiles();
  }, [workspaceId, dispatch]);

  async function handleFileSelect(fileId: string) {
    const alreadyOpen = openTabs.find((t) => t.id === fileId);
    if (alreadyOpen) {
      dispatch(openFile({ ...alreadyOpen }));
      return;
    }
    try {
      const res  = await fetch(`/api/files/${fileId}`);
      const data = await res.json();
      if (data.success) {
        dispatch(
          openFile({
            id:       data.data.id,
            name:     data.data.name,
            path:     data.data.path,
            language: data.data.language,
            content:  data.data.content,
            isDirty:  false,
          })
        );
      }
    } catch (err) {
      console.error("Failed to load file:", err);
    }
  }

  const activeTab = openTabs.find((t) => t.id === activeFileId);

  return (
    <div className="flex h-full overflow-hidden">
      {/* File tree */}
      <FileTree workspaceId={workspaceId} onFileSelect={handleFileSelect} />

      {/* Editor area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b bg-background shrink-0">
          <TabBar />
          {activeTab && (
            <Button
              size="sm"
              variant={showAiPanel ? "default" : "outline"}
              className="text-xs ml-2 shrink-0"
              onClick={() => setShowAiPanel(!showAiPanel)}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              AI
            </Button>
          )}
        </div>

        {/* Editor + AI panel side by side */}
        <div className="flex flex-1 overflow-hidden">
          {activeTab ? (
            <MonacoEditorComponent
              key={activeTab.id}
              fileId={activeTab.id}
              content={activeTab.content}
              language={activeTab.language}
              workspaceId={workspaceId}
              onSelectionChange={setSelectedCode}
              onInsertRef={insertCodeRef}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Code2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">No file open</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Select a file from the tree, or create one with the + button.
              </p>
            </div>
          )}

          {/* AI panel */}
          {showAiPanel && activeTab && (
            <AiPanel
              selectedCode={selectedCode}
              language={activeTab.language}
              fileName={activeTab.name}
              workspaceId={workspaceId}
              onInsertCode={(code) => insertCodeRef.current?.(code)}
              onClose={() => setShowAiPanel(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}