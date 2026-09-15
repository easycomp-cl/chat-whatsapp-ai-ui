import { redirect } from "next/navigation";

export default async function ImportarChatJobRedirectPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  redirect(`/app/import-chat/${jobId}`);
}
