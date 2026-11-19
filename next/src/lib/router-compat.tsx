"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import NextLink from "next/link";
import { useParams as useNextParams, usePathname, useRouter, useSearchParams as useNextSearchParams } from "next/navigation";

type AnchorProps = Omit<ComponentPropsWithoutRef<"a">, "href">;

export interface LinkProps extends AnchorProps {
  to: string;
  replace?: boolean;
  state?: unknown;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ to, replace, state: _state, ...props }, ref) {
  return <NextLink ref={ref} href={to} replace={replace} {...props} />;
});

export interface NavigateOptions {
  replace?: boolean;
  state?: unknown;
}

export function useNavigate() {
  const router = useRouter();
  return (to: string | number, options?: NavigateOptions) => {
    if (typeof to === "number") {
      if (typeof window !== "undefined") window.history.go(to);
      return;
    }
    if (options?.replace) router.replace(to);
    else router.push(to);
  };
}

export function useLocation() {
  const pathname = usePathname() || "/";
  const searchParams = useNextSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";
  return {
    pathname,
    search,
    hash: typeof window === "undefined" ? "" : window.location.hash,
    state: null,
  };
}

export function useParams<T extends Record<string, string | undefined>>(): T {
  return (useNextParams() || {}) as T;
}

export function useSearchParams(): [URLSearchParams, (next: URLSearchParams) => void] {
  const pathname = usePathname() || "/";
  const current = useNextSearchParams();
  const router = useRouter();
  const params = new URLSearchParams(current?.toString() || "");
  const setParams = (next: URLSearchParams) => {
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };
  return [params, setParams];
}
