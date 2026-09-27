import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Challenge } from './Challenge';

describe('Challenge', () => {
  it('hides the solution until the learner asks for it', async () => {
    render(
      <Challenge title="Reto" solution={<p>La respuesta</p>}>
        <p>Enunciado</p>
      </Challenge>,
    );
    expect(screen.getByRole('heading', { name: 'Reto' })).toBeInTheDocument();
    expect(screen.getByText('Enunciado')).toBeInTheDocument();
    expect(screen.queryByText('La respuesta')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ver solución' }));
    expect(screen.getByText('La respuesta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ocultar solución' })).toBeInTheDocument();
  });
});
