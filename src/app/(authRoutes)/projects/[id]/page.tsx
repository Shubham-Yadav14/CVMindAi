"use client";

import { CSSProperties, FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import {
  ArrowLeft,
  Bot,
  Code2,
  FileDown,
  GripVertical,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import useModeStore from "@/app/lib/useModeStore";
import { useSnackbar } from "@/app/components/ui/SnackbarProvider";
import Skeleton from "@/app/components/ui/Skeleton";

const PDF_CACHE_TTL = 10 * 60 * 1000;

const pdfCache = new Map<string, { blob: Blob; expiresAt: number }>();

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

async function getLatexHash(source: string): Promise<string> {
  const bytes = new TextEncoder().encode(source);

  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

function EditorSkeleton({ lightMode }: { lightMode: boolean }) {
  const skeletonClass = lightMode ? "bg-slate-200" : "bg-slate-700";

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <Skeleton className={`h-4 w-1/3 ${skeletonClass}`} />
      {Array.from({ length: 14 }, (_, index) => (
        <Skeleton
          key={index}
          className={`h-4 ${index % 4 === 0 ? "w-3/4" : index % 3 === 0 ? "w-1/2" : "w-full"} ${skeletonClass}`}
        />
      ))}
    </div>
  );
}

export default function ProjectEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lightMode } = useModeStore();
  const { showSnackbar } = useSnackbar();

  const [title, setTitle] = useState("Project");
  const [latexCode, setLatexCode] = useState("");
  const [message, setMessage] = useState("");

  const [editingMessageId, setEditingMessageId] = useState<string | null>(
    null,
  );
  const [editingText, setEditingText] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Tell me what you would like to change in your resume. I will update the LaTeX for you.",
    },
  ]);

  const [tab, setTab] = useState<"code" | "preview">("code");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [compiling, setCompiling] = useState(false);
  const [chatWidth, setChatWidth] = useState(380);
  const [resizing, setResizing] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  useEffect(
    () => () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [previewUrl],
  );

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (event: MouseEvent) => {
      const maximumWidth = Math.min(560, window.innerWidth * 0.6);
      setChatWidth(Math.min(maximumWidth, Math.max(280, event.clientX)));
    };
    const stopResizing = () => setResizing(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", stopResizing);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizing]);

  useEffect(() => {
    const messagesElement = chatMessagesRef.current;
    if (!messagesElement) return;

    messagesElement.scrollTo({
      top: messagesElement.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  const scrollEditorToBottom = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel();
    if (model) editor.revealLine(model.getLineCount());
  };

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load project");
        }

        setTitle(data.project.title);
        setLatexCode(data.project.latexCode);
      })
      .catch((loadError) =>
        showSnackbar(loadError instanceof Error ? loadError.message : "Unable to load project", "error"),
      )
      .finally(() => setLoading(false));
  }, [id, showSnackbar]);

  useEffect(() => {
    fetch(`/api/projects/${id}/chat`)
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load project chats");
        }

        const history: ChatMessage[] = data.chats.flatMap(
          (chat: {
            _id: string;
            humanCommand: string;
            aiResponse?: string;
          }) => [
            {
              id: `${chat._id}-user`,
              role: "user" as const,
              content: chat.humanCommand,
            },
            {
              id: `${chat._id}-assistant`,
              role: "assistant" as const,
              content: chat.aiResponse || "I updated the LaTeX for you.",
            },
          ],
        );

        if (history.length > 0) {
          setMessages(history);
        }
      })
      .catch((loadError) =>
        showSnackbar(loadError instanceof Error ? loadError.message : "Unable to load project chats", "error"),
      );
  }, [id, showSnackbar]);

  const save = async (code = latexCode) => {
    setSaving(true);

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latexCode: code,
        }),
      });

      if (!response.ok) {
        throw new Error(
          (await response.json()).error ?? "Unable to save project",
        );
      }
      showSnackbar("Resume saved successfully.", "success");
    } catch (saveError) {
      showSnackbar(saveError instanceof Error ? saveError.message : "Unable to save project", "error");
    } finally {
      setSaving(false);
    }
  };

  const compilePreview = async () => {
    if (!latexCode.trim() || compiling) {
      return;
    }

    setCompiling(true);

    try {
      const hash = await getLatexHash(latexCode);
      const cacheKey = `${id}:${hash}`;

      const cached = pdfCache.get(cacheKey);

      let pdfBlob =
        cached && cached.expiresAt > Date.now()
          ? cached.blob
          : undefined;

      if (!pdfBlob) {
        const response = await fetch(`/api/projects/${id}/pdf`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            latexCode,
          }),
        });

        if (!response.ok) {
          const data = await response.json();

          throw new Error(data.error ?? "Unable to compile PDF");
        }

        pdfBlob = await response.blob();

        pdfCache.set(cacheKey, {
          blob: pdfBlob,
          expiresAt: Date.now() + PDF_CACHE_TTL,
        });
      }

      const nextUrl = URL.createObjectURL(pdfBlob);

      setPreviewUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }

        return nextUrl;
      });
      showSnackbar("PDF preview compiled successfully.", "success");
    } catch (compileError) {
      showSnackbar(compileError instanceof Error ? compileError.message : "Unable to compile PDF", "error");
    } finally {
      setCompiling(false);
    }
  };

  /**
   * Sends the user's request to the AI agent.
   *
   * This function is used for both:
   * - New requests
   * - Edited requests
   *
   * IMPORTANT:
   * Editing itself does NOT call this function.
   * This function is only called after the user clicks Send.
   */
  const sendAgentRequest = async (
    request: string,
    editedId?: string,
  ) => {
    if (!request.trim() || sending) {
      return;
    }

    const cleanRequest = request.trim();

    setMessage("");

    const requestId = editedId
      ? `${editedId}-retry`
      : `request-${messages.length}`;

    /**
     * If this is an edited message:
     * replace the old user message with the edited content.
     *
     * Otherwise:
     * add a new user message.
     */
    setMessages((current) => {
      if (editedId) {
        const messageIndex = current.findIndex(
          (item) => item.id === editedId,
        );

        if (messageIndex >= 0) {
          return [
            ...current.slice(0, messageIndex),
            {
              ...current[messageIndex],
              content: cleanRequest,
            },
          ];
        }
      }

      return [
        ...current,
        {
          id: requestId,
          role: "user",
          content: cleanRequest,
        },
      ];
    });

    /**
     * Exit edit mode ONLY after Send is clicked.
     */
    setEditingMessageId(null);
    setEditingText("");

    setSending(true);
    setTab("code");

    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return "";
    });

    try {
      const response = await fetch(`/api/projects/${id}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: cleanRequest,
        }),
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.error ?? "The agent could not update the resume",
        );
      }

      if (!response.body) {
        throw new Error("The agent returned no response stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let pending = "";
      let streamedLatex = "";
      let completed = false;

      while (true) {
        const { value, done } = await reader.read();

        pending += decoder.decode(value, {
          stream: !done,
        });

        const lines = pending.split("\n");

        pending = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) {
            continue;
          }

          const chunk = JSON.parse(line) as {
            content?: string;
            done?: boolean;
            message?: string;
            error?: string;
          };

          if (chunk.error) {
            throw new Error(chunk.error);
          }

          if (chunk.content) {
            streamedLatex += chunk.content;

            setLatexCode(streamedLatex);
            requestAnimationFrame(scrollEditorToBottom);
          }

          if (chunk.done) {
            completed = true;
            const confirmation = chunk.message ?? "I updated the LaTeX for you.";
            showSnackbar("Resume Changed Successfully", "success");

            setMessages((current) => [
              ...current,
              {
                id: `${requestId}-response`,
                role: "assistant",
                content: confirmation,
              },
            ]);
          }
        }

        if (done) {
          break;
        }
      }

      if (pending.trim()) {
        const chunk = JSON.parse(pending) as {
          content?: string;
          done?: boolean;
          message?: string;
          error?: string;
        };

        if (chunk.error) {
          throw new Error(chunk.error);
        }

        if (chunk.content) {
          streamedLatex += chunk.content;

          setLatexCode(streamedLatex);
          requestAnimationFrame(scrollEditorToBottom);
        }

        if (chunk.done) {
          completed = true;
          const confirmation = chunk.message ?? "I updated the LaTeX for you.";
          showSnackbar(confirmation, "success");

          setMessages((current) => [
            ...current,
            {
              id: `${requestId}-response`,
              role: "assistant",
              content: confirmation,
            },
          ]);
        }
      }

      if (!completed) {
        throw new Error(
          "The agent did not finish generating LaTeX",
        );
      }
    } catch (chatError) {
      showSnackbar(chatError instanceof Error ? chatError.message : "The agent could not update the resume", "error");
    } finally {
      setSending(false);
    }
  };

  /**
   * Send a completely new request.
   */
  const askAgent = (event: FormEvent) => {
    event.preventDefault();

    const cleanMessage = message.trim();

    if (!cleanMessage) {
      return;
    }

    void sendAgentRequest(cleanMessage);
  };

  /**
   * Enter sends a NEW message.
   *
   * Shift + Enter creates a new line.
   */
  const handleMessageKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      event.currentTarget.form?.requestSubmit();
    }
  };

  /**
   * Clicking Edit ONLY opens the textarea.
   *
   * No API request is made here.
   */
  const editMessage = (item: ChatMessage) => {
    setEditingText(item.content);
    setEditingMessageId(item.id);
  };

  /**
   * Cancel editing without sending anything.
   */
  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  /**
   * Send the edited message.
   *
   * This is the ONLY place where clicking the edited Send button
   * triggers the AI request.
   */
  const sendEditedMessage = (item: ChatMessage) => {
    const cleanEditedText = editingText.trim();

    if (!cleanEditedText || sending) {
      return;
    }

    void sendAgentRequest(cleanEditedText, item.id);
  };

  const background = lightMode
    ? "bg-[#f4f7fb] text-slate-900"
    : "bg-[#111827] text-slate-100";

  const panel = lightMode
    ? "border-slate-200 bg-white"
    : "border-slate-700 bg-[#1b2535]";

  const muted = lightMode
    ? "text-slate-500"
    : "text-slate-400";

  const field = lightMode
    ? "border-slate-200 bg-slate-50"
    : "border-slate-700 bg-slate-900";

  const lastUserMessageId = [...messages]
    .reverse()
    .find((item) => item.role === "user")?.id;

  return (
    <main
      className={`flex h-screen  flex-col overflow-y-scroll noSideBar ${background}`}
    >
      {/* HEADER */}
      <header
        className={`flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-7 ${
          lightMode
            ? "border-slate-200 bg-white/90"
            : "border-slate-800 bg-[#111827]"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/projects")}
            title="Back to projects"
            className={`rounded-md p-2 ${muted} hover:bg-slate-100 dark:hover:bg-slate-800`}
          >
            <ArrowLeft size={19} />
          </button>

          <div className="min-w-0">
            <p
              className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${muted}`}
            >
              Resume studio
            </p>

            <h1 className="truncate text-base font-semibold">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`hidden text-xs sm:block ${muted}`}
          >
            {saving ? "Saving..." : "All changes saved"}
          </span>

          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || loading}
            className="flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <FileDown size={16} />

            Save
          </button>
        </div>
      </header>

      <div
        className="relative grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[var(--chat-width)_minmax(0,1fr)]"
        style={{ "--chat-width": `${chatWidth}px` } as CSSProperties}
      >
        {/* LEFT SIDEBAR */}
        <aside
          className={`flex min-h-[70vh] flex-col border-b lg:border-b-0 lg:border-r ${
            lightMode
              ? "border-slate-200 bg-white"
              : "border-slate-800 bg-[#172131]"
          }`}
        >
          <div className={`border-b px-5 py-4 ${lightMode ? "border-slate-200" : "border-slate-800"}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <Bot size={19} />
              </div>
              <div>
                <p className="text-sm font-semibold">Resume agent</p>
                <p className={`mt-0.5 text-[11px] ${muted}`}>Your editing history</p>
              </div>

              <span className="ml-auto flex items-center gap-1 text-[11px] text-emerald-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                Online
              </span>
            </div>

          </div>

          <div className={`flex items-center justify-between px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] ${muted}`}>
            <span>Conversation</span>
            <span className="rounded-full bg-slate-100 px-2 py-1 normal-case tracking-normal text-slate-500">
              {messages.filter((item) => item.role === "user").length} requests
            </span>
          </div>

          {/* CHAT MESSAGES */}
          <div
            ref={chatMessagesRef}
            className="flex  flex-1 flex-col gap-4 overflow-y-auto noSideBar px-5 pb-5 text-sm lg:min-h-48"
          >
            {messages.map((item) => (
              <div
                key={item.id}
                className={`group flex w-full flex-col items-end gap-2 ${
                  item.role === "user" ? "self-end" : ""
                }`}
              >
                <div
                    className={`w-full rounded-2xl px-3.5 py-3 leading-5 shadow-sm ${
                    item.role === "user"
                      ? "rounded-br-md bg-indigo-600 text-white"
                      : lightMode
                        ? "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                        : "rounded-bl-md border border-slate-700 bg-slate-800 text-slate-200"
                  }`}
                >
                  {item.role === "assistant" && (
                    <Sparkles
                      size={14}
                      className="mb-1 text-indigo-500"
                    />
                  )}

                  {editingMessageId === item.id ? (
                    
                    <textarea
                      autoFocus
                      value={editingText}
                      onChange={(event) =>
                        setEditingText(event.target.value)
                      }
                      rows={4}
                      className="w-full min-w-0 resize-y bg-transparent text-sm outline-none"
                      placeholder="Edit your request..."
                    />
                  ) : (
                    <span>{item.content}</span>
                  )}
                </div>
                  {/* EDIT / SEND / CANCEL BUTTONS */}
                {item.role === "user" &&
                  item.id === lastUserMessageId &&
                  !sending && (
                    editingMessageId === item.id ? (
                      <div className="flex shrink-0 items-center gap-1">
                        {/* CANCEL */}
                        <button
                          type="button"
                          onClick={cancelEdit}
                          title="Cancel edit"
                          className={`rounded-md p-2 ${muted} hover:bg-slate-100 dark:hover:bg-slate-800`}
                        >
                          ×
                        </button>

                        {/* SEND EDITED MESSAGE */}
                        <button
                          type="button"
                          onClick={() =>
                            sendEditedMessage(item)
                          }
                          disabled={!editingText.trim()}
                          title="Send edited request"
                          className="inline-flex shrink-0 rounded-md bg-indigo-600 p-2 text-white hover:bg-indigo-700 disabled:opacity-40"
                        >
                          <Send size={15} />
                        </button>
                      </div>
                    ) : (
                      /* EDIT BUTTON */
                      <button
                        type="button"
                        onClick={() => editMessage(item)}
                        title="Edit last request"
                        className="inline-flex shrink-0  text-indigo-500 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer focus:opacity-100"
                      >
                        <Pencil size={13} />
                      </button>
                    )
                  )}
                
              </div>
            ))}

            {/* AI LOADING */}
            {sending && (
              <div
                className={`flex items-center gap-2 text-xs ${muted}`}
              >
                <LoaderCircle
                  size={14}
                  className="animate-spin"
                />

                Updating your LaTeX...
              </div>
            )}
          </div>

          {/* NEW MESSAGE INPUT */}
          <form
            onSubmit={askAgent}
            className={`border-t p-4 ${lightMode ? "border-slate-200" : "border-slate-800"}`}
          >
            <div
              className={`flex items-end gap-2 rounded-xl border p-2 shadow-sm ${field}`}
            >
              <textarea
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                onKeyDown={handleMessageKeyDown}
                placeholder="Ask for a change..."
                rows={2}
                className="min-h-12 max-h-24 flex-1 resize-none overflow-y-auto bg-transparent px-1 py-1 text-sm outline-none field-sizing-content"
              />

              <button
                type="submit"
                disabled={sending || !message.trim()}
                title="Send request"
                className="rounded-md bg-indigo-600 p-2.5 text-white hover:bg-indigo-700 disabled:opacity-40"
              >
                <Send size={17} />
              </button>
            </div>

            <p
              className={`mt-2 px-1 text-[11px] ${muted}`}
            >
              Try: “Make my experience section more prominent.”
            </p>
          </form>
        </aside>

        <button
          type="button"
          aria-label="Resize chat panel"
          title="Drag to resize chat panel"
          onMouseDown={() => setResizing(true)}
          className={`absolute z-10 hidden h-full w-3 -translate-x-1/2 cursor-col-resize items-center justify-center lg:flex ${lightMode ? "text-slate-300 hover:text-indigo-500" : "text-slate-600 hover:text-indigo-400"}`}
          style={{ left: `${chatWidth}px` }}
        >
          <span className={`flex h-14 w-1 items-center justify-center rounded-full transition-colors hover:w-1.5 ${lightMode ? "bg-slate-200 hover:bg-indigo-400" : "bg-slate-700 hover:bg-indigo-500"}`}>
            <GripVertical size={12} />
          </span>
        </button>

        {/* RIGHT SIDE EDITOR */}
        <section className="flex min-h-[70vh] flex-col p-3 sm:p-5">
          <div
            className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm ${panel}`}
          >
            {/* TABS */}
            <div
              className={`flex h-14 shrink-0 items-center justify-between border-b px-2 ${
                lightMode
                  ? "border-slate-200"
                  : "border-slate-700"
              }`}
            >
              <div className="flex h-full items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTab("code")}
                  className={`flex h-full items-center gap-2 border-b-2 px-4 text-sm font-semibold ${
                    tab === "code"
                      ? "border-indigo-500 text-indigo-500"
                      : `border-transparent ${muted}`
                  }`}
                >
                  <Code2 size={16} />

                  Code editor
                </button>

                <button
                  type="button"
                  disabled={sending || loading}
                  onClick={() => {
                    setTab("preview");

                    void compilePreview();
                  }}
                  className={`flex h-full items-center gap-2 border-b-2 px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                    tab === "preview"
                      ? "border-indigo-500 text-indigo-500"
                      : `border-transparent ${muted}`
                  }`}
                >
                  <FileDown size={16} />

                  PDF preview
                </button>
              </div>

              {tab === "preview" && (
                <button
                  type="button"
                  onClick={() => void compilePreview()}
                  title="Refresh preview"
                  className={`rounded-md p-2 ${muted} hover:bg-slate-100`}
                >
                  <RefreshCw size={16} />
                </button>
              )}
            </div>

            {/* EDITOR / PDF */}
            {loading ? (
              <EditorSkeleton lightMode={lightMode} />
            ) : tab === "code" ? (
              <Editor
                height="100%"
                language="latex"
                theme={lightMode ? "light" : "vs-dark"}
                value={latexCode}
                onMount={(editor, monaco) => {
                  editorRef.current = editor;

                  editor.addAction({
                    id: "save-resume",
                    label: "Save resume",
                    keybindings: [
                      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                    ],
                    run: () => {
                      void save(editor.getValue());
                    },
                  });

                  scrollEditorToBottom();
                }}
                onChange={(value) => {
                  setLatexCode(value ?? "");

                  setPreviewUrl((currentUrl) => {
                    if (currentUrl) {
                      URL.revokeObjectURL(currentUrl);
                    }

                    return "";
                  });
                }}
                options={{
                  automaticLayout: true,
                  minimap: {
                    enabled: false,
                  },
                  fontSize: 14,
                  padding: {
                    top: 20,
                    bottom: 20,
                  },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                }}
                loading={
                  <EditorSkeleton lightMode={lightMode} />
                }
              />
            ) : compiling ? (
              <div
                className={`flex flex-1 items-center justify-center gap-2 ${muted}`}
              >
                <LoaderCircle className="animate-spin" />

                Compiling PDF...
              </div>
            ) : previewUrl ? (
              <iframe
                title="Compiled PDF preview"
                src={previewUrl}
                className="min-h-0 flex-1 bg-slate-200"
              />
            ) : (
              <div
                className={`flex flex-1 items-center justify-center ${muted}`}
              >
                Click refresh to compile the current LaTeX.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
