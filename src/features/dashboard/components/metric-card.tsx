import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MetricCardProps = {
  title: string;
  value: string | number;
  description?: string;
  accent?: "blue" | "green" | "yellow" | "red";
};

const accentClasses = {
  blue: "text-blue-600",
  green: "text-emerald-600",
  yellow: "text-amber-600",
  red: "text-red-600",
};

export function MetricCard({ title, value, description, accent = "blue" }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${accentClasses[accent]}`}>{value}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
