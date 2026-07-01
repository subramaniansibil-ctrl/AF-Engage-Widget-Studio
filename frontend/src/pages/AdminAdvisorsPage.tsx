import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { Eye, Pencil, Plus, Search, UserRoundX, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useAppDispatch } from '../app/hooks';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { Skeleton } from '../components/ui/Skeleton';
import {
  useCreateAdminAdvisorMutation,
  useDeactivateAdminAdvisorMutation,
  useGetAdminAdvisorsQuery,
  useUpdateAdminAdvisorMutation,
  type AdminAdvisor,
  type AdvisorUpsertRequest,
} from '../features/admin/adminAdvisorsApi';
import { addToast } from '../features/ui/uiSlice';

type Panel = 'create' | 'edit' | 'view' | null;
const pageSize = 10;
const inputClass = 'min-h-10 w-full rounded-md border border-ink/12 bg-white/70 px-3 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-sage focus:ring-2 focus:ring-sage/15 dark:border-white/12 dark:bg-white/5 dark:text-white';
const emptyForm: AdvisorUpsertRequest = { id: '', name: '', email: '', status: 'ACTIVE', password: '' };

export function AdminAdvisorsPage() {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | 'ACTIVE' | 'INACTIVE'>('');
  const [page, setPage] = useState(1);
  const [panel, setPanel] = useState<Panel>(null);
  const [selected, setSelected] = useState<AdminAdvisor | null>(null);
  const [disableId, setDisableId] = useState<string | null>(null);
  const { data: advisorPage, isLoading, isFetching, error } = useGetAdminAdvisorsQuery({ search, status, page, pageSize });
  const [disableAdvisor, { isLoading: isDisabling }] = useDeactivateAdminAdvisorMutation();

  useEffect(() => setPage(1), [search, status]);
  const advisors = advisorPage?.items ?? [];
  const meta = advisorPage?.meta;

  function openPanel(next: Exclude<Panel, null>, advisor?: AdminAdvisor) {
    setSelected(advisor ?? null);
    setPanel(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function confirmDisable(id: string) {
    try {
      await disableAdvisor(id).unwrap();
      setDisableId(null);
      dispatch(addToast({ title: 'Advisor disabled', description: 'The advisor can no longer sign in.', variant: 'success' }));
    } catch (requestError) {
      dispatch(addToast({ title: 'Could not disable advisor', description: errorMessage(requestError), variant: 'error' }));
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-sage">Administration</p>
          <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Advisor management</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/62 dark:text-white/62">Create and maintain advisor access for client-facing widget workflows.</p>
        </div>
        <Button onClick={() => openPanel('create')}><Plus className="h-4 w-4" />Create advisor</Button>
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
          {panel === 'view' && selected ? <AdvisorView advisor={selected} onEdit={() => openPanel('edit', selected)} /> : <AdvisorForm advisor={panel === 'edit' ? selected : null} onDone={() => setPanel(null)} />}
        </section>
      )}

      <section className="space-y-3">
        <div className="grid gap-2 rounded-md border border-ink/10 bg-white/55 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 md:grid-cols-[minmax(240px,1fr)_170px]">
          <label className="relative">
            <span className="sr-only">Search advisors</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink/40" />
            <input className={`${inputClass} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email or advisor ID" />
          </label>
          <select aria-label="Filter by status" className={inputClass} value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {isLoading ? <AdvisorTableSkeleton /> : error ? <EmptyState title="Advisors could not be loaded" description={errorMessage(error)} /> : advisors.length === 0 ? (
          <EmptyState title="No advisors found" description="Adjust the filters or create the first advisor record." action={<Button onClick={() => openPanel('create')}><Plus className="h-4 w-4" />Create advisor</Button>} />
        ) : (
          <div className="overflow-hidden rounded-md border border-ink/10 bg-white/65 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="border-b border-ink/10 bg-ink/[0.025] text-xs font-semibold uppercase text-ink/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50">
                  <tr><th className="px-4 py-3">Advisor</th><th className="px-4 py-3">Advisor ID</th><th className="px-4 py-3">Clients</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-ink/8 dark:divide-white/8">
                  {advisors.map((advisor) => (
                    <tr key={advisor.id} className="transition hover:bg-sage/[0.045]">
                      <td className="px-4 py-3"><p className="font-semibold">{advisor.name}</p><p className="mt-0.5 text-xs text-ink/50 dark:text-white/50">{advisor.email}</p></td>
                      <td className="px-4 py-3 font-mono text-xs text-ink/65 dark:text-white/65">{advisor.id}</td>
                      <td className="px-4 py-3">{advisor.clientCount}</td>
                      <td className="px-4 py-3"><StatusBadge status={advisor.status} /></td>
                      <td className="px-4 py-3">
                        {disableId === advisor.id ? (
                          <div className="flex justify-end gap-2"><span className="self-center text-xs font-medium text-coral">Disable?</span><Button variant="secondary" onClick={() => setDisableId(null)}>Cancel</Button><Button disabled={isDisabling} onClick={() => confirmDisable(advisor.id)}>Confirm</Button></div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <IconButton label="View advisor" onClick={() => openPanel('view', advisor)}><Eye className="h-4 w-4" /></IconButton>
                            <IconButton label="Edit advisor" onClick={() => openPanel('edit', advisor)}><Pencil className="h-4 w-4" /></IconButton>
                            <IconButton label="Disable advisor" disabled={advisor.status === 'INACTIVE'} onClick={() => setDisableId(advisor.id)}><UserRoundX className="h-4 w-4" /></IconButton>
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
              itemLabel="advisor"
              isFetching={isFetching}
              onChange={setPage}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function AdvisorForm({ advisor, onDone }: { advisor: AdminAdvisor | null; onDone: () => void }) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<AdvisorUpsertRequest>(() => advisor ? fromAdvisor(advisor) : emptyForm);
  const [createAdvisor, createState] = useCreateAdminAdvisorMutation();
  const [updateAdvisor, updateState] = useUpdateAdminAdvisorMutation();
  const saving = createState.isLoading || updateState.isLoading;
  function set<K extends keyof AdvisorUpsertRequest>(field: K, value: AdvisorUpsertRequest[K]) { setForm((current) => ({ ...current, [field]: value })); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      if (advisor) await updateAdvisor({ id: advisor.id, body: form }).unwrap(); else await createAdvisor(form).unwrap();
      dispatch(addToast({ title: advisor ? 'Advisor updated' : 'Advisor created', description: `${form.name} is ready for advisor access.`, variant: 'success' }));
      onDone();
    } catch (requestError) {
      dispatch(addToast({ title: 'Advisor could not be saved', description: errorMessage(requestError), variant: 'error' }));
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Advisor name *"><input required className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Advisor ID *"><input required disabled={Boolean(advisor)} className={inputClass} value={form.id} onChange={(e) => set('id', e.target.value)} /></Field>
        <Field label="Email address *"><input required type="email" className={inputClass} value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Status *"><select required className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value as AdvisorUpsertRequest['status'])}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></Field>
        <Field label={advisor ? 'New password' : 'Password *'}><input required={!advisor} type="password" minLength={8} className={inputClass} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder={advisor ? 'Leave blank to keep current password' : ''} /></Field>
      </div>
      <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onDone}>Cancel</Button><Button disabled={saving} type="submit">{saving ? 'Saving...' : advisor ? 'Save changes' : 'Create advisor'}</Button></div>
    </form>
  );
}

function AdvisorView({ advisor, onEdit }: { advisor: AdminAdvisor; onEdit: () => void }) {
  const details = [['Advisor ID', advisor.id], ['Email', advisor.email], ['Status', advisor.status], ['Assigned clients', String(advisor.clientCount)], ['Created', advisor.createdAt ? new Date(advisor.createdAt).toLocaleString() : 'Not available']];
  return <div><div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">{details.map(([label, value]) => <div key={label}><p className="text-xs font-semibold uppercase text-ink/45 dark:text-white/45">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>)}</div><div className="mt-5 flex justify-end"><Button onClick={onEdit}><Pencil className="h-4 w-4" />Edit advisor</Button></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label><span className="mb-1.5 block text-xs font-semibold text-ink/60 dark:text-white/60">{label}</span>{children}</label>; }
function IconButton({ label, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) { return <button type="button" aria-label={label} title={label} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink/55 transition hover:bg-ink/5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 dark:text-white/55 dark:hover:bg-white/10 dark:hover:text-white" {...props}>{children}</button>; }
function StatusBadge({ status }: { status: string }) { return <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${status === 'ACTIVE' ? 'bg-sage/12 text-sage' : 'bg-ink/8 text-ink/55 dark:bg-white/10 dark:text-white/55'}`}>{status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>; }
function AdvisorTableSkeleton() { return <div className="space-y-2 rounded-md border border-ink/10 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-14" />)}</div>; }
function panelTitle(panel: Exclude<Panel, null>) { return ({ create: 'Create advisor', edit: 'Edit advisor', view: 'Advisor details' } as const)[panel]; }
function fromAdvisor(advisor: AdminAdvisor): AdvisorUpsertRequest { return { id: advisor.id, name: advisor.name, email: advisor.email, status: advisor.status, password: '' }; }
function errorMessage(error: unknown) { const queryError = error as FetchBaseQueryError; if (typeof queryError?.data === 'object' && queryError.data && 'error' in queryError.data) return String((queryError.data as { error: string }).error); return 'Please try again.'; }
