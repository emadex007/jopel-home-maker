import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { chatPoll, chatSend, chatStart, type ChatMessage } from "~/lib/chat-api";
import { cn, img, useSite, waLink } from "~/lib/ui";
import { CloseIcon, WhatsAppIcon } from "./Icons";

const TOKEN_KEY = "jp_chat_token";
const store = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY) || "";
    } catch {
      return "";
    }
  },
  set: (v: string) => {
    try {
      if (v) localStorage.setItem(TOKEN_KEY, v);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* private mode */
    }
  },
};

const ChatIcon = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" />
    <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" />
  </svg>
);

const timeOf = (s: string) => {
  const d = new Date(s.replace(" ", "T") + "Z");
  return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
};

/** Floating live chat, bottom-right. Visitors chat with staff, who reply from the dashboard. */
export function ChatWidget() {
  const s = useSite();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [online, setOnline] = useState(false);
  const [unread, setUnread] = useState(0);
  const [text, setText] = useState("");
  const [form, setForm] = useState({ name: "", contact: "", message: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lastId = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => setToken(store.get()), []);

  const poll = useCallback(async () => {
    if (!token) return;
    try {
      const r = await chatPoll({ data: { token, after: lastId.current } });
      if (!r.ok) {
        store.set("");
        setToken("");
        setMessages([]);
        lastId.current = 0;
        return;
      }
      setOnline(r.online);
      if (r.messages.length) {
        lastId.current = r.messages[r.messages.length - 1].id;
        setMessages((m) => [...m, ...r.messages.filter((x) => !m.some((y) => y.id === x.id))]);
        const staffNew = r.messages.filter((x) => x.sender === "staff").length;
        if (!openRef.current && staffNew) setUnread((u) => u + staffNew);
      }
    } catch {
      /* network hiccup; try again next tick */
    }
  }, [token]);

  // Poll quickly while open, slowly while closed (to show the unread dot).
  useEffect(() => {
    if (!token) return;
    poll();
    const t = setInterval(poll, open ? 4000 : 25000);
    return () => clearInterval(t);
  }, [token, open, poll]);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  if (!s.chat.enabled) return null;

  async function start(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await chatStart({ data: form });
      if (!r.ok) return setError(r.error);
      store.set(r.token);
      lastId.current = r.messages.length ? r.messages[r.messages.length - 1].id : 0;
      setMessages(r.messages);
      setOnline(r.online);
      setToken(r.token);
    } catch {
      setError("Couldn't start the chat. Please try again or use WhatsApp.");
    } finally {
      setBusy(false);
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setError("");
    try {
      const r = await chatSend({ data: { token, body } });
      if (!r.ok) return setError(r.error);
      setText("");
      await poll();
    } catch {
      setError("Message not sent. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function endChat() {
    if (!confirm("Start a new conversation? This one will be cleared from this device.")) return;
    store.set("");
    setToken("");
    setMessages([]);
    lastId.current = 0;
    setForm({ name: "", contact: "", message: "", website: "" });
  }

  const inputCls = "w-full rounded-[var(--radius)] border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent";

  return (
    <>
      {/* Bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={s.chat.buttonLabel || "Open chat"}
          className="group fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary p-3.5 text-on-primary shadow-lg shadow-black/20 transition-transform hover:scale-105 md:bottom-7 md:right-7"
        >
          <ChatIcon size={28} />
          {s.chat.buttonLabel && <span className="hidden pr-1 text-sm font-semibold md:inline">{s.chat.buttonLabel}</span>}
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[0.65rem] font-bold text-white">{unread}</span>
          )}
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label={s.chat.title}
          className="fade-up fixed inset-0 z-[60] flex flex-col overflow-hidden bg-surface text-ink shadow-2xl sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[560px] sm:max-h-[calc(100vh-3rem)] sm:w-[380px] sm:rounded-2xl sm:border sm:border-line"
        >
          <header className="flex items-center gap-3 bg-primary px-4 py-3 text-on-primary">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
              {s.brand.logoUrl ? (
                <img src={img(s.brand.logoUrl, 120)} alt="" className="h-7 w-7 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
              ) : (
                <ChatIcon size={20} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{s.chat.title}</p>
              <p className="flex items-center gap-1.5 text-xs opacity-80">
                <span className={cn("h-2 w-2 rounded-full", online ? "bg-emerald-400" : "bg-zinc-400")} />
                {online ? "Online now" : "We'll reply soon"}
              </p>
            </div>
            {s.contact.whatsapp && (
              <a href={waLink(s.contact.whatsapp, s.contact.whatsappMessage)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp instead" className="rounded-full p-2 hover:bg-white/10">
                <WhatsAppIcon size={20} />
              </a>
            )}
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full p-2 hover:bg-white/10">
              <CloseIcon size={22} />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-bg px-4 py-4">
            <Bubble mine={false} name={s.brand.name} body={s.chat.greeting} />
            {token && !online && s.chat.offlineMessage && <p className="rounded-lg bg-surface px-3 py-2 text-center text-xs text-muted">{s.chat.offlineMessage}</p>}
            {messages.map((m) => (
              <Bubble key={m.id} mine={m.sender === "visitor"} name={m.sender === "staff" ? m.staff_name || s.brand.name : ""} body={m.body} time={timeOf(m.created_at)} />
            ))}
          </div>

          {error && <p className="bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>}

          {token ? (
            <form onSubmit={send} className="flex items-end gap-2 border-t border-line bg-surface p-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(e as unknown as FormEvent);
                  }
                }}
                rows={1}
                placeholder="Type a message…"
                className={cn(inputCls, "max-h-28 resize-none")}
                aria-label="Message"
              />
              <button type="submit" disabled={busy || !text.trim()} className="btn btn-primary !px-4 !py-2.5">
                Send
              </button>
            </form>
          ) : (
            <form onSubmit={start} className="space-y-2 border-t border-line bg-surface p-3">
              <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input required placeholder="Your name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
                <input placeholder="Phone or email" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className={inputCls} />
              </div>
              <textarea required rows={2} placeholder="How can we help?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={cn(inputCls, "resize-none")} />
              <button type="submit" disabled={busy} className="btn btn-primary w-full">
                {busy ? "Starting…" : "Start chat"}
              </button>
              <p className="text-center text-[0.68rem] text-muted">Add your phone or email so we can reply even if you leave.</p>
            </form>
          )}
          {token && (
            <button onClick={endChat} className="border-t border-line bg-surface py-1.5 text-[0.68rem] text-muted hover:text-ink">
              Start a new conversation
            </button>
          )}
        </div>
      )}
    </>
  );
}

function Bubble({ mine, name, body, time }: { mine: boolean; name?: string; body: string; time?: string }) {
  return (
    <div className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
      {!mine && name && <span className="mb-0.5 px-1 text-[0.68rem] text-muted">{name}</span>}
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
          mine ? "rounded-br-sm bg-primary text-on-primary" : "rounded-bl-sm border border-line bg-surface",
        )}
      >
        {body}
      </div>
      {time && <span className="mt-0.5 px-1 text-[0.62rem] text-muted">{time}</span>}
    </div>
  );
}
