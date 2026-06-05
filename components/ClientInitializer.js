"use client";

import { useEffect, useRef } from "react";
import { useUserStore } from "@/store/useUserStore";

export default function ClientInitializer({ user }) {
  const setUser = useUserStore((state) => state.setUser);
  const previousUserRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    // Stringify comparison check intercepts redundant execution loops 
    // and layout flickering if layout renders trigger repeatedly
    const userString = JSON.stringify(user);
    if (previousUserRef.current !== userString) {
      setUser(user);
      previousUserRef.current = userString;
    }
  }, [user, setUser]);

  return null; 
}