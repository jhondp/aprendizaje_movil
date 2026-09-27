import { screen, waitFor } from '@testing-library/react';
import { renderWithRepositories } from '@/application/testing/renderWithRepositories';
import { loadCourse } from '@/infrastructure/content/loadCourse';
import { LessonProvider } from '@/ui/organisms/interactive/LessonContext';
import { MdxProvider } from '@/ui/organisms/interactive/MdxProvider';
import { LessonArticle } from '@/ui/organisms/LessonArticle';

vi.mock('@codesandbox/sandpack-react', () => ({
  Sandpack: (props: { files: Record<string, string> }) => (
    <div data-testid="sandpack">{Object.keys(props.files).join(',')}</div>
  ),
}));

const course = loadCourse();

// A Práctica component (Playground, Sandpack, Snack, Terminal or Checklist) is required by the
// content validator, so every non-hidden lesson must render at least one of these markers.
const INTERACTIVE_SELECTORS = [
  '[data-testid="playground"]',
  '[data-testid="sandpack"]',
  'iframe[title="Expo Snack"]',
  '[role="log"]', // Terminal
  'input[type="checkbox"]', // Checklist
];

describe('every non-hidden lesson renders through the real MDX pipeline', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('has at least one lesson per stage', () => {
    for (const stage of course.stages) {
      expect(stage.lessons.length, `stage ${stage.slug}`).toBeGreaterThan(0);
    }
  });

  describe.each(course.stages)('stage $slug', (stage) => {
    it.each(stage.lessons.map((lesson) => [lesson.id, lesson] as const))(
      '%s',
      async (_id, lesson) => {
        const Content = await lesson.load();
        const { container } = renderWithRepositories(
          <LessonArticle
            lesson={lesson}
            stageTitle={stage.title}
            prev={null}
            note=""
            onNoteChange={() => {}}
            showNote={false}
            onToggleNote={() => {}}
            onComplete={() => {}}
          >
            <LessonProvider lessonId={lesson.id}>
              <MdxProvider>
                <Content />
              </MdxProvider>
            </LessonProvider>
          </LessonArticle>,
        );

        expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(lesson.title);
        expect(screen.getByRole('region', { name: 'Tarjetas de repaso' })).toBeInTheDocument();
        expect(screen.getByRole('region', { name: 'Cuestionario' })).toBeInTheDocument();
        // Sandpack loads lazily behind a Suspense boundary, so its mocked marker can take a tick
        // to appear; the other markers render synchronously but waitFor tolerates both.
        await waitFor(() => {
          expect(
            INTERACTIVE_SELECTORS.some((selector) => container.querySelector(selector) !== null),
          ).toBe(true);
        });
      },
    );
  });
});
