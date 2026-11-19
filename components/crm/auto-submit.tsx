"use client";

import type { ComponentProps } from "react";

/**
 * A <select> that submits its form as soon as the value changes (keyboard friendly: arrow keys
 * change the value on most platforms, so we only submit on real change events).
 * Pair with a <noscript> submit button for no-JS fallback.
 */
export function AutoSubmitSelect(props: ComponentProps<"select">) {
  return (
    <select
      {...props}
      onChange={(e) => {
        props.onChange?.(e);
        e.currentTarget.form?.requestSubmit();
      }}
    />
  );
}
