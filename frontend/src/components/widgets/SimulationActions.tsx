import { Download, RotateCcw, Save, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';

export const simulationNameExamples = ['Retirement Plan 2035', 'Early Retirement', 'Aggressive Investment'];
export function exportSimulationPdf() { window.print(); }

export function SimulationSaveDialog({ open, saving, onClose, onSave }: { open: boolean; saving: boolean; onClose: () => void; onSave: (name: string) => Promise<void> }) {
  const [name, setName] = useState('');
  if (!open) return null;
  async function save() {
    if (name.trim().length < 2) return;
    try {
      await onSave(name.trim());
      setName('');
      onClose();
    } catch {
      // Keep the shared dialog open so either role can retry after an API error.
    }
  }
  return <section role="dialog" aria-modal="false" aria-labelledby="save-simulation-title" className="rounded-md border border-sage/25 bg-white/80 p-5 shadow-panel backdrop-blur-xl dark:border-sage/25 dark:bg-ink/90 print:hidden"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-md bg-sage/10 text-sage"><Sparkles className="h-5 w-5" /></span><div className="flex-1"><h3 id="save-simulation-title" className="font-semibold">Name this simulation</h3><p className="mt-1 text-sm text-ink/55 dark:text-white/55">Use a memorable name so it is easy to revisit and compare.</p><input autoFocus aria-label="Simulation name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Early Retirement" className="mt-4 min-h-11 w-full max-w-xl rounded-md border border-ink/12 bg-white px-3 text-sm outline-none focus:border-sage dark:border-white/12 dark:bg-white/5" /><div className="mt-3 flex flex-wrap gap-2">{simulationNameExamples.map((example) => <button key={example} type="button" onClick={() => setName(example)} className="rounded-md border border-ink/10 px-2.5 py-1.5 text-xs text-ink/60 hover:border-sage/30 hover:text-sage dark:border-white/10 dark:text-white/60">{example}</button>)}</div><div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button><Button onClick={save} disabled={saving || name.trim().length < 2}>{saving ? 'Saving…' : 'Save Simulation'}</Button></div></div></div></section>;
}

export function SimulationWorkflowActions({ canSave, saving, updating, activeName, onExport, onSaveAsNew, onUpdate, onReset }: { canSave: boolean; saving: boolean; updating: boolean; activeName?: string; onExport: () => void; onSaveAsNew: (name: string) => Promise<void>; onUpdate: () => Promise<void>; onReset: () => void }) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const busy = saving || updating;
  return <section className="rounded-xl border border-ink/10 bg-white/90 p-4 shadow-[0_8px_24px_rgba(6,38,61,0.06)] dark:border-white/10 dark:bg-white/5 print:hidden sm:p-5" aria-label="Simulation actions">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>{activeName ? <><p className="text-xs font-semibold uppercase text-sage">Editing saved simulation</p><p className="mt-1 font-semibold">{activeName}</p></> : <><p className="font-semibold">Current simulation</p><p className="mt-1 text-xs text-ink/50 dark:text-white/50">Adjust the values, then save when the scenario is ready.</p></>}</div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onExport}><Download className="h-4 w-4" />Export PDF</Button>
        <Button variant="secondary" onClick={() => setResetOpen(true)}><RotateCcw className="h-4 w-4" />Reset</Button>
        {activeName && <Button variant="secondary" onClick={() => setSaveOpen(true)} disabled={!canSave || busy}>Save as new</Button>}
        <Button onClick={() => activeName ? onUpdate() : setSaveOpen(true)} disabled={!canSave || busy}><Save className="h-4 w-4" />{updating ? 'Saving changes…' : activeName ? 'Save changes' : 'Save Simulation'}</Button>
      </div>
    </div>
    <div className="mt-4"><SimulationSaveDialog open={saveOpen} saving={saving} onClose={() => setSaveOpen(false)} onSave={onSaveAsNew} /></div>
    {resetOpen && <div role="alertdialog" aria-modal="false" aria-labelledby="reset-simulation-title" className="mt-4 rounded-md border border-coral/25 bg-coral/5 p-4"><h3 id="reset-simulation-title" className="font-semibold">Reset unsaved changes?</h3><p className="mt-1 text-sm text-ink/55 dark:text-white/55">This restores the original assigned-widget values.</p><div className="mt-3 flex justify-end gap-2"><Button variant="secondary" onClick={() => setResetOpen(false)}>Keep changes</Button><Button onClick={() => { onReset(); setResetOpen(false); }}>Reset simulation</Button></div></div>}
  </section>;
}

export function SimulationPrintReport({ clientName, clientEmail, advisorName, widgetName, simulationName, values }: { clientName: string; clientEmail: string; advisorName: string; widgetName: string; simulationName?: string; values: Record<string, string> }) {
  return <section className="hidden print:block print:space-y-3">
    <h1 className="text-2xl font-bold">{widgetName}</h1>
    <p><strong>Client:</strong> {clientName}</p>
    <p><strong>Email:</strong> {clientEmail}</p>
    <p><strong>Advisor:</strong> {advisorName}</p>
    <p><strong>Selected simulation:</strong> {simulationName || 'Current simulation'}</p>
    <p><strong>Generated:</strong> {new Date().toLocaleString()}</p>
    <div><h2 className="font-semibold">Selected scenario values</h2><dl className="mt-2 grid grid-cols-2 gap-2">{Object.entries(values).map(([key, value]) => <div key={key}><dt className="text-xs text-ink/55">{humanize(key)}</dt><dd className="font-medium">{value}</dd></div>)}</dl></div>
  </section>;
}

function humanize(value: string) { return value.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (letter) => letter.toUpperCase()); }
