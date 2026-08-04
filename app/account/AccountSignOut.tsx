"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logoutUser } from "@/lib/auth";

export function AccountSignOut() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await logoutUser();
    router.replace("/login");
    router.refresh();
  }

  return <button type="button" className="account-sign-out" disabled={signingOut} onClick={() => void signOut()}>{signingOut ? "Signing out" : "Sign out"}</button>;
}
