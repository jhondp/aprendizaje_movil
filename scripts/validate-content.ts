import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContent } from './lib/validateContent';

export {
  extractBlock,
  extractProp,
  extractQuizQuestions,
  validateContent,
  validateLesson,
} from './lib/validateContent';
export type { LessonValidation, QuizQuestionSource, ValidationResult } from './lib/validateContent';

const isMain =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const root = path.resolve(process.cwd(), process.argv[2] ?? 'content');
  const result = validateContent(root);
  if (result.ok) {
    console.log(`Content OK (${root})`);
  } else {
    console.error(`Content validation failed with ${result.errors.length} error(s):`);
    for (const e of result.errors) console.error(`  - ${e}`);
    process.exit(1);
  }
}
