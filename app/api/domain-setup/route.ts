const setupKey = "domain-setup-4d7d9f88-771e-4f1e-b1e8-8fa816490c33";
const customDomain = "kisr47.kw";
const apiBaseUrl = "https://api.cloudflare.com/client/v4";

const desiredRecords = [
  {
    type: "A",
    name: customDomain,
    content: "162.159.143.30",
  },
  {
    type: "A",
    name: customDomain,
    content: "172.66.3.26",
  },
  {
    type: "TXT",
    name: `_openai-site-verification.${customDomain}`,
    content:
      "openai-site-verification=Ns5Y6C2xlRYjnZr_aiPhyuKgKFjzjhJTl5af23OZlcg",
  },
  {
    type: "TXT",
    name: `_cf-custom-hostname.${customDomain}`,
    content: "fc699eec-89e0-4bda-b6ff-6e408fa247b6",
  },
] as const;

type CloudflareRecord = {
  id: string;
  type: string;
  name: string;
  content: string;
  proxied?: boolean;
};

type CloudflareResponse<T> = {
  success: boolean;
  result: T;
  errors?: Array<{ message?: string }>;
};

async function cloudflareRequest<T>(
  path: string,
  apiToken: string,
  init?: RequestInit,
) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const payload = (await response.json()) as CloudflareResponse<T>;
  if (!response.ok || !payload.success) {
    const message =
      payload.errors?.map((error) => error.message).filter(Boolean).join("; ") ||
      `Cloudflare request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload.result;
}

function recordBody(record: (typeof desiredRecords)[number]) {
  return JSON.stringify({
    type: record.type,
    name: record.name,
    content: record.content,
    ttl: 1,
    ...(record.type === "A" ? { proxied: false } : {}),
  });
}

export async function POST(request: Request) {
  if (request.headers.get("x-domain-setup-key") !== setupKey) {
    return Response.json({ ok: false }, { status: 404 });
  }

  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;

  if (!apiToken || !zoneId) {
    return Response.json(
      { ok: false, error: "Hosting environment is incomplete." },
      { status: 500 },
    );
  }

  try {
    const domainRecords = await cloudflareRequest<CloudflareRecord[]>(
      `/zones/${zoneId}/dns_records?name=${encodeURIComponent(customDomain)}&per_page=100`,
      apiToken,
    );

    const apexTargets: string[] = desiredRecords
      .filter((record) => record.type === "A")
      .map((record) => record.content);

    const conflicts = domainRecords.filter(
      (record) =>
        ["A", "AAAA", "CNAME"].includes(record.type) &&
        !(record.type === "A" && apexTargets.includes(record.content)),
    );

    if (conflicts.length > 0) {
      return Response.json(
        {
          ok: false,
          error: "Conflicting apex DNS records require manual review.",
          conflicts: conflicts.map(({ type, name }) => ({ type, name })),
        },
        { status: 409 },
      );
    }

    for (const record of desiredRecords) {
      const records = await cloudflareRequest<CloudflareRecord[]>(
        `/zones/${zoneId}/dns_records?type=${record.type}&name=${encodeURIComponent(record.name)}&per_page=100`,
        apiToken,
      );
      const existing = records.find(
        (item) => item.content === record.content,
      );
      const body = recordBody(record);

      if (existing) {
        await cloudflareRequest(
          `/zones/${zoneId}/dns_records/${existing.id}`,
          apiToken,
          { method: "PUT", body },
        );
      } else {
        await cloudflareRequest(
          `/zones/${zoneId}/dns_records`,
          apiToken,
          { method: "POST", body },
        );
      }
    }

    return Response.json({
      ok: true,
      domain: customDomain,
      recordsConfigured: desiredRecords.length,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown setup error.",
      },
      { status: 502 },
    );
  }
}
