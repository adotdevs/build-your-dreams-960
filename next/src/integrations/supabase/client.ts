export type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export type AuthSession = {
  user: AuthUser;
};

type AuthListener = (event: string, session: AuthSession | null) => void;

const listeners = new Set<AuthListener>();

function notify(event: string, session: AuthSession | null) {
  listeners.forEach((listener) => listener(event, session));
}

async function postJson(url: string, body?: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return response.json();
}

class QueryBuilder {
  private op: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private columns = "*";
  private count: string | null = null;
  private head = false;
  private filters: { field: string; op: string; value: unknown }[] = [];
  private orders: { field: string; ascending?: boolean }[] = [];
  private limitN: number | null = null;
  private mode: "single" | "maybe" | null = null;
  private payload: unknown = null;
  private onConflict: string | null = null;
  private returning = false;

  constructor(private table: string) {}

  select(columns = "*", options?: { count?: string; head?: boolean }) {
    this.columns = columns;
    this.count = options?.count || null;
    this.head = Boolean(options?.head);
    this.returning = true;
    return this;
  }

  eq(field: string, value: unknown) {
    this.filters.push({ field, op: "eq", value });
    return this;
  }

  neq(field: string, value: unknown) {
    this.filters.push({ field, op: "neq", value });
    return this;
  }

  in(field: string, value: unknown[]) {
    this.filters.push({ field, op: "in", value });
    return this;
  }

  gt(field: string, value: unknown) {
    this.filters.push({ field, op: "gt", value });
    return this;
  }

  gte(field: string, value: unknown) {
    this.filters.push({ field, op: "gte", value });
    return this;
  }

  lt(field: string, value: unknown) {
    this.filters.push({ field, op: "lt", value });
    return this;
  }

  lte(field: string, value: unknown) {
    this.filters.push({ field, op: "lte", value });
    return this;
  }

  is(field: string, value: unknown) {
    this.filters.push({ field, op: "is", value });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orders.push({ field, ascending: options?.ascending });
    return this;
  }

  limit(count: number) {
    this.limitN = count;
    return this;
  }

  maybeSingle() {
    this.mode = "maybe";
    return this;
  }

  single() {
    this.mode = "single";
    return this;
  }

  insert(payload: unknown) {
    this.op = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: unknown) {
    this.op = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.op = "delete";
    return this;
  }

  upsert(payload: unknown, options?: { onConflict?: string }) {
    this.op = "upsert";
    this.payload = payload;
    this.onConflict = options?.onConflict || null;
    return this;
  }

  then<TResult1 = { data: any; error: { message: string } | null; count: number | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: { message: string } | null; count: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute() {
    try {
      return await postJson("/api/db", {
        table: this.table,
        op: this.op,
        columns: this.columns,
        count: this.count,
        head: this.head,
        filters: this.filters,
        order: this.orders,
        limit: this.limitN,
        mode: this.mode,
        payload: this.payload,
        onConflict: this.onConflict,
        returning: this.returning,
      });
    } catch (error) {
      return { data: null, error: { message: error instanceof Error ? error.message : "Request failed" }, count: null };
    }
  }
}

class RpcQuery {
  private mode: "single" | "maybe" | null = null;

  constructor(private name: string, private args: Record<string, unknown>) {}

  maybeSingle() {
    this.mode = "maybe";
    return this;
  }

  single() {
    this.mode = "single";
    return this;
  }

  then<TResult1 = { data: any; error: { message: string } | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute() {
    try {
      const result = await postJson("/api/rpc", { name: this.name, args: this.args });
      if (result.error) return result;
      if ((this.mode === "maybe" || this.mode === "single") && Array.isArray(result.data)) {
        if (this.mode === "single" && result.data.length !== 1) {
          return { data: null, error: { message: "JSON object requested, multiple (or no) rows returned" } };
        }
        if (this.mode === "maybe" && result.data.length > 1) {
          return { data: null, error: { message: "JSON object requested, multiple (or no) rows returned" } };
        }
        return { data: result.data[0] ?? null, error: null };
      }
      return result;
    } catch (error) {
      return { data: null, error: { message: error instanceof Error ? error.message : "Request failed" } };
    }
  }
}

class StorageBucket {
  constructor(private bucket: string) {}

  async upload(path: string, file: Blob, options?: { upsert?: boolean }) {
    const body = new FormData();
    body.set("bucket", this.bucket);
    body.set("path", path);
    body.set("upsert", options?.upsert ? "1" : "0");
    body.set("file", file);
    const response = await fetch("/api/storage/upload", { method: "POST", body, credentials: "include" });
    return response.json();
  }

  async createSignedUrl(path: string, expiresIn: number) {
    return postJson("/api/storage/sign", { bucket: this.bucket, path, expiresIn });
  }

  async remove(paths: string[]) {
    return postJson("/api/storage/remove", { bucket: this.bucket, paths });
  }
}

type LiveListener = {
  filter: { event?: string; schema?: string; table?: string; filter?: string };
  cb: (payload: { new: unknown; old: unknown; eventType: string }) => void;
};

class Channel {
  listeners: LiveListener[] = [];

  on(_event: string, filter: LiveListener["filter"], cb: LiveListener["cb"]) {
    this.listeners.push({ filter, cb });
    return this;
  }

  subscribe() {
    liveChannels.add(this);
    ensureLivePoll();
    return this;
  }

  stop() {
    liveChannels.delete(this);
    if (liveChannels.size === 0 && liveTimer) {
      clearInterval(liveTimer);
      liveTimer = null;
    }
  }
}

const liveChannels = new Set<Channel>();
let liveTimer: ReturnType<typeof setInterval> | null = null;
let liveSince = 0;
let livePollInFlight = false;

function ensureLivePoll() {
  if (liveTimer) return;
  liveTimer = setInterval(() => {
    void pollLive();
  }, 2000);
}

async function pollLive() {
  if (livePollInFlight || liveChannels.size === 0) return;
  livePollInFlight = true;
  try {
    const response = await fetch(`/api/realtime?since=${liveSince}`, { credentials: "include" });
    const json = await response.json();
    for (const event of json.events || []) {
      if (event.seq > liveSince) liveSince = event.seq;
      for (const channel of liveChannels) {
        for (const listener of channel.listeners) {
          if (listener.filter.table && listener.filter.table !== event.table) continue;
          if (listener.filter.event && listener.filter.event !== "*" && listener.filter.event !== event.type) continue;
          if (listener.filter.filter && !matches(listener.filter.filter, event.new || {})) continue;
          listener.cb({ new: event.new, old: event.old, eventType: event.type });
        }
      }
    }
  } catch {
    // The next poll retries.
  } finally {
    livePollInFlight = false;
  }
}

function matches(filter: string, doc: Record<string, unknown>) {
  const match = filter.match(/^(\w+)=eq\.(.+)$/);
  if (!match) return true;
  return String(doc[match[1]] ?? "") === match[2];
}

async function recoverFromUrl() {
  if (typeof window === "undefined") return;
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const token = search.get("token") || hash.get("token");
  const type = search.get("type") || hash.get("type");
  if (!token || type !== "recovery") return;
  await postJson("/api/auth/recover", { token });
}

export const supabase = {
  from(table: string) {
    return new QueryBuilder(table);
  },
  rpc(name: string, args: Record<string, unknown> = {}) {
    return new RpcQuery(name, args);
  },
  storage: {
    from(bucket: string) {
      return new StorageBucket(bucket);
    },
  },
  channel(_name: string) {
    return new Channel();
  },
  removeChannel(channel: Channel) {
    channel.stop();
  },
  auth: {
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const result = await postJson("/api/auth/signin", { email, password });
      if (!result.error && result.data?.session) notify("SIGNED_IN", result.data.session);
      return result;
    },
    async signUp({ email, password, options }: { email: string; password: string; options?: { emailRedirectTo?: string; data?: Record<string, unknown> } }) {
      const result = await postJson("/api/auth/signup", { email, password, metadata: options?.data });
      if (!result.error && result.data?.session) notify("SIGNED_IN", result.data.session);
      return result;
    },
    async signOut() {
      const result = await postJson("/api/auth/signout");
      notify("SIGNED_OUT", null);
      return result;
    },
    async getSession() {
      await recoverFromUrl();
      const response = await fetch("/api/auth/session", { credentials: "include" });
      return response.json();
    },
    async updateUser({ password }: { password: string }) {
      return postJson("/api/auth/update", { password });
    },
    async resetPasswordForEmail(email: string, _options?: { redirectTo?: string }) {
      return postJson("/api/auth/reset-request", { email, redirectTo: _options?.redirectTo });
    },
    onAuthStateChange(callback: AuthListener) {
      listeners.add(callback);
      return { data: { subscription: { unsubscribe: () => { listeners.delete(callback); } } } };
    },
  },
};
