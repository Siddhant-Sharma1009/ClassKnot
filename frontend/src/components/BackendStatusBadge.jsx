import { useEffect, useState } from "react";
import api from "../api/axios";

export default function BackendStatusBadge() {
  const [state, setState] = useState({
    ok: false,
    version: "",
    loading: true
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [healthRes, versionRes] = await Promise.all([
          api.get("/health"),
          api.get("/version")
        ]);

        if (!mounted) return;
        setState({
          ok: Boolean(healthRes.data?.ok),
          version: versionRes.data?.version || "",
          loading: false
        });
      } catch {
        if (!mounted) return;
        setState({
          ok: false,
          version: "",
          loading: false
        });
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (state.loading) {
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-slate-200 text-slate-700">
        Backend: checking
      </span>
    );
  }

  return (
    <span
      className={`text-xs px-2 py-1 rounded-full ${
        state.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
      title={state.version ? `Version ${state.version}` : "Backend status"}
    >
      {state.ok ? `Backend online${state.version ? ` v${state.version}` : ""}` : "Backend offline"}
    </span>
  );
}
