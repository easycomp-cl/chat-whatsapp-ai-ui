import {
  Bot,
  CircleStop,
  Clock,
  GitBranch,
  Hand,
  ListChecks,
  MessageSquare,
  Play,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { FlowNodeType } from "@/lib/flows/graph-types";

export const FLOW_NODE_ICONS: Record<FlowNodeType, LucideIcon> = {
  start: Play,
  message: MessageSquare,
  collect_fields: ListChecks,
  choice: GitBranch,
  condition: Zap,
  review: ShieldCheck,
  action: Sparkles,
  handoff: Hand,
  confirmation: Bot,
  emit_event: Send,
  end: CircleStop,
  wait: Clock,
};

export function getFlowNodeIcon(type: FlowNodeType): LucideIcon {
  return FLOW_NODE_ICONS[type] ?? MessageSquare;
}
