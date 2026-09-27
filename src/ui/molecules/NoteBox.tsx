import styles from './NoteBox.module.css';

export function NoteBox({ value, onChange }: { value: string; onChange(text: string): void }) {
  return (
    <div className={styles.root}>
      <span className={styles.icon} aria-hidden="true">
        !
      </span>
      <div className={styles.body}>
        <label htmlFor="lesson-note" className={styles.label}>
          Mi nota
        </label>
        <textarea
          id="lesson-note"
          className={styles.textarea}
          value={value}
          placeholder="Escribe aquí lo que quieras recordar de esta lección."
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}
