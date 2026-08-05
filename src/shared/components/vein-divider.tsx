import { cn } from "@/shared/utils";

type VeinDividerProps = {
  className?: string;
  variant?: "path" | "rule";
};

/** Signature contour / vein motif used as section dividers. */
export function VeinDivider({
  className,
  variant = "path",
}: VeinDividerProps) {
  if (variant === "rule") {
    return <div className={cn("vein-rule", className)} aria-hidden />;
  }

  return (
    <svg
      className={cn("vein-line", className)}
      viewBox="0 0 400 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      preserveAspectRatio="none"
    >
      <path
        d="M0 7.5 C40 7.5 55 3 90 3 C130 3 145 9 185 9 C230 9 250 2.5 295 2.5 C340 2.5 360 8 400 8"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M0 7.5 C40 7.5 55 3 90 3 C130 3 145 9 185 9 C230 9 250 2.5 295 2.5 C340 2.5 360 8 400 8"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeOpacity="0.35"
        strokeLinecap="round"
        transform="translate(0 2)"
      />
    </svg>
  );
}
