import type { Metadata } from "next";
import { OverviewClient } from "./components/OverviewClient";

export const metadata: Metadata = {
  title: "Overview — Promptwatch",
};

export default function OverviewPage() {
  return <OverviewClient />;
}
