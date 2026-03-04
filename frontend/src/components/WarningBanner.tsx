interface WarningBannerProps {
  warnings: string[];
}

export function WarningBanner({ warnings }: WarningBannerProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="bg-red-50 dark:bg-axiom-error/[0.06] border border-red-200 dark:border-axiom-error/15 border-l-4 border-l-axiom-error rounded-r-lg p-3 mb-4">
      {warnings.map((w, i) => (
        <p key={i} className="text-sm text-axiom-error">
          &#9888; {w}
        </p>
      ))}
    </div>
  );
}
