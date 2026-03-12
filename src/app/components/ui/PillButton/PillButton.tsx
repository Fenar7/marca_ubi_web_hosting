import type { MouseEventHandler, ReactNode } from "react";
import styles from "./PillButton.module.scss";

type PillButtonVariant = "light" | "brand";

type PillButtonProps = {
  label: string;
  href?: string;
  className?: string;
  icon?: ReactNode;
  variant?: PillButtonVariant;
  onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
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

export default function PillButton({
  label,
  href,
  className,
  icon,
  variant = "light",
  onClick,
  type = "button",
  disabled = false,
}: PillButtonProps) {
  const rootClassName = [styles.button, styles[variant], className].filter(Boolean).join(" ");

  if (href) {
    return (
      <a
        aria-disabled={disabled || undefined}
        className={rootClassName}
        href={disabled ? undefined : href}
        onClick={onClick}
      >
        <PillButtonContent label={label} icon={icon} />
      </a>
    );
  }

  return (
    <button className={rootClassName} disabled={disabled} onClick={onClick} type={type}>
      <PillButtonContent label={label} icon={icon} />
    </button>
  );
}
