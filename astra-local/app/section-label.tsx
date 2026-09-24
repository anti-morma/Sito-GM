/** Section kicker shared by every chapter of the site: "GM · Name". */
export default function SectionLabel({ children, className, ...rest }: React.ComponentProps<'p'>) {
  return (
    <p className={className ? `gm-label ${className}` : 'gm-label'} {...rest}>
      <span className="gm-label-mark">GM</span>
      <span className="gm-label-dot" aria-hidden="true" />
      <span className="gm-sr-only"> · </span>
      {children}
    </p>
  );
}
