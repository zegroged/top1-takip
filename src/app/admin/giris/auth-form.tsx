"use client";

import { useActionState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { loginAdmin, setupAdmin, type AdminAuthState } from "../actions";
import { Button, Input, Label } from "@/components/ui";

export function AdminAuthForm({ mode }: { mode: "login" | "setup" }) {
  const action = mode === "setup" ? setupAdmin : loginAdmin;
  const [state, formAction, pending] = useActionState(
    action,
    {} as AdminAuthState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="username">Kullanıcı Adı</Label>
        <Input id="username" name="username" autoComplete="username" autoFocus />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Şifre</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "setup" ? "new-password" : "current-password"}
        />
      </div>

      {state?.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {mode === "setup" ? (
          <>
            <UserPlus className="h-4 w-4" />
            {pending ? "Oluşturuluyor…" : "Admin Hesabı Oluştur"}
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            {pending ? "Giriş yapılıyor…" : "Giriş Yap"}
          </>
        )}
      </Button>
    </form>
  );
}
