"use client";

import { useEffect, useRef } from "react";
import { consumeMagicAction } from "./actions";

export function AutoSubmitMagic({ token }: { token: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.requestSubmit();
  }, []);

  return (
    <form ref={formRef} action={consumeMagicAction}>
      <input type="hidden" name="token" value={token} />
      <noscript>
        <button
          type="submit"
          className="rounded-full bg-[var(--color-wh-forest)] text-white px-6 py-3 font-semibold"
        >
          Anmeldung abschließen
        </button>
      </noscript>
    </form>
  );
}
