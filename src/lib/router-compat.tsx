/**
 * Thin compatibility layer over TanStack Router so pages can keep using a
 * familiar `Link` / `useNavigate` / `useLocation` / `useParams` API.
 */
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import {
  Link as TanStackLink,
  useNavigate as useTanStackNavigate,
  useLocation as useTanStackLocation,
  useParams as useTanStackParams,
} from "@tanstack/react-router";

type AnchorProps = Omit<ComponentPropsWithoutRef<"a">, "href">;

export interface LinkProps extends AnchorProps {
  to: string;
  replace?: boolean;
  state?: unknown;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, state: _state, ...props }, ref) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Any = TanStackLink as any;
    return <Any ref={ref} to={to} {...props} />;
  },
);
Link.displayName = "Link";

export interface NavigateOptions {
  replace?: boolean;
  state?: unknown;
}

export function useNavigate() {
  const navigate = useTanStackNavigate();
  return (to: string | number, options?: NavigateOptions) => {
    if (typeof to === "number") {
      if (typeof window !== "undefined") window.history.go(to);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigate({ to, replace: options?.replace } as any);
  };
}

export function useLocation() {
  const location = useTanStackLocation();
  return {
    pathname: location.pathname,
    search: location.searchStr ?? "",
    hash: location.hash ?? "",
    state: location.state,
  };
}

export function useParams<T extends Record<string, string | undefined>>(): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (useTanStackParams as any)({ strict: false }) as T;
}

export function useSearchParams(): [URLSearchParams, (next: URLSearchParams) => void] {
  const location = useTanStackLocation();
  const navigate = useTanStackNavigate();
  const params = new URLSearchParams(location.searchStr ?? "");
  const setParams = (next: URLSearchParams) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigate({ to: location.pathname, search: Object.fromEntries(next) } as any);
  };
  return [params, setParams];
}
