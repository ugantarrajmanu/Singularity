import { Experience } from "@/components/Experience";
import { StaticSite } from "@/components/layout/StaticSite";

export default function Home() {
  return (
    <>
      <noscript>
        <style>{`.fallback-pending{position:static!important;opacity:1!important;pointer-events:auto!important}`}</style>
      </noscript>
      <Experience fallback={<StaticSite />} />
    </>
  );
}
