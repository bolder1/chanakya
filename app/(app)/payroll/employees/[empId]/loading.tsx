import { Topbar } from "@/components/chrome/Topbar";
import { PageSkeleton } from "@/components/chrome/Skeleton";

export default function EmployeeLoading() {
  return (
    <>
      <Topbar pageTitle="Employee" />
      <PageSkeleton rows={4} showKpis />
    </>
  );
}
