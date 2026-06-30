"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ActivityChartProps = {
  data: Array<{
    date: string;
    messages: number;
    ai_responses: number;
    handoffs: number;
  }>;
};

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Actividad por día</CardTitle>
      </CardHeader>
      <CardContent className="min-h-[320px]">
        <div className="h-72 min-w-0 w-full">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="messages" name="Mensajes" fill="#3b82f6" />
              <Bar dataKey="ai_responses" name="Respuestas IA" fill="#10b981" />
              <Bar dataKey="handoffs" name="Derivaciones" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Sin actividad registrada este mes
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
