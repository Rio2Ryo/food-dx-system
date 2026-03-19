"use server";

import { signOut } from "next-auth/react";

/**
 * Server action to sign out the current user
 */
export async function handleSignOut() {
  await signOut({ redirect: false });
}
