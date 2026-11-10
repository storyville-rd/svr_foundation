import type { Env, ReportRow, Severity } from "./types";

const MONDAY_API_URL = "https://api.monday.com/v2";
const API_VERSION = "2024-10";

/** Column IDs on board 18431056223 ("Bug Reports"). */
export const COLUMNS = {
  APP: "dropdown_mm776cth",
  SEVERITY: "color_mm773chn",
  FREQUENCY: "text_mm77r3k7", // "How often does it happen?"
  DATE: "date4",
  SCREENSHOT: "file_mm77j5jj", // reserved for the R2 hook, unused in v1
  REPORTER: "text_mm7742zv",
  REPORTER_EMAIL: "email_mm77tmy7",
  BUILD: "text_mm77h25w",
  ROUTE: "text_mm77amfq",
  OCCURRENCES: "numeric_mm77ff02",
} as const;

const SEVERITY_LABEL: Record<Severity, string> = {
  blocked: "Critical",
  annoying: "Serious",
  cosmetic: "Aesthetic",
};

interface MondayResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/** Monday returns HTTP 200 with an `errors` array on failure — response.ok alone is not enough. */
async function mondayRequest<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const res = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
      "API-Version": API_VERSION,
    },
    body: JSON.stringify({ query, variables }),
  });

  const body = (await res.json()) as MondayResponse<T>;
  if (!res.ok || (body.errors && body.errors.length > 0)) {
    const message = body.errors?.map((e) => e.message).join("; ") ?? `HTTP ${res.status}`;
    throw new Error(`Monday API error: ${message}`);
  }
  if (!body.data) throw new Error("Monday API returned no data");
  return body.data;
}

function itemName(appLabel: string, description: string): string {
  return `[${appLabel}] ${description.slice(0, 80)}`;
}

function buildColumnValues(report: ReportRow, appLabel: string): Record<string, unknown> {
  const values: Record<string, unknown> = {
    [COLUMNS.APP]: { labels: [appLabel] },
    [COLUMNS.SEVERITY]: { label: SEVERITY_LABEL[report.severity] },
    [COLUMNS.FREQUENCY]: report.always_repro === 1 ? "Every time" : "Not every time",
    [COLUMNS.DATE]: { date: report.created_at.slice(0, 10) },
    [COLUMNS.OCCURRENCES]: String(report.dup_count),
  };
  if (report.url) values[COLUMNS.ROUTE] = report.url;
  if (report.build) values[COLUMNS.BUILD] = report.build;
  if (report.reporter_name || report.reporter_email) {
    values[COLUMNS.REPORTER] = report.reporter_name ?? report.reporter_email;
  }
  if (report.reporter_email) {
    values[COLUMNS.REPORTER_EMAIL] = { email: report.reporter_email, text: report.reporter_email };
  }
  return values;
}

const CREATE_ITEM_MUTATION = `
  mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
    create_item(board_id: $boardId, group_id: $groupId,
                item_name: $itemName, column_values: $columnValues) { id }
  }
`;

const CREATE_UPDATE_MUTATION = `
  mutation ($itemId: ID!, $body: String!) {
    create_update(item_id: $itemId, body: $body) { id }
  }
`;

export async function createItem(env: Env, appLabel: string, report: ReportRow): Promise<string> {
  const data = await mondayRequest<{ create_item: { id: string } }>(
    env.MONDAY_API_TOKEN,
    CREATE_ITEM_MUTATION,
    {
      boardId: env.MONDAY_BOARD_ID,
      groupId: env.MONDAY_GROUP_ID,
      itemName: itemName(appLabel, report.description),
      columnValues: JSON.stringify(buildColumnValues(report, appLabel)),
    }
  );
  return data.create_item.id;
}

function diagnosticsUpdateBody(report: ReportRow): string {
  const lines = [
    `Description: ${report.description}`,
    report.expected ? `Expected: ${report.expected}` : null,
    report.reporter_email ? `Reporter email: ${report.reporter_email}` : null,
    `Fingerprint: ${report.fingerprint}`,
    "",
    "Diagnostics:",
    report.diagnostics_json ?? "(none)",
  ].filter((line): line is string => line !== null);
  return lines.join("\n");
}

export async function createDiagnosticsUpdate(env: Env, itemId: string, report: ReportRow): Promise<void> {
  await mondayRequest(env.MONDAY_API_TOKEN, CREATE_UPDATE_MUTATION, {
    itemId,
    body: diagnosticsUpdateBody(report),
  });
}

export async function postDuplicateUpdate(
  env: Env,
  itemId: string,
  dupCount: number,
  dup: Pick<ReportRow, "description" | "expected" | "severity" | "reporter_email" | "reporter_name" | "url" | "created_at">
): Promise<void> {
  const reporter = [dup.reporter_name, dup.reporter_email].filter(Boolean).join(" ");
  const lines = [
    `Also reported again — ${dupCount} occurrences now.`,
    "",
    `Description: ${dup.description}`,
    dup.expected ? `Expected: ${dup.expected}` : null,
    `Severity: ${dup.severity}`,
    reporter ? `Reporter: ${reporter}` : null,
    `URL: ${dup.url}`,
    `Reported at: ${dup.created_at}`,
  ].filter((line): line is string => line !== null);
  await mondayRequest(env.MONDAY_API_TOKEN, CREATE_UPDATE_MUTATION, {
    itemId,
    body: lines.join("\n"),
  });
}
