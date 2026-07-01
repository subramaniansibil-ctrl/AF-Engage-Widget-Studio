import { describe, expect, it } from 'vitest';
import { clientTemplateCsv, parseClientCsv } from './clientCsv';

describe('client CSV parsing', () => {
  it('parses the sample template into an importable row', () => {
    const result = parseClientCsv(clientTemplateCsv());
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].client.id).toBe('client-101');
  });

  it('supports quoted commas and keeps invalid rows out of the import payload', () => {
    const csv = [
      'Client Name,Client ID,Email,Mobile Number,Assigned Advisor,Status,Date of Birth,Risk Profile,Investment Goal,Portfolio ID',
      '"Morgan, Taylor",client-201,morgan@example.com,+27 82 555 0101,Advisor User,ACTIVE,1988-01-02,GROWTH,"Growth, then income",portfolio-201',
      'Broken client,client-202,not-an-email,+27 82 555 0102,Advisor User,ACTIVE,,,,',
    ].join('\n');
    const result = parseClientCsv(csv);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].client.name).toBe('Morgan, Taylor');
    expect(result.errors).toContainEqual({ rowNumber: 3, field: 'Email', message: 'is invalid' });
  });

  it('rejects missing and unknown advisors for admin uploads', () => {
    const csv = [
      CLIENT_HEADERS,
      'Missing,client-301,missing@example.com,+27 82 555 0101,,ACTIVE,,,,',
      'Unknown,client-302,unknown@example.com,+27 82 555 0102,Someone Else,ACTIVE,,,,',
    ].join('\n');
    const result = parseClientCsv(csv, { validAdvisors: ['Advisor User'] });
    expect(result.rows).toEqual([]);
    expect(result.errors).toContainEqual({ rowNumber: 2, field: 'Assigned Advisor', message: 'is required' });
    expect(result.errors).toContainEqual({ rowNumber: 3, field: 'Assigned Advisor', message: 'must match an active advisor' });
  });

  it('omits and overrides advisor assignment for advisor uploads', () => {
    const template = clientTemplateCsv({ includeAdvisor: false });
    expect(template.split('\n')[0]).not.toContain('Assigned Advisor');
    const result = parseClientCsv(template, { includeAdvisor: false, forcedAdvisor: 'Logged In Advisor' });
    expect(result.errors).toEqual([]);
    expect(result.rows[0].client.assignedAdvisor).toBe('Logged In Advisor');
  });
});

const CLIENT_HEADERS = 'Client Name,Client ID,Email,Mobile Number,Assigned Advisor,Status,Date of Birth,Risk Profile,Investment Goal,Portfolio ID';
