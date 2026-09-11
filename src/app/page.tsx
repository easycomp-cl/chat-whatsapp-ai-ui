import { LandingPage } from "@/components/landing/LandingPage";
import { buildLandingJsonLd, buildLandingMetadata } from "@/lib/landing/metadata";

export const metadata = buildLandingMetadata();

export default function HomePage() {
  const jsonLd = buildLandingJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
