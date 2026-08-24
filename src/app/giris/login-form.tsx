"use client";

import { useActionState } from "react";
import { ArrowRight, KeyRound } from "lucide-react";
import { loginCustomer, type LoginState } from "./actions";
import { Button, Input, Label } from "@/components/ui";

const initial: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginCustomer, initial);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="customerNo">Müşteri Numarası</Label>
        <Input
          id="customerNo"
          name="customerNo"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          placeholder="Örn. 48217390"
          className="h-12 text-center text-lg tracking-widest"
        />
      </div>

      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          "Kontrol ediliyor…"
        ) : (
          <>
            Giriş Yap <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <KeyRound className="h-3.5 w-3.5" />
        Müşteri numaranızı firmadan aldınız. Bulamıyorsanız bizimle iletişime geçin.
      </p>
    </form>
  );
}
