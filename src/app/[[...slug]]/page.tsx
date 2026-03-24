"use client";

import { Suspense } from "react";
import Index from "@/views/Index";

/**
 * O singură intrare client — păstrează starea la navigare între /login, /dashboard/…, /restosoft etc.
 * Path-urile reale sunt definite în `src/lib/appRoutes.ts`.
 */
export default function AppCatchAllPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background">Se încarcă…</div>}>
      <Index />
    </Suspense>
  );
}
