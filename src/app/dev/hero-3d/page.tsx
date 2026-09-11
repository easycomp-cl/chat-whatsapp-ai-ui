import { notFound } from "next/navigation";
import { Hero3DDevPlayground } from "./playground";

export default function Hero3DDevPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <Hero3DDevPlayground />;
}
