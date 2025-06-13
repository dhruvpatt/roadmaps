import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ErrorPage from "@/components/ErrorPage";

export default function ErrorRoute() {
  const router = useRouter();
  const { code, title, message, details } = router.query;

  const [ready, setReady] = useState(false);

  // Wait for query params to load
  useEffect(() => {
    if (code && title && message) {
      setReady(true);
    }
  }, [code, title, message]);

  if (!ready) return null;

  return (
    <ErrorPage
      code={code}
      title={title}
      message={message}
      details={details}
    />
  );
}
