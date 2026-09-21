import { LoginForm } from "@/features/auth/components/login-form";
import { AuthSplitShell } from "@/features/auth/components/auth-split-shell";

type LoginPageProps = {
  searchParams: Promise<{
    registered?: string;
    error?: string;
    redirect?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <AuthSplitShell>
      <LoginForm
        registered={params.registered === "1"}
        errorCode={typeof params.error === "string" ? params.error : undefined}
        redirectTo={typeof params.redirect === "string" ? params.redirect : undefined}
      />
    </AuthSplitShell>
  );
}
