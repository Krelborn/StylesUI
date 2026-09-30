// Stands in for `react/compiler-runtime` in the design-sync bundle, whose React shim is `window.React`
// and so has no `c` export. Uses React 19's own memo cache when the host React exposes it.
import * as React from "react";

const EMPTY = Symbol.for("react.memo_cache_sentinel");

export function c(size) {
  const runtime = React.__COMPILER_RUNTIME;

  if (runtime && typeof runtime.c === "function") {
    return runtime.c(size);
  }

  // Same fallback as the `react-compiler-runtime` package for React versions without a memo cache
  // The compiler runtime names this hook `c`, and the cache is sized once per call site
  // oxlint-disable-next-line react-hooks/rules-of-hooks
  return React.useMemo(() => {
    const cache = new Array(size).fill(EMPTY);
    cache[EMPTY] = true;
    return cache;
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
