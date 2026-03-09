import type { ReactNode } from "react";
import styles from "./PillButton.module.scss";

type PillButtonVariant = "light" | "brand";

type PillButtonProps = {
  label: string;
  href?: string;
  className?: string;
  icon?: ReactNode;
  variant?: PillButtonVariant;
};

function PillButtonContent({ label, icon }: Pick<PillButtonProps, "label" | "icon">) {
  return (
    <>
      <span className={styles.label}>{label}</span>
      <span className={styles.iconWrap} aria-hidden="true">
        {icon ?? <span className={styles.fallbackIcon}>↗</span>}
      </span>
    </>
  );
}

export default function PillButton({ label, href, className, icon, variant = "light" }: PillButtonProps) {
  const rootClassName = [styles.button, styles[variant], className].filter(Boolean).join(" ");

  if (href) {
    return (
      <a className={rootClassName} href={href}>
        <PillButtonContent label={label} icon={icon} />
      </a>
    );
  }

  return (
    <button className={rootClassName} type="button">
      <PillButtonContent label={label} icon={icon} />
    </button>
  );
}
