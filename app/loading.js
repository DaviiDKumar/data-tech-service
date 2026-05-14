import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.container}>
      {/* Elegant Branding */}
      <div className={styles.brand}>
        DataTech<span className="font-light opacity-60">Services</span>
      </div>

      <div className={styles.contentBox}>
        {/* Subtle Message */}
        <p className={styles.subtitle}>
          Initializing Workspace
        </p>

        {/* Minimalist Progress */}
        <div className={styles.progressTrack}>
          <div className={styles.progressBar}></div>
        </div>

        {/* Professional Status Ticker */}
        <div className={styles.statusWrapper}>
          <div className={styles.statusList}>
            <div className={styles.statusItem}>Verifying Identity</div>
            <div className={styles.statusItem}>Preparing Admin Panel</div>
            <div className={styles.statusItem}>Fetching Real-time Data</div>
            <div className={styles.statusItem}>Finalizing Environment</div>
          </div>
        </div>
      </div>
      
      {/* Optional: Simple subtle watermark at the bottom */}
      <div className="absolute bottom-10 text-[10px] uppercase tracking-[0.3em] text-violet-300 font-bold">
        Growthforge DTS
      </div>
    </div>
  );
}