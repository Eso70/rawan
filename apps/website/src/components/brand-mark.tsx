import Image from "next/image";

/** The supplied brand artwork is decorative beside the accessible Rawan name. */
export function BrandMark({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/logo.svg"
      alt=""
      width={28}
      height={28}
      className={className}
      priority={priority}
      unoptimized
    />
  );
}
