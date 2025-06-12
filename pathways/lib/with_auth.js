// lib/withAuth.js
import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/useAuth";

const withAuth = (WrappedComponent) => {
  return function AuthWrapper(props) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    if (isLoading) return null;
    if (!user) {
      router.push("/login");
      return null;
    }

    return <WrappedComponent {...props} user={user} />;
  };
};

export default withAuth;
