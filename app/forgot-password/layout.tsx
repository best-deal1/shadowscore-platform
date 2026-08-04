import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Password recovery | ShadowScore",
  description: "Request secure password recovery instructions for a ShadowScore account.",
  robots: { index: false, follow: true },
};

export default function ForgotPasswordLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
