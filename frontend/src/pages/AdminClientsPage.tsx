import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { Download, Eye, FileUp, Pencil, Plus, Search, UserRoundX, UsersRound, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { Skeleton } from '../components/ui/Skeleton';
import {
  useBulkImportClientsMutation,
  useCreateAdminClientMutation,
  useDeactivateAdminClientMutation,
  useGetAdminClientsQuery,
  useUpdateAdminClientMutation,
  type AdminClient,
  type ClientImportError,
  type ClientUpsertRequest,
} from '../features/admin/adminClientsApi';
import { clientTemplateCsv, parseClientCsv } from '../features/admin/clientCsv';
import { useGetAdminAdvisorsQuery } from '../features/admin/adminAdvisorsApi';
import { addToast } from '../features/ui/uiSlice';

type Panel = 'create' | 'edit' | 'view' | 'bulk' | null;
const pageSize = 10;
const inputClass = 'min-h-10 w-full rounded-md border border-ink/12 bg-white/70 px-3 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-sage focus:ring-2 focus:ring-sage/15 dark:border-white/12 dark:bg-white/5 dark:text-white';
const emptyForm = (assignedAdvisor: string): ClientUpsertRequest => ({
  id: '', name: '', email: '', mobileNumber: '', assignedAdvisor, status: 'ACTIVE',
  dateOfBirth: '', riskProfile: 'MODERATE', investmentGoal: '', portfolioId: '', notes: '', password: '',
});

export function AdminClientsPage() {
  const dispatch = useAppDispatch();
  const { role, user } = useAppSelector((state) => state.auth);
  const isAdmin = role === 'ADMIN';
  const currentAdvisor = user?.name ?? '';
  const { data: advisors = [] } = useGetAdminAdvisorsQuery({ status: 'ACTIVE' }, { skip: !isAdmin });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | 'ACTIVE' | 'INACTIVE'>('');
  const [advisor, setAdvisor] = useState('');
  const [recent, setRecent] = useState(false);
  const [page, setPage] = useState(1);
  const [panel, setPanel] = useState<Panel>(null);
  const [selected, setSelected] = useState<AdminClient | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const { data: clientPage, isLoading, isFetching, error } = useGetAdminClientsQuery({ search, status, assignedAdvisor: advisor, recent, page, pageSize });
  const [deactivate, { isLoading: isDeactivating }] = useDeactivateAdminClientMutation();

  useEffect(() => setPage(1), [search, status, advisor, recent]);
  const clients = clientPage?.items ?? [];
  const meta = clientPage?.meta;

  function openPanel(next: Exclude<Panel, null>, client?: AdminClient) {
    setSelected(client ?? null);
    setPanel(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function confirmDeactivate(id: string) {
    try {
      await deactivate(id).unwrap();
      setDeactivateId(null);
      dispatch(addToast({ title: 'Client deactivated', description: 'The client is no longer available for new advisor assignments.', variant: 'success' }));
    } catch (requestError) {
      dispatch(addToast({ title: 'Could not deactivate client', description: errorMessage(requestError), variant: 'error' }));
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-sage">{isAdmin ? 'Administration' : 'Advisor workspace'}</p>
          <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Client management</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/62 dark:text-white/62">Create and maintain verified client records advisors can use for personalized widget journeys.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => openPanel('bulk')}><FileUp className="h-4 w-4" />Bulk upload</Button>
          <Button onClick={() => openPanel('create')}><Plus className="h-4 w-4" />Create client</Button>
        </div>
      </section>

      {panel && (
        <section className="rounded-md border border-ink/10 bg-white/65 p-4 shadow-panel backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{panelTitle(panel)}</h3>
              <p className="mt-1 text-xs text-ink/55 dark:text-white/55">Required fields are marked with an asterisk.</p>
            </div>
            <Button variant="ghost" className="h-9 w-9 px-0" onClick={() => setPanel(null)} aria-label="Close panel"><X className="h-4 w-4" /></Button>
          </div>
          {panel === 'bulk' ? <BulkUpload onDone={() => setPanel(null)} isAdmin={isAdmin} currentAdvisor={currentAdvisor} advisors={advisors.map((item) => item.name)} /> : panel === 'view' && selected ? <ClientView client={selected} onEdit={() => openPanel('edit', selected)} /> : <ClientForm client={panel === 'edit' ? selected : null} onDone={() => setPanel(null)} isAdmin={isAdmin} currentAdvisor={currentAdvisor} advisors={advisors.map((item) => item.name)} />}
        </section>
      )}

      <section className="space-y-3">
        <div className="grid gap-2 rounded-md border border-ink/10 bg-white/55 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 md:grid-cols-[minmax(240px,1fr)_160px_190px_auto]">
          <label className="relative">
            <span className="sr-only">Search clients</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink/40" />
            <input className={`${inputClass} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, advisor or client ID" />
          </label>
          <select aria-label="Filter by status" className={inputClass} value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
          </select>
          {isAdmin ? <select aria-label="Filter by assigned advisor" className={inputClass} value={advisor} onChange={(event) => setAdvisor(event.target.value)}><option value="">All advisors</option>{advisors.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select> : <input aria-label="Assigned advisor" disabled className={inputClass} value={currentAdvisor} />}
          <label className="flex min-h-10 items-center gap-2 rounded-md border border-ink/10 bg-white/45 px-3 text-sm font-medium dark:border-white/10 dark:bg-white/5">
            <input type="checkbox" checked={recent} onChange={(event) => setRecent(event.target.checked)} className="h-4 w-4 accent-sage" />Recently created
          </label>
        </div>

        {isLoading ? <ClientTableSkeleton /> : error ? <EmptyState title="Clients could not be loaded" description={errorMessage(error)} /> : clients.length === 0 ? (
          <EmptyState title="No clients found" description="Adjust the filters or create the first client record." action={<Button onClick={() => openPanel('create')}><Plus className="h-4 w-4" />Create client</Button>} />
        ) : (
          <div className="overflow-hidden rounded-md border border-ink/10 bg-white/65 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead className="border-b border-ink/10 bg-ink/[0.025] text-xs font-semibold uppercase text-ink/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50">
                  <tr><th className="px-4 py-3">Client</th><th className="px-4 py-3">Client ID</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Advisor</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-ink/8 dark:divide-white/8">
                  {clients.map((client) => (
                    <tr key={client.id} className="transition hover:bg-sage/[0.045]">
                      <td className="px-4 py-3"><p className="font-semibold">{client.name}</p><p className="mt-0.5 text-xs text-ink/50 dark:text-white/50">{client.riskProfile || 'No risk profile'}</p></td>
                      <td className="px-4 py-3 font-mono text-xs text-ink/65 dark:text-white/65">{client.id}</td>
                      <td className="px-4 py-3"><p>{client.email}</p><p className="mt-0.5 text-xs text-ink/50 dark:text-white/50">{client.mobileNumber}</p></td>
                      <td className="px-4 py-3">{client.assignedAdvisor}</td>
                      <td className="px-4 py-3"><StatusBadge status={client.status} /></td>
                      <td className="px-4 py-3">
                        {deactivateId === client.id ? (
                          <div className="flex justify-end gap-2"><span className="self-center text-xs font-medium text-coral">Deactivate?</span><Button variant="secondary" onClick={() => setDeactivateId(null)}>Cancel</Button><Button disabled={isDeactivating} onClick={() => confirmDeactivate(client.id)}>Confirm</Button></div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <IconButton label="View client" onClick={() => openPanel('view', client)}><Eye className="h-4 w-4" /></IconButton>
                            <IconButton label="Edit client" onClick={() => openPanel('edit', client)}><Pencil className="h-4 w-4" /></IconButton>
                            <IconButton label="Deactivate client" disabled={client.status === 'INACTIVE'} onClick={() => setDeactivateId(client.id)}><UserRoundX className="h-4 w-4" /></IconButton>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={meta?.page ?? page}
              totalPages={meta?.totalPages ?? 1}
              totalItems={meta?.totalItems}
              itemLabel="client"
              isFetching={isFetching}
              onChange={setPage}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function ClientForm({ client, onDone, isAdmin, currentAdvisor, advisors }: { client: AdminClient | null; onDone: () => void; isAdmin: boolean; currentAdvisor: string; advisors: string[] }) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<ClientUpsertRequest>(() => client ? fromClient(client) : emptyForm(isAdmin ? '' : currentAdvisor));
  const [createClient, createState] = useCreateAdminClientMutation();
  const [updateClient, updateState] = useUpdateAdminClientMutation();
  const saving = createState.isLoading || updateState.isLoading;
  function set<K extends keyof ClientUpsertRequest>(field: K, value: ClientUpsertRequest[K]) { setForm((current) => ({ ...current, [field]: value })); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const body = isAdmin ? form : { ...form, assignedAdvisor: currentAdvisor };
      if (client) await updateClient({ id: client.id, body }).unwrap(); else await createClient(body).unwrap();
      dispatch(addToast({ title: client ? 'Client updated' : 'Client created', description: `${form.name} is ready for advisor workflows.`, variant: 'success' }));
      onDone();
    } catch (requestError) {
      dispatch(addToast({ title: 'Client could not be saved', description: errorMessage(requestError), variant: 'error' }));
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Client name *"><input required className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Client ID *"><input required disabled={Boolean(client)} className={inputClass} value={form.id} onChange={(e) => set('id', e.target.value)} /></Field>
        <Field label="Email address *"><input required type="email" className={inputClass} value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Mobile number *"><input required className={inputClass} value={form.mobileNumber} onChange={(e) => set('mobileNumber', e.target.value)} /></Field>
        <Field label="Assigned advisor *">{isAdmin ? <select required className={inputClass} value={form.assignedAdvisor} onChange={(e) => set('assignedAdvisor', e.target.value)}><option value="">Select an active advisor</option>{advisors.map((name) => <option key={name} value={name}>{name}</option>)}</select> : <input required disabled readOnly className={inputClass} value={currentAdvisor} />}</Field>
        <Field label={client ? 'New password' : 'Password *'}><input required={!client} type="password" minLength={8} className={inputClass} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder={client ? 'Leave blank to keep current password' : ''} /></Field>
        <Field label="Status *"><select required className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value as ClientUpsertRequest['status'])}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></Field>
        <Field label="Date of birth"><input type="date" className={inputClass} value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} /></Field>
        <Field label="Risk profile"><select className={inputClass} value={form.riskProfile} onChange={(e) => set('riskProfile', e.target.value as ClientUpsertRequest['riskProfile'])}><option value="">Not set</option><option value="CONSERVATIVE">Conservative</option><option value="MODERATE">Moderate</option><option value="GROWTH">Growth</option><option value="AGGRESSIVE">Aggressive</option></select></Field>
        <Field label="Investment goal"><input className={inputClass} value={form.investmentGoal} onChange={(e) => set('investmentGoal', e.target.value)} /></Field>
        <Field label="Portfolio ID"><input className={inputClass} value={form.portfolioId} onChange={(e) => set('portfolioId', e.target.value)} /></Field>
        <Field label="Notes" wide><textarea rows={3} className={`${inputClass} py-2`} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
      </div>
      <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onDone}>Cancel</Button><Button disabled={saving} type="submit">{saving ? 'Saving…' : client ? 'Save changes' : 'Create client'}</Button></div>
    </form>
  );
}

function BulkUpload({ onDone, isAdmin, currentAdvisor, advisors }: { onDone: () => void; isAdmin: boolean; currentAdvisor: string; advisors: string[] }) {
  const dispatch = useAppDispatch();
  const [rows, setRows] = useState<ReturnType<typeof parseClientCsv>['rows']>([]);
  const [errors, setErrors] = useState<ClientImportError[]>([]);
  const [fileName, setFileName] = useState('');
  const [importClients, { isLoading }] = useBulkImportClientsMutation();
  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([clientTemplateCsv({ includeAdvisor: isAdmin, validAdvisors: advisors })], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'af-engage-client-template.csv'; anchor.click(); URL.revokeObjectURL(url);
  }
  async function readFile(file: File | undefined) {
    if (!file) return;
    const parsed = parseClientCsv(await file.text(), { includeAdvisor: isAdmin, forcedAdvisor: isAdmin ? undefined : currentAdvisor, validAdvisors: isAdmin ? advisors : undefined }); setRows(parsed.rows); setErrors(parsed.errors); setFileName(file.name);
  }
  async function upload() {
    try {
      const result = await importClients({ rows }).unwrap();
      setErrors((current) => [...current, ...result.errors]);
      dispatch(addToast({ title: `${result.imported} client${result.imported === 1 ? '' : 's'} imported`, description: result.failed ? `${result.failed} row(s) were not imported.` : 'All valid rows were added successfully.', variant: result.failed ? 'info' : 'success' }));
      if (!result.failed) onDone();
    } catch (requestError) {
      dispatch(addToast({ title: 'Upload failed', description: errorMessage(requestError), variant: 'error' }));
    }
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-md border border-dashed border-ink/15 bg-white/35 p-4 dark:border-white/15 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-sm font-semibold">Upload a CSV file</p><p className="mt-1 text-xs text-ink/55 dark:text-white/55">{isAdmin ? 'Each row must name an active advisor.' : `All imported clients will be assigned to ${currentAdvisor}; any Advisor column is ignored.`} Valid rows import independently.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={downloadTemplate}><Download className="h-4 w-4" />Sample template</Button><label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white"><FileUp className="h-4 w-4" />Choose CSV<input className="sr-only" type="file" accept=".csv,text/csv" onChange={(e) => readFile(e.target.files?.[0])} /></label></div>
      </div>
      {fileName && <p className="text-sm"><span className="font-semibold">{fileName}</span> · {rows.length} valid row(s) · {new Set(errors.map((item) => item.rowNumber)).size} invalid row(s)</p>}
      {errors.length > 0 && <div className="max-h-48 overflow-auto rounded-md border border-coral/20 bg-coral/5"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-white text-ink/55 dark:bg-ink dark:text-white/55"><tr><th className="px-3 py-2">Row</th><th className="px-3 py-2">Field</th><th className="px-3 py-2">Issue</th></tr></thead><tbody>{errors.map((error, index) => <tr key={`${error.rowNumber}-${error.field}-${index}`} className="border-t border-coral/10"><td className="px-3 py-2">{error.rowNumber}</td><td className="px-3 py-2 font-semibold">{error.field}</td><td className="px-3 py-2">{error.message}</td></tr>)}</tbody></table></div>}
      <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onDone}>Cancel</Button><Button disabled={rows.length === 0 || isLoading} onClick={upload}>{isLoading ? 'Importing…' : `Import ${rows.length} valid row${rows.length === 1 ? '' : 's'}`}</Button></div>
    </div>
  );
}

function ClientView({ client, onEdit }: { client: AdminClient; onEdit: () => void }) {
  const details = [['Client ID', client.id], ['Email', client.email], ['Mobile', client.mobileNumber], ['Assigned advisor', client.assignedAdvisor], ['Status', client.status], ['Date of birth', client.dateOfBirth || 'Not provided'], ['Risk profile', client.riskProfile || 'Not set'], ['Investment goal', client.investmentGoal || 'Not provided'], ['Portfolio ID', client.portfolioId || 'Not provided'], ['Notes', client.notes || 'No notes']];
  return <div><div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">{details.map(([label, value]) => <div key={label}><p className="text-xs font-semibold uppercase text-ink/45 dark:text-white/45">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>)}</div><div className="mt-5 flex justify-end"><Button onClick={onEdit}><Pencil className="h-4 w-4" />Edit client</Button></div></div>;
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) { return <label className={wide ? 'md:col-span-2 xl:col-span-2' : ''}><span className="mb-1.5 block text-xs font-semibold text-ink/60 dark:text-white/60">{label}</span>{children}</label>; }
function IconButton({ label, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) { return <button type="button" aria-label={label} title={label} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink/55 transition hover:bg-ink/5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 dark:text-white/55 dark:hover:bg-white/10 dark:hover:text-white" {...props}>{children}</button>; }
function StatusBadge({ status }: { status: string }) { return <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${status === 'ACTIVE' ? 'bg-sage/12 text-sage' : 'bg-ink/8 text-ink/55 dark:bg-white/10 dark:text-white/55'}`}>{status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>; }
function ClientTableSkeleton() { return <div className="space-y-2 rounded-md border border-ink/10 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-14" />)}</div>; }
function panelTitle(panel: Exclude<Panel, null>) { return ({ create: 'Create client', edit: 'Edit client', view: 'Client details', bulk: 'Bulk upload clients' } as const)[panel]; }
function fromClient(client: AdminClient): ClientUpsertRequest { return { id: client.id, name: client.name, email: client.email, mobileNumber: client.mobileNumber ?? '', assignedAdvisor: client.assignedAdvisor ?? '', status: client.status || 'ACTIVE', dateOfBirth: client.dateOfBirth ?? '', riskProfile: client.riskProfile ?? '', investmentGoal: client.investmentGoal ?? '', portfolioId: client.portfolioId ?? '', notes: client.notes ?? '', password: '' }; }
function errorMessage(error: unknown) { const queryError = error as FetchBaseQueryError; if (typeof queryError?.data === 'object' && queryError.data && 'error' in queryError.data) return String((queryError.data as { error: string }).error); return 'Please try again.'; }
