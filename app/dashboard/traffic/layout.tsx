import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Traffic — Promptwatch",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
