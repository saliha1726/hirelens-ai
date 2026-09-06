"use client";

import { useState } from "react";
import { DollarSign, Calendar, FileText, Edit3, Check, X, Plus } from "lucide-react";
import type { Offer, OfferStatus } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const STATUSES: { value: OfferStatus; label: string; color: string }[] = [
  { value: "draft", label: "Draft", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  { value: "sent", label: "Sent", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" },
  { value: "accepted", label: "Accepted", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" },
  { value: "declined", label: "Declined", color: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300" },
  { value: "expired", label: "Expired", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" },
  { value: "rescinded", label: "Rescinded", color: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "PKR", "INR", "CAD", "AUD"];

export function OfferTracker({
  offer,
  onSave,
  onDelete,
  readonly,
}: {
  offer?: Offer;
  onSave: (offer: Omit<Offer, "id" | "createdAt" | "updatedAt">) => void;
  onDelete?: () => void;
  readonly?: boolean;
}) {
  const [editing, setEditing] = useState(!offer);
  const [status, setStatus] = useState<OfferStatus>(offer?.status ?? "draft");
  const [salary, setSalary] = useState(offer?.salary?.toString() ?? "");
  const [currency, setCurrency] = useState(offer?.currency ?? "USD");
  const [offerDate, setOfferDate] = useState(offer?.offerDate ?? new Date().toISOString().slice(0, 10));
  const [startDate, setStartDate] = useState(offer?.expectedStartDate ?? "");
  const [notes, setNotes] = useState(offer?.notes ?? "");

  function handleSave() {
    onSave({
      candidateId: offer?.candidateId ?? "",
      jobId: offer?.jobId ?? "",
      status,
      salary: salary ? Number(salary) : undefined,
      currency,
      offerDate,
      expectedStartDate: startDate || undefined,
      notes: notes.trim() || undefined,
    });
    setEditing(false);
  }

  if (readonly && !offer) return null;

  if (!editing && offer) {
    const statusInfo = STATUSES.find((s) => s.value === offer.status) ?? STATUSES[0];
    return (
      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold">Offer Details</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", statusInfo.color)}>
              {statusInfo.label}
            </span>
            {!readonly && (
              <>
                <button onClick={() => setEditing(true)} className="rounded-lg p-1 text-slate-400 hover:text-blue-500">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                {onDelete && (
                  <button onClick={onDelete} className="rounded-lg p-1 text-slate-400 hover:text-rose-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          {offer.salary && (
            <div>
              <p className="text-[10px] text-slate-400">Salary</p>
              <p className="font-semibold">{offer.currency} {offer.salary.toLocaleString()}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] text-slate-400">Offer Date</p>
            <p className="font-medium">{formatDate(offer.offerDate)}</p>
          </div>
          {offer.expectedStartDate && (
            <div>
              <p className="text-[10px] text-slate-400">Start Date</p>
              <p className="font-medium">{formatDate(offer.expectedStartDate)}</p>
            </div>
          )}
        </div>
        {offer.notes && (
          <p className="mt-2 text-xs text-slate-500 italic">{offer.notes}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50/30 p-4 dark:border-brand-800 dark:bg-brand-950/20">
      <h3 className="mb-3 text-sm font-semibold">{offer ? "Edit Offer" : "Create Offer"}</h3>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as OfferStatus)} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Salary</label>
            <div className="flex gap-1.5">
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="0" className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Offer Date</label>
            <input type="date" value={offerDate} onChange={(e) => setOfferDate(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Expected Start</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900" />
        </div>
        <div className="flex justify-end gap-2">
          {offer && <button onClick={() => setEditing(false)} className="rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700">Cancel</button>}
          <button onClick={handleSave} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">
            {offer ? "Update" : "Create offer"}
          </button>
        </div>
      </div>
    </div>
  );
}
