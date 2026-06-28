import type { BulkClientRow, ClientImportError, ClientStatus, ClientUpsertRequest, RiskProfile } from './adminClientsApi';

export const CLIENT_TEMPLATE_HEADERS = [
  'Client Name', 'Client ID', 'Email', 'Mobile Number', 'Assigned Advisor', 'Status',
  'Date of Birth', 'Risk Profile', 'Investment Goal', 'Portfolio ID',
] as const;

export interface ParsedClientCsv {
  rows: BulkClientRow[];
  errors: ClientImportError[];
}

export function parseClientCsv(source: string): ParsedClientCsv {
  const records = parseCsvRecords(source.replace(/^\uFEFF/, ''));
  if (records.length === 0) return { rows: [], errors: [{ rowNumber: 1, field: 'file', message: 'CSV file is empty' }] };
  const headers = records[0].map((value) => value.trim());
  const missing = CLIENT_TEMPLATE_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    return { rows: [], errors: missing.map((field) => ({ rowNumber: 1, field, message: 'column is missing' })) };
  }
  const index = new Map(headers.map((header, position) => [header, position]));
  const rows: BulkClientRow[] = [];
  const errors: ClientImportError[] = [];

  records.slice(1).forEach((record, rowIndex) => {
    const rowNumber = rowIndex + 2;
    if (record.every((value) => value.trim() === '')) return;
    const get = (header: typeof CLIENT_TEMPLATE_HEADERS[number]) => (record[index.get(header) ?? -1] ?? '').trim();
    const status = get('Status').toUpperCase() as ClientStatus;
    const riskProfile = get('Risk Profile').toUpperCase() as RiskProfile | '';
    const client: ClientUpsertRequest = {
      id: get('Client ID'), name: get('Client Name'), email: get('Email').toLowerCase(),
      mobileNumber: get('Mobile Number'), assignedAdvisor: get('Assigned Advisor'), status,
      dateOfBirth: get('Date of Birth'), riskProfile, investmentGoal: get('Investment Goal'),
      portfolioId: get('Portfolio ID'), notes: '',
    };
    const required: Array<[string, string]> = [
      ['Client Name', client.name], ['Client ID', client.id], ['Email', client.email],
      ['Mobile Number', client.mobileNumber], ['Assigned Advisor', client.assignedAdvisor], ['Status', client.status],
    ];
    required.forEach(([field, value]) => {
      if (!value) errors.push({ rowNumber, field, message: 'is required' });
    });
    if (client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) errors.push({ rowNumber, field: 'Email', message: 'is invalid' });
    if (client.status && !['ACTIVE', 'INACTIVE'].includes(client.status)) errors.push({ rowNumber, field: 'Status', message: 'must be Active or Inactive' });
    if (client.riskProfile && !['CONSERVATIVE', 'MODERATE', 'GROWTH', 'AGGRESSIVE'].includes(client.riskProfile)) errors.push({ rowNumber, field: 'Risk Profile', message: 'is invalid' });
    if (client.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(client.dateOfBirth)) errors.push({ rowNumber, field: 'Date of Birth', message: 'must use YYYY-MM-DD' });
    if (!errors.some((error) => error.rowNumber === rowNumber)) rows.push({ rowNumber, client });
  });
  return { rows, errors };
}

export function clientTemplateCsv() {
  return [
    CLIENT_TEMPLATE_HEADERS.join(','),
    'Taylor Morgan,client-101,taylor.morgan@example.com,+27 82 555 0101,Advisor User,ACTIVE,1985-06-15,MODERATE,Retirement income,portfolio-101',
  ].join('\n');
}

function parseCsvRecords(source: string) {
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      record.push(field);
      field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && source[index + 1] === '\n') index += 1;
      record.push(field);
      records.push(record);
      record = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (field || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  return records;
}
