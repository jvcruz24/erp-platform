import styles from './page.module.css';
import { prisma } from '@repo/db';

export default async function Home() {
  const user = await prisma;
  console.log('Prisma: ', user);
  return (
    <div className={styles.page}>
      <main className={styles.main}></main>
    </div>
  );
}
