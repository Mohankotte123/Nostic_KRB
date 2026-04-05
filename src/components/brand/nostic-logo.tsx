import Image from "next/image";
import { cn } from "@/lib/utils";

const sizeClass = {
  sm: "h-7 w-auto max-w-[132px]",
  md: "h-9 w-auto max-w-[168px]",
  lg: "h-11 w-auto max-w-[220px]",
} as const;

type Props = {
  size?: keyof typeof sizeClass;
  className?: string;
  priority?: boolean;
};

/** Colorful NOSTIC wordmark — use on dark backgrounds (transparent PNG). */
export function NosticLogo({ size = "md", className, priority }: Props) {
  return (
    <Image
      src="/nostic-wordmark.png"
      alt="NOSTIC"
      width={320}
      height={96}
      sizes="(max-width: 768px) 160px, 220px"
      priority={priority}
      className={cn(
        sizeClass[size],
        "object-contain object-left brightness-[1.06]",
        "drop-shadow-[0_2px_14px_rgba(0,0,0,0.55)]",
        className,
      )}
    />
  );
}
