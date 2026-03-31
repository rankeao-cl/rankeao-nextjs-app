import RankeaoSpinner from "@/components/ui/RankeaoSpinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
      <RankeaoSpinner className="h-12 w-auto" />
    </div>
  );
}
