import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.container}>
      {/* Top Left Brand */}
      <div className={styles.brand}>
        DataTech Services
      </div>

      <div className="flex flex-col items-center">
        {/* Compiling Message */}
        <p className={styles.subtitle}>
          Please wait while compiling resources
        </p>

        {/* Centered Progress Bar */}
        <div className={styles.progressTrack}>
          <div className={styles.progressBar}></div>
        </div>

        {/* Status Indicators */}
        <div className={styles.statusWrapper}>
          <div className={styles.statusList}>
            <div className={styles.statusItem}>Welcome back</div>
            <div className={styles.statusItem}>Setting up Workspace</div>
            <div className={styles.statusItem}>Syncing Data</div>
            <div className={styles.statusItem}>Redirecting</div>
          </div>
        </div>
      </div>
    </div>
  );
}