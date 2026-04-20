"use client";
import { useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";

export default function ClientInitializer({ user }) {
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [user, setUser]);

  return null; // Ye UI mein kuch nahi dikhayega
}