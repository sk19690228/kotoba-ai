import { runDailyPDCACycle, queueDailyPostsWithPDCA } from '../system';

async function main() {
  const accountId = process.env.ACCOUNT_ID;
  const baseText = process.env.BASE_TEXT;
  const amazonUrl = process.env.AMAZON_URL;

  if (!accountId) throw new Error('ACCOUNT_ID env var is required');
  if (!baseText) throw new Error('BASE_TEXT env var is required');
  if (!amazonUrl) throw new Error('AMAZON_URL env var is required');

  await runDailyPDCACycle(accountId);
  await queueDailyPostsWithPDCA(accountId, baseText, amazonUrl);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
