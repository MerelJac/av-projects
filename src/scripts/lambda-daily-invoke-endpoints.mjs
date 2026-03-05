// Node 18/20 has fetch built in — no import needed

export const handler = async () => {
  const endpoints = [
    "https://dev.dxjwq4zy4abxh.amplifyapp.com/api/cron/daily",
    "https://www.dialedfitnessclub.com/api/cron/daily",
  ];

  const results = [];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}` },
      });
      console.log(`✅ Called ${url} → ${res.status}`);
      results.push({ url, status: res.status });
    } catch (err) {
      console.error(`❌ Error calling ${url}:`, err);
      results.push({ url, error: err.message });
    }
  }

  // 🔒 Always return 200 so EventBridge doesn’t retry
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "All daily cron jobs attempted",
      results,
    }),
  };
};
