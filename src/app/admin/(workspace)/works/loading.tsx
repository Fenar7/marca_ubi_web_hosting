import styles from './works.module.scss';

/** Preserve the heading and portfolio footprint while the authenticated project query resolves. */
export default function LoadingClientWorks() {
  return (
    <div className={styles.worksWorkspace} role="status" aria-busy="true">
      <div>
        <h1 className={styles.heading}>Client works</h1>
        <p className={styles.subheading}>Loading projects…</p>
      </div>
      <div className={styles.skeleton} aria-hidden="true">
        <div />
        <div />
      </div>
    </div>
  );
}
