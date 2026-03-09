import type { ReactNode } from "react";
import styles from "./SectionTitleBlock.module.scss";

type SectionTitleBlockProps = {
  label: ReactNode;
  title: ReactNode;
  tagIcon?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  leftColumnClassName?: string;
  tagClassName?: string;
  tagTextClassName?: string;
  titleClassName?: string;
  rightColumnClassName?: string;
  descriptionClassName?: string;
  actionWrapClassName?: string;
};

export default function SectionTitleBlock({
  label,
  title,
  tagIcon,
  description,
  action,
  className,
  leftColumnClassName,
  tagClassName,
  tagTextClassName,
  titleClassName,
  rightColumnClassName,
  descriptionClassName,
  actionWrapClassName,
}: SectionTitleBlockProps) {
  const rootClassName = [styles.sectionTitleBlock, className].filter(Boolean).join(" ");
  const leftClassName = [styles.leftColumn, leftColumnClassName].filter(Boolean).join(" ");
  const tagRootClassName = [styles.tag, tagClassName].filter(Boolean).join(" ");
  const tagTextRootClassName = [styles.tagText, tagTextClassName].filter(Boolean).join(" ");
  const titleRootClassName = [styles.title, titleClassName].filter(Boolean).join(" ");
  const rightClassName = [styles.rightColumn, rightColumnClassName].filter(Boolean).join(" ");
  const descriptionRootClassName = [styles.description, descriptionClassName].filter(Boolean).join(" ");
  const actionRootClassName = [styles.actionWrap, actionWrapClassName].filter(Boolean).join(" ");

  return (
    <div className={rootClassName}>
      <div className={leftClassName}>
        <div className={tagRootClassName}>
          {tagIcon ?? (
            <span className={styles.tagAsterisk} aria-hidden="true">
              *
            </span>
          )}
          <p className={tagTextRootClassName}>{label}</p>
        </div>
        <h2 className={titleRootClassName}>{title}</h2>
      </div>

      {(description || action) && (
        <div className={rightClassName}>
          {description ? <p className={descriptionRootClassName}>{description}</p> : null}
          {action ? <div className={actionRootClassName}>{action}</div> : null}
        </div>
      )}
    </div>
  );
}
