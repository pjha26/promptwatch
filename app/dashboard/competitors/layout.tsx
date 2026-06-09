import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Competitors — Promptwatch",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
