import { Topbar } from "@/components/chrome/Topbar";
import { PageSkeleton } from "@/components/chrome/Skeleton";

export default function VendorsLoading() {
  return (
    <>
      <Topbar pageTitle="Vendors" />
      <PageSkeleton rows={10} />
    </>
  );
}
