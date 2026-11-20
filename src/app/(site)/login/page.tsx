import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-16 md:py-24">
      <h1 className="text-3xl font-semibold tracking-tight text-primary md:text-4xl">
        Welcome to CarisGold
      </h1>
      <p className="mb-8 mt-3 text-center text-muted-foreground">
        Log in to view your orders, or create an account.
      </p>
      <AuthForm />
    </div>
  );
}
