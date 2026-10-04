type IconName = "arrow" | "book" | "world" | "connect" | "spark";

const paths: Record<IconName, React.ReactNode> = {
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  book: (
    <>
      <path d="M12 5v15M3 4.5c3.5-.6 6.5.3 9 2.2 2.5-1.9 5.5-2.8 9-2.2v14c-3.5-.6-6.5.3-9 2.2-2.5-1.9-5.5-2.8-9-2.2z" />
    </>
  ),
  world: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <ellipse cx="12" cy="12" rx="4" ry="8.5" />
      <path d="M4 9h16M4 15h16" />
    </>
  ),
  connect: (
    <>
      <circle cx="6" cy="7" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="13" cy="18" r="2.5" />
      <path d="m8.5 6.8 7-.6M7.5 9l4 6.5M17 8.5l-3 7" />
    </>
  ),
  spark: <path d="m12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z" />,
};

export function Icon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
