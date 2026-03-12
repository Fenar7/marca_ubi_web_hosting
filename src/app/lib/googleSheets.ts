import "server-only";

import { google, sheets_v4 } from "googleapis";

const GOOGLE_SHEETS_SCOPE = ["https://www.googleapis.com/auth/spreadsheets"];
const GOOGLE_SHEETS_HEADERS = [
  "Submission ID",
  "Submitted At",
  "Source",
  "Name",
  "Business Type",
  "Phone",
  "Email",
  "Instagram ID",
  "Website",
  "Message",
] as const;

type GoogleSheetsConfig = {
  clientEmail: string;
  privateKey: string;
  spreadsheetId: string;
  sheetName: string;
};

type GoogleSheetsAppendRowInput = {
  submissionId: string;
  submittedAt: string;
  source: string;
  name: string;
  businessType: string;
  phone: string;
  email: string;
  instagramId?: string;
  website?: string;
  message?: string;
};

function quoteSheetName(sheetName: string) {
  return `'${sheetName.replace(/'/g, "''")}'`;
}

function getGoogleSheetsConfig(): GoogleSheetsConfig | null {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || "Company Profile Submissions";

  const providedValues = [clientEmail, privateKey, spreadsheetId].filter(Boolean);

  if (providedValues.length === 0) {
    return null;
  }

  if (!clientEmail || !privateKey || !spreadsheetId) {
    throw new Error(
      "Google Sheets sync is partially configured. Please set GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY, and GOOGLE_SHEETS_SPREADSHEET_ID.",
    );
  }

  return {
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
    spreadsheetId,
    sheetName,
  };
}

async function createSheetsClient(config: GoogleSheetsConfig) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: config.clientEmail,
      private_key: config.privateKey,
    },
    scopes: GOOGLE_SHEETS_SCOPE,
  });

  return google.sheets({
    version: "v4",
    auth,
  });
}

async function ensureSheetExists(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string,
) {
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.title",
  });

  const existingSheetNames =
    spreadsheet.data.sheets?.map((sheet) => sheet.properties?.title).filter(Boolean) ?? [];

  if (existingSheetNames.includes(sheetName)) {
    return;
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetName,
            },
          },
        },
      ],
    },
  });
}

async function ensureHeaderRow(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string,
) {
  const headerRange = `${quoteSheetName(sheetName)}!A1:J1`;
  const existingHeader = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: headerRange,
  });

  const existingHeaderRow = existingHeader.data.values?.[0] ?? [];

  if (existingHeaderRow.length > 0) {
    return;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: headerRange,
    valueInputOption: "RAW",
    requestBody: {
      values: [Array.from(GOOGLE_SHEETS_HEADERS)],
    },
  });
}

async function hasRowForSubmissionId(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string,
  submissionId: string,
) {
  const idColumn = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${quoteSheetName(sheetName)}!A2:A`,
  });

  const values = idColumn.data.values ?? [];

  return values.some((row) => row[0] === submissionId);
}

export async function appendCompanyProfileSubmissionToGoogleSheet(
  rowData: GoogleSheetsAppendRowInput,
) {
  const config = getGoogleSheetsConfig();

  if (!config) {
    return {
      enabled: false as const,
      appended: false as const,
    };
  }

  const sheets = await createSheetsClient(config);

  await ensureSheetExists(sheets, config.spreadsheetId, config.sheetName);
  await ensureHeaderRow(sheets, config.spreadsheetId, config.sheetName);

  const alreadyExists = await hasRowForSubmissionId(
    sheets,
    config.spreadsheetId,
    config.sheetName,
    rowData.submissionId,
  );

  if (alreadyExists) {
    return {
      enabled: true as const,
      appended: false as const,
      duplicate: true as const,
    };
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: config.spreadsheetId,
    range: `${quoteSheetName(config.sheetName)}!A:J`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [
        [
          rowData.submissionId,
          rowData.submittedAt,
          rowData.source,
          rowData.name,
          rowData.businessType,
          rowData.phone,
          rowData.email,
          rowData.instagramId || "",
          rowData.website || "",
          rowData.message || "",
        ],
      ],
    },
  });

  return {
    enabled: true as const,
    appended: true as const,
  };
}
