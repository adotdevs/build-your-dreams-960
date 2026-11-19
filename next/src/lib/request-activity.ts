type Listener = (pending: number) => void;

let pending = 0;
const listeners = new Set<Listener>();
let installed = false;

function notify() {
  listeners.forEach((listener) => listener(pending));
}

export function subscribeRequests(listener: Listener) {
  listeners.add(listener);
  listener(pending);
  return () => listeners.delete(listener);
}

function requestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function isBackground(url: string) {
  return (
    url.includes("/api/realtime") ||
    url.includes("/api/crypto-prices") ||
    url.includes("/_next/webpack") ||
    url.includes("/_next/static") ||
    url.includes("__nextjs")
  );
}

export function installRequestTracker() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const original = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestUrl(input);
    const track = !isBackground(url);
    if (track) {
      pending += 1;
      notify();
    }
    try {
      return await original(input, init);
    } finally {
      if (track) {
        pending = Math.max(0, pending - 1);
        notify();
      }
    }
  };
}
