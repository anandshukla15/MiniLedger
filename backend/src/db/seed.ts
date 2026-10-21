import { pool, query } from './index';

export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('[DB Seed] Seeding demo data...');

    // 1. Create a demo user
    const demoPhone = '+919876543210';
    const userRes = await query(
      `INSERT INTO users (phone)
       VALUES ($1)
       ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
       RETURNING id, phone;`,
      [demoPhone]
    );
    const userId = userRes.rows[0].id;
    console.log(`[DB Seed] Demo user ready: ${demoPhone} (ID: ${userId})`);

    // Clean existing loans for demo user to have deterministic seed
    await query(`DELETE FROM loans WHERE user_id = $1`, [userId]);

    // Calculate dates
    const today = new Date();
    const pastDate = (daysAgo: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };
    const futureDate = (daysAhead: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + daysAhead);
      return d.toISOString().split('T')[0];
    };

    // 2. Insert sample loans
    // - Overdue loans
    await query(
      `INSERT INTO loans (user_id, friend_name, amount, due_date, is_repaid, notes)
       VALUES ($1, $2, $3, $4, false, $5)`,
      [userId, 'Rahul Sharma', 2500.00, pastDate(7), 'Dinner and movie tickets']
    );

    await query(
      `INSERT INTO loans (user_id, friend_name, amount, due_date, is_repaid, notes)
       VALUES ($1, $2, $3, $4, false, $5)`,
      [userId, 'Priya Patel', 5000.00, pastDate(3), 'Emergency flight booking support']
    );

    // - Active upcoming loans
    await query(
      `INSERT INTO loans (user_id, friend_name, amount, due_date, is_repaid, notes)
       VALUES ($1, $2, $3, $4, false, $5)`,
      [userId, 'Amit Verma', 1200.00, futureDate(5), 'Grocery share for apartment']
    );

    await query(
      `INSERT INTO loans (user_id, friend_name, amount, due_date, is_repaid, notes)
       VALUES ($1, $2, $3, $4, false, $5)`,
      [userId, 'Sneha Rao', 3400.00, futureDate(12), 'Concert pass']
    );

    // - Repaid loans
    await query(
      `INSERT INTO loans (user_id, friend_name, amount, due_date, is_repaid, repaid_at, notes)
       VALUES ($1, $2, $3, $4, true, NOW() - INTERVAL '2 days', $5)`,
      [userId, 'Karan Singh', 1500.00, pastDate(10), 'Coffee & weekend trek']
    );

    await query(
      `INSERT INTO loans (user_id, friend_name, amount, due_date, is_repaid, repaid_at, notes)
       VALUES ($1, $2, $3, $4, true, NOW() - INTERVAL '5 days', $5)`,
      [userId, 'Vikram Mehta', 4000.00, pastDate(14), 'Laptop repair advance']
    );

    console.log('[DB Seed] Sample loans inserted successfully.');
  } catch (error) {
    console.error('[DB Seed] Error seeding database:', error);
    throw error;
  }
};

if (require.main === module) {
  seedDatabase()
    .then(() => {
      pool.end();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      pool.end();
      process.exit(1);
    });
}
