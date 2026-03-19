import Image from "next/image";

export const RankeaoLogo = ({ className = "h-7 w-auto" }: { className?: string }) => {
  return (
    <Image
      src="/rankeao-logo.png"
      alt="Rankeao"
      width={840}
      height={175}
      className={className}
      priority
    />
  );
};
