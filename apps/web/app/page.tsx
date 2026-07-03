import styles from './page.module.css';
import { prisma } from '@repo/db';

export default async function Home() {
  // TODO MAIN
  const user = await prisma;
  return (
    <div className={styles.page}>
      <main className={styles.main}></main>
    </div>
  );
}
