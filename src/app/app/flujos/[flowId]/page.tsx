import { redirect } from "next/navigation";

export default async function FlujosFlowRedirectPage({
  params,
}: {
  params: Promise<{ flowId: string }>;
}) {
  const { flowId } = await params;
  redirect(`/app/flows/${flowId}`);
}
