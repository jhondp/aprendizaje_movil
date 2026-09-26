import { screen } from '@testing-library/react';
import { renderWithRepositories } from '@/application/testing/renderWithRepositories';
import { loadCourse } from '@/infrastructure/content/loadCourse';
import { LessonProvider } from '@/ui/organisms/interactive/LessonContext';
import { MdxProvider } from '@/ui/organisms/interactive/MdxProvider';

vi.mock('@codesandbox/sandpack-react', () => ({
  Sandpack: (props: { files: Record<string, string> }) => (
    <div data-testid="sandpack">{Object.keys(props.files).join(',')}</div>
  ),
}));

const DEMO_ID = '00-aprender-a-programar/99-demo-componentes';

describe('demo lesson', () => {
  it('is hidden from the sidebar but still loadable', () => {
    const course = loadCourse();
    expect(course.byId[DEMO_ID]?.hidden).toBe(true);
    expect(course.stages[0]?.lessons.some((l) => l.id === DEMO_ID)).toBe(false);
  });

  it('renders all nine interactive components', async () => {
    const Body = await loadCourse().byId[DEMO_ID]!.load();
    renderWithRepositories(
      <LessonProvider lessonId={DEMO_ID}>
        <MdxProvider>
          <Body />
        </MdxProvider>
      </LessonProvider>,
    );
    expect(screen.getAllByRole('note')).toHaveLength(3); // Callout
    expect(screen.getAllByRole('button', { name: 'Ejecutar' }).length).toBeGreaterThan(0); // Playground
    expect(screen.getByTestId('sandpack')).toHaveTextContent('/App.tsx'); // Sandpack
    expect(screen.getByTitle('Expo Snack')).toBeInTheDocument(); // Snack
    expect(screen.getByRole('button', { name: 'Siguiente paso' })).toBeInTheDocument(); // Terminal
    expect(screen.getByLabelText('Instalé Node.js')).toBeInTheDocument(); // Checklist
    expect(screen.getByRole('button', { name: 'Ver solución' })).toBeInTheDocument(); // Challenge
    expect(screen.getByRole('region', { name: 'Tarjetas de repaso' })).toBeInTheDocument(); // Flashcards
    expect(screen.getByRole('region', { name: 'Cuestionario' })).toBeInTheDocument(); // Quiz
  });
});
