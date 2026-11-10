#!/usr/bin/env node
// One-off: creates the 5 columns the build spec (§9) assumes but the live "Bug Reports"
// board (18431056223) doesn't have. Run once, then paste the printed IDs into the
// COLUMNS object in src/monday.ts, replacing the TODO_* placeholders.
//
// Usage: MONDAY_API_TOKEN=xxxx node scripts/setup-monday-columns.mjs

const BOARD_ID = "18431056223";
const API_URL = "https://api.monday.com/v2";
const API_VERSION = "2024-10";

const token = process.env.MONDAY_API_TOKEN;
if (!token) {
  console.error("Set MONDAY_API_TOKEN in the environment before running this script.");
  process.exit(1);
}

const COLUMNS_TO_CREATE = [
  { title: "Reporter", type: "text" },
  { title: "Reporter Email", type: "email" },
  { title: "Build", type: "text" },
  { title: "Route", type: "text" },
  { title: "Occurrences", type: "numbers" },
];

const CREATE_COLUMN_MUTATION = `
  mutation ($boardId: ID!, $title: String!, $columnType: ColumnType!) {
    create_column(board_id: $boardId, title: $title, column_type: $columnType) { id title }
  }
`;

async function createColumn(title, columnType) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
      "API-Version": API_VERSION,
    },
    body: JSON.stringify({
      query: CREATE_COLUMN_MUTATION,
      variables: { boardId: BOARD_ID, title, columnType },
    }),
  });

  const body = await res.json();
  if (!res.ok || (body.errors && body.errors.length > 0)) {
    throw new Error(`Failed to create column "${title}": ${JSON.stringify(body.errors ?? body)}`);
  }
  return body.data.create_column;
}

const created = {};
for (const { title, type } of COLUMNS_TO_CREATE) {
  const column = await createColumn(title, type);
  created[title] = column.id;
  console.log(`Created "${title}" -> ${column.id}`);
}

console.log("\nPaste into src/monday.ts COLUMNS:");
console.log(`  REPORTER: "${created["Reporter"]}",`);
console.log(`  REPORTER_EMAIL: "${created["Reporter Email"]}",`);
console.log(`  BUILD: "${created["Build"]}",`);
console.log(`  ROUTE: "${created["Route"]}",`);
console.log(`  OCCURRENCES: "${created["Occurrences"]}",`);
