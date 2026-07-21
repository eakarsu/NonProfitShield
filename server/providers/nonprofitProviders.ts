const configs: Record<string, [string, string]> = {
  fundraising: ["FUNDRAISING_PROVIDER_URL", "FUNDRAISING_PROVIDER_TOKEN"],
  accounting: ["ACCOUNTING_PROVIDER_URL", "ACCOUNTING_PROVIDER_TOKEN"],
  communications: ["COMMUNICATIONS_PROVIDER_URL", "COMMUNICATIONS_PROVIDER_TOKEN"],
};

export async function dispatch(job: Record<string, any>): Promise<Record<string, unknown>> {
  const config = configs[job.connector];
  if (!config) throw new Error("unsupported_connector");
  const [urlName, tokenName] = config;
  const url = process.env[urlName]; const token = process.env[tokenName];
  if (!url || !token) throw new Error(`connector_not_configured:${job.connector}`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(process.env.PROVIDER_TIMEOUT_MS || 10_000));
  try {
    const response = await fetch(url, { method: "POST", signal: controller.signal, headers: {
      authorization: `Bearer ${token}`, "content-type": "application/json", "idempotency-key": job.idempotency_key, "x-payload-hash": job.payload_hash,
    }, body: JSON.stringify({ operation: job.operation, payload: job.payload }) });
    const receipt = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) throw new Error(`provider_${response.status}`);
    if (!receipt.providerRequestId || receipt.payloadHash !== job.payload_hash) throw new Error("invalid_provider_receipt");
    return receipt;
  } finally { clearTimeout(timer); }
}

export { configs };
