// src/components/editor/MonacoEditor.tsx
"use client";

import { useRef, useCallback, useEffect } from "react";
import Editor, { OnMount, OnChange } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateLocalContent, getUserColor } from "@/store/slices/editorSlice";
import { useSocket } from "@/hooks/useSocket";

interface MonacoEditorProps {
  fileId: string;
  content: string;
  language: string;
  workspaceId: string;
  onSelectionChange?: (code: string) => void;
  onInsertRef?: React.MutableRefObject<((code: string) => void) | null>;
}

export function MonacoEditorComponent({
  fileId,
  content,
  language,
  workspaceId,
  onSelectionChange,
  onInsertRef,
}: MonacoEditorProps) {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const { emit } = useSocket(workspaceId);

  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  // Track decorations for remote cursors
  const decorationsRef = useRef<string[]>([]);
  // Debounce ref for emitting changes
  const emitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const remoteCursors = useAppSelector(
    (s) => s.editor.remoteCursors[fileId] ?? []
  );

  // Called when editor mounts
  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure Monaco theme to match our UI
    monaco.editor.defineTheme("syncforge-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#ffffff",
        "editor.lineHighlightBackground": "#f8fafc",
        "editorLineNumber.foreground": "#94a3b8",
      },
    });

    monaco.editor.setTheme("syncforge-light");

    // Notify others this file is open
    emit("editor:file-opened", {
      workspaceId,
      fileId,
      userId: session?.user?.id ?? "",
      userName: session?.user?.name ?? "Unknown",
    });

    // Listen for cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      if (!session?.user?.id) return;

      emit("editor:cursor", {
        workspaceId,
        fileId,
        userId: session.user.id,
        userName: session.user.name ?? "Unknown",
        lineNumber: e.position.lineNumber,
        column: e.position.column,
        color: getUserColor(session.user.id),
      });
    });

    // Track selected text and pass to AI panel
    editor.onDidChangeCursorSelection((e) => {
      const model = editor.getModel();
      if (!model) return;
      const selected = model.getValueInRange(e.selection);
      onSelectionChange?.(selected);
    });

    // Expose insert function so AI panel can insert refactored code
    if (onInsertRef) {
      onInsertRef.current = (code: string) => {
        const selection = editor.getSelection();
        if (!selection) return;
        editor.executeEdits("ai-refactor", [
          {
            range: selection,
            text: code,
            forceMoveMarkers: true,
          },
        ]);
        editor.focus();
      };
    }
  }, [fileId, workspaceId, session, emit, onSelectionChange, onInsertRef]);

  // Called when content changes
  const handleChange: OnChange = useCallback(
    (value) => {
      if (value === undefined) return;

      // Update Redux immediately
      dispatch(updateLocalContent({ fileId, content: value }));

      // Debounce socket emit — don't send on every single keystroke
      if (emitTimerRef.current) {
        clearTimeout(emitTimerRef.current);
      }
      emitTimerRef.current = setTimeout(() => {
        emit("editor:change", {
          workspaceId,
          fileId,
          content: value,
          versionId: editorRef.current?.getModel()?.getAlternativeVersionId() ?? 0,
        });
      }, 100); // 100ms debounce — fast enough to feel real-time
    },
    [fileId, workspaceId, dispatch, emit]
  );

  // Apply remote cursor decorations when they change
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    // Build decoration array from remote cursors
    const newDecorations = remoteCursors
      .filter((c) => c.userId !== session?.user?.id)
      .map((cursor) => ({
        range: new monaco.Range(
          cursor.lineNumber,
          cursor.column,
          cursor.lineNumber,
          cursor.column
        ),
        options: {
          className: `remote-cursor-${cursor.userId.slice(-6)}`,
          afterContentClassName: `remote-cursor-label`,
          // Inject CSS for this cursor color dynamically
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      }));

    // Apply decorations — Monaco manages the delta automatically
    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );

    // Inject cursor color styles
    remoteCursors.forEach((cursor) => {
      const styleId = `cursor-style-${cursor.userId.slice(-6)}`;
      if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
          .remote-cursor-${cursor.userId.slice(-6)} {
            border-left: 2px solid ${cursor.color};
            margin-left: -1px;
          }
          .remote-cursor-${cursor.userId.slice(-6)}::before {
            content: "${cursor.userName}";
            position: absolute;
            top: -18px;
            left: -1px;
            background: ${cursor.color};
            color: white;
            font-size: 10px;
            padding: 1px 4px;
            border-radius: 3px;
            white-space: nowrap;
            pointer-events: none;
            z-index: 100;
          }
        `;
        document.head.appendChild(style);
      }
    });
  }, [remoteCursors, session?.user?.id]);

  // When remote content arrives, update the editor model
  // We need to do this carefully to avoid disrupting cursor position
  const remoteContent = useAppSelector(
    (s) => s.editor.openTabs.find((t) => t.id === fileId)?.content
  );

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    // Only update if content actually differs — prevent infinite loops
    if (model.getValue() !== remoteContent && remoteContent !== undefined) {
      // Save cursor position
      const position = editor.getPosition();

      // Apply the new content
      model.setValue(remoteContent);

      // Restore cursor position
      if (position) {
        editor.setPosition(position);
      }
    }
  }, [remoteContent, fileId]);

  return (
    <div className="flex-1 overflow-hidden">
      <Editor
        height="100%"
        language={language}
        defaultValue={content}
        onMount={handleMount}
        onChange={handleChange}
        options={{
          fontSize: 14,
          fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
          fontLigatures: true,
          lineNumbers: "on",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 2,
          renderLineHighlight: "line",
          cursorBlinking: "smooth",
          smoothScrolling: true,
          contextmenu: true,
          automaticLayout: true, // resize with container
          padding: { top: 12, bottom: 12 },
        }}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-muted-foreground">
              Loading editor…
            </div>
          </div>
        }
      />
    </div>
  );
}