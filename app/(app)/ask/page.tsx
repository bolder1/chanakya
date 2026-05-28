import { Suspense } from "react";
import { Topbar } from "@/components/chrome/Topbar";
import { AskComposer } from "@/components/chat/AskComposer";

export default function AskPage() {
  return (
    <>
      <Topbar pageTitle="Ask Chanakya" />
      <Suspense fallback={<div className="flex-1" />}>
        <AskComposer />
      </Suspense>
    </>
  );
}
