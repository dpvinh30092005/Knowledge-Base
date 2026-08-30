import { useEffect, useRef, useState } from "react";
import type { DashboardLoadStatus } from "../types";

export function useMentorDashboardData<T>(loader: () => Promise<T>) {
  const loaderRef = useRef(loader);
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<DashboardLoadStatus>("loading");

  useEffect(() => {
    let active = true;

    loaderRef.current()
      .then((response) => {
        if (!active) return;
        setData(response);
        setStatus("success");
      })
      .catch((error) => {
        if (!active) return;
        console.error("[Mentor Dashboard] Widget request failed:", error);
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, []);

  return { data, status };
}
