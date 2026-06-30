import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TopQuestion } from "@/types/database.types";

export function TopQuestionsTable({ questions }: { questions: TopQuestion[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preguntas frecuentes detectadas</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pregunta</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Última consulta</TableHead>
              <TableHead>Respondida por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Sin datos aún
                </TableCell>
              </TableRow>
            ) : (
              questions.map((q, i) => (
                <TableRow key={`${q.question}-${i}`}>
                  <TableCell className="max-w-xs truncate">{q.question}</TableCell>
                  <TableCell>{q.count}</TableCell>
                  <TableCell>
                    {q.last_asked_at
                      ? new Date(q.last_asked_at).toLocaleDateString("es-CL")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{q.answered_by ?? "IA"}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
