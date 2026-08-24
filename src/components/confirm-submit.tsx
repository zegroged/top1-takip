"use client";

import { Button } from "@/components/ui";

type Props = React.ComponentProps<typeof Button> & { message?: string };

// Form içinde type="submit" olarak kullanılır; onaylanmazsa gönderimi iptal eder.
export function ConfirmSubmit({
  message = "Emin misiniz?",
  children,
  ...props
}: Props) {
  return (
    <Button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
