import type { Metadata } from "next";
import { TrackingHealthPanel } from "./TrackingHealthPanel";

export const metadata: Metadata = { title: "Tracking Health — Promptwatch" };

export default function HealthPage() {
  return <TrackingHealthPanel />;
}
