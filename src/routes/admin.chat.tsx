import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  adminDeleteConversation,
  adminGetConversation,
  adminListConversations,
  adminSendChat,
  adminSetChatStatus,
  type ChatMessage,
  type Conversation,
} from "~/lib/chat-api";
import { cn, phoneDigits, waLink } from "~/lib/ui";
import { AdminPage, Btn, EmptyState, fmtDate, useAction } from "~/components/admin/kit";
import { ArrowLeft, MailIcon, PhoneIcon, WhatsAppIcon } from "~/components/Icons";

type Search = { id?: number; view?: "open" | "closed" };

export const Route = createFileRoute("/admin/chat")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    id: Number(s.id) > 0 ? Number(s.id) : undefined,
    view: s.view === "closed" ? "closed" : undefined,
  }),
  component: ChatAdmin,
});

const timeOf = (s: string) => {
  const d = new Date(s.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return "";
  const today = new Date().toDateString() === d.toDateString();
  return today ? d.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" }) : fmtDate(s);
};

function ChatAdmin() {
  const { id, view } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/chat" });
  const [list, setList] = useState<Conversation[] | null>(null);

  const loadList = useCallback(async () => {
    try {
      setList(await adminListConversations({ data: { status: view ?? "open" } }));
    } catch {
      /* ignore, next poll retries */
    }
  }, [view]);

  useEffect(() => {
    loadList();
    const t = setInterval(loadList, 5000);
    return () => clearInterval(t);
  }, [loadList]);

  return (
    <AdminPage title="Live chat" subtitle="Reply to visitors chatting on the website. Keep this page open to show as 'Online now'.">
      <div className="grid h-[calc(100vh-14rem)] min-h-[480px] overflow-hidden rounded-xl border border-zinc-200 bg-white md:grid-cols-[300px_1fr]">
        {/* Conversation list */}
        <aside className={cn("flex min-h-0 flex-col border-zinc-200 md:border-r", id && "hidden md:flex")}>
          <div className="flex gap-1 border-b border-zinc-200 p-2">
            {(["open", "closed"] as const).map((v) => (
              <button
                key={v}
                onClick={() => navigate({ search: { view: v === "open" ? undefined : v } })}
                className={cn("flex-1 rounded-lg px-3 py-1.5 text-sm font-medium capitalize", (view ?? "open") === v ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100")}
              >
                {v}
              </button>
            ))}
          </div>
          <ul className="flex-1 divide-y divide-zinc-100 overflow-y-auto">
            {list === null && <li className="p-4 text-sm text-zinc-500">Loading…</li>}
            {list?.length === 0 && <li className="p-4 text-sm text-zinc-500">No {view ?? "open"} conversations.</li>}
            {list?.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => navigate({ search: { id: c.id, view } })}
                  className={cn("flex w-full gap-3 px-4 py-3 text-left hover:bg-zinc-50", c.id === id && "bg-zinc-100")}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700">
                    {c.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("truncate text-sm", c.unread_staff ? "font-semibold" : "font-medium")}>{c.name}</span>
                      <span className="shrink-0 text-[0.68rem] text-zinc-400">{timeOf(c.last_message_at)}</span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("truncate text-xs", c.unread_staff ? "text-zinc-900" : "text-zinc-500")}>
                        {c.last_sender === "staff" ? "You: " : ""}
                        {c.last_body}
                      </span>
                      {c.unread_staff > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[0.65rem] font-bold text-white">{c.unread_staff}</span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Thread */}
        <section className={cn("min-h-0", !id && "hidden md:block")}>
          {id ? (
            <Thread key={id} id={id} onBack={() => navigate({ search: { view } })} onChanged={loadList} />
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <EmptyState title="Select a conversation" text="New chats from the website appear on the left. You'll also see a count on 'Live chat' in the sidebar." />
            </div>
          )}
        </section>
      </div>
    </AdminPage>
  );
}

function Thread({ id, onBack, onChanged }: { id: number; onBack: () => void; onChanged: () => void }) {
  const [convo, setConvo] = useState<Omit<Conversation, "unread_staff" | "last_message_at" | "last_body" | "last_sender"> | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [missing, setMissing] = useState(false);
  const { busy, run } = useAction();
  const lastId = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await adminGetConversation({ data: { id, after: lastId.current } });
      if (!r) return setMissing(true);
      setConvo(r.conversation);
      if (r.messages.length) {
        lastId.current = r.messages[r.messages.length - 1].id;
        setMessages((m) => [...m, ...r.messages.filter((x) => !m.some((y) => y.id === x.id))]);
      }
    } catch {
      /* retry next tick */
    }
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    const r = await run(() => adminSendChat({ data: { id, body } }));
    if (r) {
      setText("");
      await load();
      onChanged();
    }
  }

  if (missing) return <div className="p-6 text-sm text-zinc-500">This conversation was deleted.</div>;
  if (!convo) return <div className="p-6 text-sm text-zinc-500">Loading…</div>;

  const phone = convo.phone;
  const email = convo.email;

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-zinc-200 px-4 py-3">
        <button onClick={onBack} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 md:hidden" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{convo.name}</p>
          <p className="truncate text-xs text-zinc-500">Started {fmtDate(convo.created_at)}{convo.status === "closed" && " · closed"}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {phone && (
            <a href={waLink(phone, `Hello ${convo.name.split(" ")[0]}, following up on your chat on our website.`)} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#25D366] p-2 text-white" aria-label="WhatsApp">
              <WhatsAppIcon size={16} />
            </a>
          )}
          {phone && (
            <a href={`tel:+${phoneDigits(phone)}`} className="rounded-lg border border-zinc-300 p-2 hover:bg-zinc-50" aria-label={`Call ${phone}`}>
              <PhoneIcon size={16} />
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="rounded-lg border border-zinc-300 p-2 hover:bg-zinc-50" aria-label={`Email ${email}`}>
              <MailIcon size={16} />
            </a>
          )}
          <Btn
            size="sm"
            onClick={async () => {
              await run(() => adminSetChatStatus({ data: { id, status: convo.status === "closed" ? "open" : "closed" } }), convo.status === "closed" ? "Reopened" : "Closed");
              await load();
              onChanged();
            }}
          >
            {convo.status === "closed" ? "Reopen" : "Close"}
          </Btn>
          <Btn
            size="sm"
            variant="danger"
            onClick={async () => {
              if (!confirm("Delete this conversation?")) return;
              await run(() => adminDeleteConversation({ data: id }), "Deleted");
              onChanged();
              onBack();
            }}
          >
            Delete
          </Btn>
        </div>
        {(phone || email) && <p className="w-full text-xs text-zinc-500">{[phone, email].filter(Boolean).join(" · ")}</p>}
      </header>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-zinc-50 px-4 py-4">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex flex-col", m.sender === "staff" ? "items-end" : "items-start")}>
            <div
              className={cn(
                "max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm",
                m.sender === "staff" ? "rounded-br-sm bg-zinc-900 text-white" : "rounded-bl-sm border border-zinc-200 bg-white",
              )}
            >
              {m.body}
            </div>
            <span className="mt-0.5 px-1 text-[0.65rem] text-zinc-400">
              {m.sender === "staff" ? m.staff_name || "Staff" : convo.name} · {timeOf(m.created_at)}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={send} className="flex items-end gap-2 border-t border-zinc-200 p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(e as unknown as FormEvent);
            }
          }}
          rows={2}
          placeholder="Type your reply… (Enter to send, Shift+Enter for a new line)"
          className="flex-1 resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />
        <Btn type="submit" variant="primary" disabled={busy || !text.trim()}>
          Send
        </Btn>
      </form>
    </div>
  );
}
