import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect("/auth/signin");
  }
  return session;
}

export async function redirectIfAuthenticated(redirectTo: string = "/decks") {
  const session = await getSession();
  if (session) {
    redirect(redirectTo);
  }
  return session;
}