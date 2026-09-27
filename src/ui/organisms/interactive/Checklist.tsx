import { useChecklist } from '@/application/hooks/useChecklist';
import { useLessonId } from './useLessonId';
import styles from './Checklist.module.css';

export function Checklist({ id, items }: { id: string; items: string[] }) {
  const lessonId = useLessonId();
  const { checked, toggle } = useChecklist(lessonId, id);
  return (
    <div className={styles.root}>
      <ul className={styles.list}>
        {items.map((item, index) => {
          const inputId = `${lessonId}:${id}:${index}`;
          return (
            <li key={index} className={styles.item}>
              <input
                id={inputId}
                type="checkbox"
                className={styles.checkbox}
                checked={checked.includes(index)}
                onChange={() => toggle(index)}
              />
              <label htmlFor={inputId} className={styles.label}>
                {item}
              </label>
            </li>
          );
        })}
      </ul>
      <div className={styles.summary}>
        {checked.length} de {items.length} completados
      </div>
    </div>
  );
}
