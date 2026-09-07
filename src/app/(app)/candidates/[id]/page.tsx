"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  FileText,
  Globe,
  GraduationCap,
  MapPin,
  Mail,
  Award,
  Phone,
  Printer,
  Trash2,
} from "lucide-react";
import type { ScreeningRecord, RecruiterNote, CandidateTag, Offer, OnboardingTask } from "@/lib/types";
import { useWorkspace, addNote, deleteNote, editNote, toggleNotePin, addTag, removeTag, setStatus, createOffer, updateOffer, deleteOffer, getOfferForCandidate, createOnboardingTask, updateOnboardingTask, deleteOnboardingTask, getOnboardingTasksForCandidate } from "@/lib/client/store";
import { useRole } from "@/lib/hooks/use-role";
import { ALL_STATUSES } from "@/lib/client/store";
import { Button, Card, CardContent, EmptyState } from "@/components/ui/primitives";
import { ScoreRing } from "@/components/ui/score-ring";
import {
  ScoreBreakdown,
  StrengthsGaps,
  EvidenceList,
  AIInsightCard,
  StatusBadge,
} from "@/components/candidate/match-views";
import { cn, formatDate, initialsOf, timeAgo } from "@/lib/utils";
import { exportCandidatePDF } from "@/lib/export-pdf";
import { InterviewScheduler } from "@/components/candidate/interview-scheduler";
import { TagManager } from "@/components/candidate/tag-manager";
import { RichNotes } from "@/components/candidate/rich-notes";
import { CandidateTimeline } from "@/components/candidate/timeline";
import { ScorecardDisplay } from "@/components/candidate/scorecard";
import { OfferTracker } from "@/components/candidate/offer-tracker";
import { OnboardingChecklist } from "@/components/candidate/onboarding-checklist";

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const ws = useWorkspace();
  const { isViewer } = useRole();
  const candidate = ws.candidates.find((c) => c.id === id);

  if (!candidate) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title="Candidate not found"
          description="This candidate may have been removed, or the link belongs to another browser workspace (data is stored locally)."
          action={<ButtonLink href="/candidates">Back to candidates</ButtonLink>}
        />
      </div>
    );
  }

  const r = candidate.resume;
  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/candidates"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" /> All candidates
      </Link>

      {/* Header */}
      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-brand-500/15 via-violet-500/10 to-emerald-500/10" />
        <CardContent className="-mt-10 flex flex-wrap items-end justify-between gap-4 pt-0">
          <div className="flex items-end gap-4">
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-brand-500 to-violet-600 text-xl font-bold text-white shadow-lg dark:border-slate-900">
              {initialsOf(r.name ?? candidate.fileName)}
            </span>
            <div className="pb-1">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {r.name ?? candidate.applicantName ?? "Unnamed candidate"}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                {(r.email || candidate.applicantEmail) && (
                  <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {r.email ?? candidate.applicantEmail}</span>
                )}
                {candidate.applicantPhone && (
                  <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {candidate.applicantPhone}</span>
                )}
                {r.location && (
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.location}</span>
                )}
                {typeof r.totalYearsExperience === "number" && (
                  <span>≈{r.totalYearsExperience} yrs experience</span>
                )}
                <span className="capitalize">{r.seniority ?? "mid"} level</span>
                {candidate.fileName && (
                  <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" /> {candidate.fileName}</span>
                )}
                {candidate.tags.some((t) => t.name === "Applied Online") && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 font-medium text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                    <Globe className="h-3 w-3" /> Applied online
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pb-1 no-print">
            {!isViewer ? (
              <select
                value={candidate.status}
                onChange={(e) => setStatus(candidate.id, e.target.value as (typeof ALL_STATUSES)[number])}
                aria-label="Pipeline status"
                className="focus-ring rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm capitalize dark:border-slate-700 dark:bg-slate-900"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium capitalize dark:border-slate-700 dark:bg-slate-800">
                {candidate.status}
              </span>
            )}
            <Button variant="outline" size="md" onClick={() => exportCandidatePDF(candidate, ws.jobs)}>
              <FileText className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="md" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Job switcher + detail */}
      {candidate.screenings.length > 0 && <CandidateBody candidateId={candidate.id} screenings={candidate.screenings} readonly={isViewer} />}
    </div>
  );
}

function ButtonLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="focus-ring inline-flex h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-medium text-white shadow-sm shadow-brand-600/25 transition-all hover:bg-brand-500 active:scale-[0.98]"
    >
      {children}
    </Link>
  );
}

function CandidateBody({ candidateId, screenings, readonly }: { candidateId: string; screenings: ScreeningRecord[]; readonly?: boolean }) {
  const ws = useWorkspace();
  const candidate = ws.candidates.find((c) => c.id === candidateId)!;
  const [activeJobId, setActiveJobId] = useState(screenings[0]?.jobId ?? "");
  const active = screenings.find((s) => s.jobId === activeJobId) ?? screenings[0];
  const r = candidate.resume;

  return (
    <>
      {screenings.length > 1 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {screenings.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveJobId(s.jobId)}
              className={cn(
                "focus-ring flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all",
                active.jobId === s.jobId
                  ? "border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-500/50 dark:bg-brand-950/50 dark:text-brand-300"
                  : "border-slate-200 hover:border-brand-300 dark:border-slate-800",
              )}
            >
              <ScoreRing score={s.match.overallScore} size={30} strokeWidth={4} label="" />
              <span className="font-medium">{s.jobTitle}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          <Card id="match">
            <CardContent className="pt-5">
              <div className="flex flex-wrap items-center gap-6">
                <ScoreRing score={active.match.overallScore} size={110} strokeWidth={11} />
                <div className="min-w-[220px] flex-1">
                  <p className="text-lg font-semibold">vs. {active.jobTitle}</p>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    Screened {formatDate(active.createdAt)} · deterministic score, explainable below
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {active.match.matchedSkills.slice(0, 8).map((s) => (
                      <span key={s} className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">✓ {s}</span>
                    ))}
                  </div>
                </div>
              </div>
              <h2 className="mb-4 mt-7 text-sm font-semibold uppercase tracking-wide text-slate-400">Score breakdown</h2>
              <ScoreBreakdown match={active.match} />
              <div className="mt-6">
                <StrengthsGaps match={active.match} />
              </div>
              {active.match.missingSkills.length > 0 && (
                <div className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <h4 className="mb-2 text-sm font-semibold">Missing requirements</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {active.match.missingSkills.map((s) => (
                      <span key={s} className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                        {s}
                      </span>
                    ))}
                    {active.match.skillGaps.preferred.slice(0, 4).map((s) => (
                      <span key={s} className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                        preferred: {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <AIInsightCard insight={active.aiInsight} error={active.aiError} />

          <Card>
            <CardContent className="pt-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Evidence from resume</h2>
              <EvidenceList match={active.match} />
            </CardContent>
          </Card>

          <NotesSection candidateId={candidate.id} notes={candidate.notes} readonly={readonly} />
        </div>

        {/* Side column */}
        <div className="space-y-5">
          {/* Tags */}
          <Card>
            <CardContent className="pt-5">
              <h3 className="mb-2 text-sm font-semibold">Tags</h3>
              <TagManager
                tags={candidate.tags}
                onAdd={(tag) => addTag(candidate.id, tag)}
                onRemove={(tagId) => removeTag(candidate.id, tagId)}
                readonly={readonly}
              />
            </CardContent>
          </Card>

          <InterviewScheduler candidate={candidate} readonly={readonly} />

          {/* Offer tracker - show for hired/shortlisted */}
          {(candidate.status === "hired" || candidate.status === "shortlisted" || candidate.status === "interview") && (
            <Card>
              <CardContent className="pt-5">
                <OfferTracker
                  offer={getOfferForCandidate(candidate.id)}
                  onSave={(o) => {
                    const existing = getOfferForCandidate(candidate.id);
                    if (existing) {
                      updateOffer({ ...existing, ...o });
                    } else {
                      createOffer({ ...o, candidateId: candidate.id, jobId: candidate.screenings[0]?.jobId ?? "" });
                    }
                  }}
                  onDelete={getOfferForCandidate(candidate.id) ? () => deleteOffer(getOfferForCandidate(candidate.id)!.id) : undefined}
                  readonly={readonly}
                />
              </CardContent>
            </Card>
          )}

          {/* Onboarding checklist - show for hired */}
          {candidate.status === "hired" && (
            <Card>
              <CardContent className="pt-5">
                <h3 className="mb-2 text-sm font-semibold">Onboarding</h3>
                <OnboardingChecklist
                  tasks={getOnboardingTasksForCandidate(candidate.id)}
                  onAdd={(t) => createOnboardingTask({ ...t, candidateId: candidate.id })}
                  onUpdate={(t) => updateOnboardingTask(t)}
                  onDelete={(id) => deleteOnboardingTask(id)}
                  readonly={readonly}
                />
              </CardContent>
            </Card>
          )}

          <ProfileSection resume={r} />

          {/* Timeline */}
          <Card>
            <CardContent className="pt-5">
              <h3 className="mb-3 text-sm font-semibold">Activity Timeline</h3>
              <CandidateTimeline candidate={candidate} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function ProfileSection({ resume }: { resume: ReturnType<typeof useWorkspace>["candidates"][number]["resume"] }) {
  return (
    <>
      <Card>
        <CardContent className="pt-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Briefcase className="h-4 w-4 text-brand-500" /> Experience
          </h2>
          {resume.experience.length ? (
            <ol className="relative space-y-5 border-l border-slate-200 pl-4 dark:border-slate-800">
              {resume.experience.map((e, i) => (
                <li key={i}>
                  <span className="absolute -left-[5px] mt-1.5 h-2 w-2 rounded-full bg-brand-500" />
                  <p className="text-sm font-semibold leading-snug">{e.title ?? "Role"}</p>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 dark:text-slate-400">
                    {e.company && (
                      <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" />{e.company}</span>
                    )}
                    {e.startDate && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {e.startDate} – {e.endDate ?? "?"}
                        {typeof e.durationMonths === "number" && ` (${(e.durationMonths / 12).toFixed(1)} yr)`}
                      </span>
                    )}
                  </p>
                  {!!e.highlights?.length && (
                    <ul className="mt-1 space-y-0.5">
                      {e.highlights.slice(0, 3).map((h, j) => (
                        <li key={j} className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">• {h}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No structured experience detected.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <GraduationCap className="h-4 w-4 text-violet-500" /> Education
          </h2>
          {resume.education.length ? (
            resume.education.map((e, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <p className="text-sm font-semibold capitalize">{e.level}{e.field ? ` · ${e.field}` : ""}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {[e.institution, e.graduationYear].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No education entries detected.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Award className="h-4 w-4 text-amber-500" /> Certifications
          </h2>
          {resume.certifications.length ? (
            resume.certifications.map((c, i) => (
              <p key={i} className="mb-1.5 text-sm">
                {c.name}
                {c.year ? <span className="ml-1.5 text-xs text-slate-400">{c.year}</span> : null}
              </p>
            ))
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">None detected.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <h2 className="mb-3 text-sm font-semibold">All skills ({resume.skills.length})</h2>
          <div className="flex flex-wrap gap-1.5">
            {resume.skills.map((s) => (
              <span key={s.name} className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs dark:border-slate-800">
                {s.name}
              </span>
            ))}
          </div>
          {resume.domains.length > 0 && (
            <p className="mt-3 text-xs text-slate-400">
              Industry domains: <span className="capitalize">{resume.domains.join(", ")}</span>
            </p>
          )}
          {!!resume.parseWarnings.length && (
            <p className="mt-3 text-[11px] leading-relaxed text-slate-400">Parsing notes: {resume.parseWarnings.join(" ")}</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function NotesSection({
  candidateId,
  notes,
  readonly,
}: {
  candidateId: string;
  notes: RecruiterNote[];
  readonly?: boolean;
}) {
  return (
    <Card className="no-print">
      <CardContent className="pt-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Recruiter notes</h2>
        <RichNotes
          notes={notes}
          onAdd={(text, type) => addNote(candidateId, text, type)}
          onEdit={(noteId, text) => editNote(candidateId, noteId, text)}
          onDelete={(noteId) => deleteNote(candidateId, noteId)}
          onTogglePin={(noteId) => toggleNotePin(candidateId, noteId)}
          readonly={readonly}
        />
      </CardContent>
    </Card>
  );
}
