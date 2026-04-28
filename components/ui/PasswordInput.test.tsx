// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { PasswordInput } from './PasswordInput';

describe('<PasswordInput>', () => {
  it('por defecto el input es type=password (oculto)', () => {
    render(<PasswordInput aria-label="Contraseña" />);
    const input = screen.getByLabelText('Contraseña') as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  it('botón inicial dice "Mostrar contraseña" con aria-pressed=false', () => {
    render(<PasswordInput aria-label="Contraseña" />);
    const button = screen.getByRole('button', { name: /mostrar contraseña/i });
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('click en el botón → input pasa a type=text + aria-pressed=true + label "Ocultar"', async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Contraseña" defaultValue="secreto" />);

    await user.click(screen.getByRole('button', { name: /mostrar contraseña/i }));

    const input = screen.getByLabelText('Contraseña') as HTMLInputElement;
    expect(input.type).toBe('text');
    expect(input.value).toBe('secreto');

    const button = screen.getByRole('button', { name: /ocultar contraseña/i });
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('segundo click vuelve a ocultar', async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Contraseña" />);

    await user.click(screen.getByRole('button', { name: /mostrar/i }));
    await user.click(screen.getByRole('button', { name: /ocultar/i }));

    expect((screen.getByLabelText('Contraseña') as HTMLInputElement).type).toBe('password');
  });

  it('botón tiene tabIndex=-1 (no roba foco al tabular desde el input al siguiente campo)', () => {
    render(<PasswordInput aria-label="Contraseña" />);
    const button = screen.getByRole('button', { name: /mostrar contraseña/i });
    expect(button).toHaveAttribute('tabIndex', '-1');
  });

  it('forwardRef expone el input subyacente (necesario para react-hook-form)', () => {
    const ref = createRef<HTMLInputElement>();
    render(<PasswordInput aria-label="Contraseña" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.type).toBe('password');
  });

  it('error=true aplica clase de error al input', () => {
    render(<PasswordInput aria-label="Contraseña" error />);
    const input = screen.getByLabelText('Contraseña');
    // La clase exacta varía con CSS modules — comprobamos solo que tiene clase extra
    // marcando error (ambas: la base + la de error)
    expect(input.className.split(' ').length).toBeGreaterThanOrEqual(2);
  });
});
