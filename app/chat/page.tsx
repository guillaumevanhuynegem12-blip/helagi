// The AI page, now at /chat. This thin server wrapper only resolves the
// visitor's identity (account session or guest cookie) and hands it to the
// unchanged chat UI in components/ChatApp.tsx. No identity at all → back to
// the landing page to pick "log in / create account / continue as guest".

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getIdentity } from "@/lib/auth";
import ChatApp from "@/components/ChatApp";

export const metadata: Metadata = {
  title: "Chat — Helagi",
};

export default async function ChatPage() {
  const identity = await getIdentity();
  if (!identity) redirect("/");

  return (
    <ChatApp
      identity={
        identity.type === "user"
          ? { type: "user", email: identity.email }
          : { type: "guest" }
      }
    />
  );
}
