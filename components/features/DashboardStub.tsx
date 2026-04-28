import type { ReactNode } from 'react';
import styles from './DashboardStub.module.scss';

type Props = {
  greeting: string;
  subtitle: string;
  cards: { title: string; description: string; phase: string; cta?: ReactNode }[];
};

/**
 * Componente reutilizable para los dashboards stub que devuelven los 3 roles
 * en Fase 2. Cada uno saluda al usuario y enuncia qué llegará en fases
 * futuras (cursos, asistencia, gestión, etc.). Útil para que el flujo
 * post-login no aterrice en una pantalla en blanco.
 */
export function DashboardStub({ greeting, subtitle, cards }: Props) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{greeting}</h1>
        <p>{subtitle}</p>
      </header>

      <section className={styles.grid}>
        {cards.map((card) => (
          <article key={card.title} className={styles.card}>
            <span className={styles.phase}>{card.phase}</span>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            {card.cta ? <div className={styles.cardFooter}>{card.cta}</div> : null}
          </article>
        ))}
      </section>
    </div>
  );
}
