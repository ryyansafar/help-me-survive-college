'use client';

import { useState, useEffect, useRef } from 'react';
import { cgpaGradeLabel, calculateCGPA } from '@/lib/calculators/cgpa';
import type { CGPAEntry, CGPASubjectSetup } from '@/lib/types';
import { revealElement } from '@/lib/dom/revealElement';
import { useAppHaptics } from '@/lib/hooks/useAppHaptics';
import { createId } from '@/lib/utils/createId';

const HELP_KEY = 'grade-calc-help-state';
type Mode = 'semester' | 'subject';

export default function CGPACalculator() {
  const haptics = useAppHaptics();
  const [mode, setMode] = useState<Mode>('semester');
  const [entries, setEntries] = useState<CGPAEntry[]>([]);
  const [subjectSetup, setSubjectSetup] = useState<CGPASubjectSetup | null>(null);
  const [currentSubjects, setCurrentSubjects] = useState<CGPAEntry[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);

  // Semester form
  const [semName, setSemName] = useState('');
  const [sgpa, setSgpa] = useState('');
  const [semCredits, setSemCredits] = useState('');

  // Subject setup
  const [prevCGPA, setPrevCGPA] = useState('');
  const [prevCredits, setPrevCredits] = useState('');
  const [numSubjects, setNumSubjects] = useState('');
  const [autoFillMsg, setAutoFillMsg] = useState('');

  // Subject entry
  const [subName, setSubName] = useState('');
  const [subGP, setSubGP] = useState('');
  const [subCredits, setSubCredits] = useState('');

  const panelRef = useRef<HTMLDivElement>(null);
  const semNameInputRef = useRef<HTMLInputElement>(null);
  const sgpaInputRef = useRef<HTMLInputElement>(null);
  const semCreditsInputRef = useRef<HTMLInputElement>(null);
  const prevCGPAInputRef = useRef<HTMLInputElement>(null);
  const prevCreditsInputRef = useRef<HTMLInputElement>(null);
  const numSubjectsInputRef = useRef<HTMLInputElement>(null);
  const subNameInputRef = useRef<HTMLInputElement>(null);
  const subGPInputRef = useRef<HTMLInputElement>(null);
  const subCreditsInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HELP_KEY) || '{}');
      if (typeof saved.cgpa === 'boolean') setHelpOpen(saved.cgpa);
    } catch {}
  }, []);

  const showValidationError = (message: string) => {
    haptics.error();
    alert(message);
  };

  const toggleHelp = () => {
    const next = !helpOpen;
    setHelpOpen(next);
    try {
      const saved = JSON.parse(localStorage.getItem(HELP_KEY) || '{}');
      localStorage.setItem(HELP_KEY, JSON.stringify({ ...saved, cgpa: next }));
    } catch {}
    haptics.light();
  };

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (helpOpen) {
      el.hidden = false;
      el.style.maxHeight = '0px';
      el.offsetHeight;
      el.style.maxHeight = `${el.scrollHeight}px`;
      const tid = setTimeout(() => { el.style.maxHeight = 'none'; }, 300);
      return () => clearTimeout(tid);
    } else {
      el.style.maxHeight = `${el.scrollHeight}px`;
      el.offsetHeight;
      el.style.maxHeight = '0px';
      const tid = setTimeout(() => { el.hidden = true; }, 300);
      return () => clearTimeout(tid);
    }
  }, [helpOpen]);

  // Auto-fill subject setup from semester entries
  const populateSubjectSetup = (entriesSnapshot: CGPAEntry[]) => {
    if (entriesSnapshot.length > 0) {
      const { cgpa, totalCredits } = calculateCGPA(entriesSnapshot);
      setPrevCGPA(cgpa.toFixed(2));
      setPrevCredits(String(totalCredits));
      const names = entriesSnapshot.map((e) => e.label).join(', ');
      setAutoFillMsg(
        `↑ auto-filled from your semester data (${names}) — cgpa: ${cgpa.toFixed(2)}, total credits: ${totalCredits}. just add the subject count below and hit let's go.`
      );
    } else {
      setPrevCGPA('');
      setPrevCredits('');
      setAutoFillMsg('');
    }
  };

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    haptics.selection();
    if (m === 'subject') populateSubjectSetup(entries);
  };

  // Semester mode actions
  const addSemester = () => {
    const n = (semNameInputRef.current?.value ?? semName).trim();
    const gp = parseFloat(sgpaInputRef.current?.value ?? sgpa);
    const cr = parseFloat(semCreditsInputRef.current?.value ?? semCredits);
    if (!n || isNaN(gp) || isNaN(cr)) {
      showValidationError('fill all the fields bro');
      return;
    }
    if (gp < 0 || gp > 10) {
      showValidationError('sgpa has to be between 0 and 10. are you okay?');
      return;
    }
    if (cr <= 0) {
      showValidationError('credits cant be zero or negative lol');
      return;
    }
    setEntries((prev) => [...prev, { id: createId(), label: n, gp, credits: cr }]);
    setSemName('');
    setSgpa('');
    setSemCredits('');
    haptics.success();
    revealElement('cgpa-semester-results');
  };

  const deleteSemEntry = (id: string) => {
    haptics.warning();
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateSemEntry = (id: string, field: 'gp' | 'credits', value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, [field]: num } : e));
  };

  // Subject mode — setup step
  const startSubjectMode = () => {
    const pc = parseFloat(prevCGPAInputRef.current?.value ?? prevCGPA) || 0;
    const pcr = parseFloat(prevCreditsInputRef.current?.value ?? prevCredits) || 0;
    const ns = parseInt(numSubjectsInputRef.current?.value ?? numSubjects);
    if (isNaN(ns) || ns <= 0) {
      showValidationError('how many subjects this sem bro?');
      return;
    }
    if (pc < 0 || pc > 10) {
      showValidationError('that cgpa doesnt look right lol');
      return;
    }
    if (pcr < 0) {
      showValidationError('credits cant be negative');
      return;
    }
    if (pc > 0 && pcr === 0) {
      showValidationError('if you have a cgpa, you must have some credits too. put the total credits from all previous sems');
      return;
    }
    setSubjectSetup({ prevCGPA: pc, prevCredits: pcr, totalSubjects: ns });
    setCurrentSubjects([]);
    haptics.medium();
  };

  const addSubject = () => {
    if (!subjectSetup) return;
    if (currentSubjects.length >= subjectSetup.totalSubjects) {
      showValidationError('you already added all the subjects! hit "change setup" if you made a mistake');
      return;
    }
    const n = (subNameInputRef.current?.value ?? subName).trim();
    const gp = parseFloat(subGPInputRef.current?.value ?? subGP);
    const cr = parseFloat(subCreditsInputRef.current?.value ?? subCredits);
    if (!n || isNaN(gp) || isNaN(cr)) {
      showValidationError('fill all the fields bro');
      return;
    }
    if (gp < 0 || gp > 10) {
      showValidationError('grade point has to be between 0 and 10. are you okay?');
      return;
    }
    if (cr <= 0) {
      showValidationError('credits cant be zero or negative lol');
      return;
    }
    setCurrentSubjects((prev) => [...prev, { id: createId(), label: n, gp, credits: cr }]);
    setSubName('');
    setSubGP('');
    setSubCredits('');
    haptics.success();
    revealElement('cgpa-subject-results');
  };

  const deleteSubject = (id: string) => {
    haptics.warning();
    setCurrentSubjects((prev) => prev.filter((e) => e.id !== id));
  };

  const updateSubject = (id: string, field: 'gp' | 'credits', value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setCurrentSubjects((prev) => prev.map((e) => e.id === id ? { ...e, [field]: num } : e));
  };

  const resetSubjectMode = () => {
    haptics.selection();
    setSubjectSetup(null);
    setCurrentSubjects([]);
    populateSubjectSetup(entries);
  };

  // Compute CGPA for display
  let cgpaResult: { cgpa: number; totalCredits: number; weightedSum: number } | null = null;
  let isComplete = false;

  if (mode === 'semester' && entries.length > 0) {
    cgpaResult = calculateCGPA(entries);
    isComplete = true;
  } else if (mode === 'subject' && subjectSetup && currentSubjects.length > 0) {
    const { prevCGPA: pc, prevCredits: pcr, totalSubjects } = subjectSetup;
    isComplete = currentSubjects.length === totalSubjects;
    const prevW = pc * pcr;
    const semCGPA = calculateCGPA(currentSubjects);
    cgpaResult = {
      cgpa: (pcr + semCGPA.totalCredits) > 0
        ? (prevW + semCGPA.weightedSum) / (pcr + semCGPA.totalCredits)
        : 0,
      totalCredits: pcr + semCGPA.totalCredits,
      weightedSum: prevW + semCGPA.weightedSum,
    };
  }

  const progressMsg = subjectSetup
    ? currentSubjects.length === 0
      ? `0 / ${subjectSetup.totalSubjects} subjects added. start adding below →`
      : currentSubjects.length < subjectSetup.totalSubjects
        ? `${currentSubjects.length} / ${subjectSetup.totalSubjects} done. ${subjectSetup.totalSubjects - currentSubjects.length} more to go.`
        : `all ${subjectSetup.totalSubjects} done! scroll down to see your cgpa ↓`
    : '';

  return (
    <div>
      <div className="add-section add-section--cgpa">
        <div className="section-toolbar">
          <span className="section-help-status">{helpOpen ? 'tips visible' : 'tips hidden'}</span>
          <button type="button" className={`btn-help${helpOpen ? ' is-open' : ''}`}
            aria-expanded={helpOpen} onClick={toggleHelp}>
            {helpOpen ? 'hide help' : '? help me'}
          </button>
        </div>

        <div ref={panelRef} className={`help-panel${helpOpen ? ' is-open' : ''}`} hidden={!helpOpen}>
          <div className="help-panel-title">help loaded</div>
          <div className="help-block">
            <div className="help-block-title">cgpa basics</div>
            <ul className="help-list">
              <li className="help-line"><strong>what even is cgpa?</strong> it&apos;s just a weighted average of all your grade points, weighted by credits. nothing magical.</li>
              <li className="help-line"><strong>grade point lookup:</strong> S = 10 · A+ = 9 · A = 8.5 · B+ = 8 · B = 7.5 · C+ = 7 · C = 6.5 · D = 6 · P = 5.5</li>
              <li className="help-line"><strong>credits:</strong> the number next to each subject in your syllabus. theory = 3 or 4, labs = 1 or 2. check RSMS.</li>
              <li className="help-line"><strong>sgpa:</strong> your semester GPA. it&apos;s on your grade card or RSMS results page.</li>
            </ul>
          </div>
          <div className="help-block">
            <div className="help-block-title">recommended flow</div>
            <ul className="help-list">
              <li className="help-line"><strong>step 1:</strong> click <strong>by semester</strong>. add each completed semester with its SGPA and total credits.</li>
              <li className="help-line"><strong>step 2:</strong> click <strong>by subject</strong>. your previous CGPA and total credits auto-fill from step 1.</li>
              <li className="help-line"><strong>step 3:</strong> enter how many subjects you have this semester, then hit <strong>let&apos;s go</strong>.</li>
              <li className="help-line"><strong>step 4:</strong> add each subject one by one with name, grade point, and credits.</li>
              <li className="help-line"><strong>step 5:</strong> once all subjects are entered, the updated CGPA appears fully.</li>
              <li className="help-line"><strong>first semester?</strong> skip step 1, go straight to <strong>by subject</strong>, and use 0 for previous CGPA and previous credits.</li>
            </ul>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="preset-buttons">
          <button className="btn-preset"
            style={mode === 'semester' ? { borderColor: '#ffaa00', color: '#ffaa00' } : {}}
            onClick={() => switchMode('semester')}>
            by semester (recommended)
          </button>
          <button className="btn-preset"
            style={mode === 'subject' ? { borderColor: '#ffaa00', color: '#ffaa00' } : {}}
            onClick={() => switchMode('subject')}>
            by subject (tedious)
          </button>
        </div>

        {/* Semester form */}
        {mode === 'semester' && (
          <div>
            <div style={{ fontFamily: 'var(--font-jetbrains-mono,monospace)', fontSize: 13, color: '#555', marginBottom: 12 }}>
              → find your SGPA on your grade card or RSMS portal. one row per semester, that&apos;s it.
            </div>
            <div className="form-grid form-grid--4">
              <div className="field">
                <label>semester (e.g. S3, S5)</label>
                    <input ref={semNameInputRef} type="text" value={semName} onChange={(e) => setSemName(e.target.value)}
                      placeholder="S3" onKeyDown={(e) => e.key === 'Enter' && addSemester()} />
                  </div>
                  <div className="field">
                    <label>sgpa (from grade card)</label>
                    <input ref={sgpaInputRef} type="number" value={sgpa} onChange={(e) => setSgpa(e.target.value)}
                      placeholder="7.8" step="0.01" min="0" max="10" onKeyDown={(e) => e.key === 'Enter' && addSemester()} />
                  </div>
                  <div className="field">
                    <label>total credits that sem</label>
                    <input ref={semCreditsInputRef} type="number" value={semCredits} onChange={(e) => setSemCredits(e.target.value)}
                      placeholder="22" onKeyDown={(e) => e.key === 'Enter' && addSemester()} />
                  </div>
                  <div className="field">
                    <label>&nbsp;</label>
                    <button type="button" className="btn-add" style={{ background: '#ffaa00', color: '#0a0a0a' }} onClick={addSemester}>
                      add sem
                    </button>
                  </div>
            </div>
          </div>
        )}

        {/* Subject mode */}
        {mode === 'subject' && (
          <div>
            {/* Setup step */}
            {!subjectSetup && (
              <div>
                {autoFillMsg && (
                  <div style={{ fontFamily: 'var(--font-jetbrains-mono,monospace)', fontSize: 13, color: '#00ffff', background: '#001a1a', border: '1px solid #003333', padding: '10px 14px', marginBottom: 12, lineHeight: 1.6 }}>
                    {autoFillMsg}
                  </div>
                )}
                {!autoFillMsg && (
                  <div style={{ fontFamily: 'var(--font-jetbrains-mono,monospace)', fontSize: 13, color: '#555', marginBottom: 12 }}>
                    → tell us where you currently stand. just three fields and you&apos;re in.
                  </div>
                )}
                <div className="form-grid form-grid--setup">
                  <div className="field">
                    <label>your cgpa so far (put 0 if s1/s2)</label>
                    <input ref={prevCGPAInputRef} type="number" value={prevCGPA} onChange={(e) => setPrevCGPA(e.target.value)}
                      placeholder="7.5" step="0.01" min="0" max="10" />
                  </div>
                  <div className="field">
                    <label>total credits earned so far (0 if s1/s2)</label>
                    <input ref={prevCreditsInputRef} type="number" value={prevCredits} onChange={(e) => setPrevCredits(e.target.value)}
                      placeholder="80" min="0" />
                  </div>
                  <div className="field">
                    <label>how many subjects this sem?</label>
                    <input ref={numSubjectsInputRef} type="number" value={numSubjects} onChange={(e) => setNumSubjects(e.target.value)}
                      placeholder="6" min="1" max="20" onKeyDown={(e) => e.key === 'Enter' && startSubjectMode()} />
                  </div>
                  <div className="field">
                    <label>&nbsp;</label>
                    <button type="button" className="btn-add" style={{ background: '#ffaa00', color: '#0a0a0a' }} onClick={startSubjectMode}>
                      let&apos;s go →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Entry step */}
            {subjectSetup && (
              <div>
                <div style={{ fontFamily: 'var(--font-jetbrains-mono,monospace)', fontSize: 14, color: '#ffaa00', padding: '10px 0', marginBottom: 12, borderBottom: '1px solid #1a1a1a' }}>
                  {progressMsg}
                </div>
                <div className="form-grid form-grid--4">
                  <div className="field">
                    <label>subject name</label>
                    <input ref={subNameInputRef} type="text" value={subName} onChange={(e) => setSubName(e.target.value)}
                      placeholder="Signals & Systems" onKeyDown={(e) => e.key === 'Enter' && addSubject()} />
                  </div>
                  <div className="field">
                    <label>grade point</label>
                    <input ref={subGPInputRef} type="number" value={subGP} onChange={(e) => setSubGP(e.target.value)}
                      placeholder="8.5" step="0.5" min="0" max="10" onKeyDown={(e) => e.key === 'Enter' && addSubject()} />
                  </div>
                  <div className="field">
                    <label>credits</label>
                    <input ref={subCreditsInputRef} type="number" value={subCredits} onChange={(e) => setSubCredits(e.target.value)}
                      placeholder="4" onKeyDown={(e) => e.key === 'Enter' && addSubject()} />
                  </div>
                  <div className="field">
                    <label>&nbsp;</label>
                    <button type="button" className="btn-add" style={{ background: '#ffaa00', color: '#0a0a0a' }}
                      disabled={currentSubjects.length >= subjectSetup.totalSubjects}
                      onClick={addSubject}>
                      add
                    </button>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-jetbrains-mono,monospace)', fontSize: 13, color: '#555', marginTop: 10, letterSpacing: '0.5px' }}>
                  S = 10 &nbsp;·&nbsp; A+ = 9 &nbsp;·&nbsp; A = 8.5 &nbsp;·&nbsp; B+ = 8 &nbsp;·&nbsp; B = 7.5 &nbsp;·&nbsp; C+ = 7 &nbsp;·&nbsp; C = 6.5 &nbsp;·&nbsp; D = 6 &nbsp;·&nbsp; P = 5.5
                </div>
                <button className="btn-preset" style={{ marginTop: 12 }} onClick={resetSubjectMode}>
                  ← change setup
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CGPA Result Banner */}
      {cgpaResult && (
        <div className={`cgpa-overview${isComplete ? '' : ' is-pending'}`}>
          <div className="cgpa-overview-kicker">your cgpa (so far):</div>
          <div className="cgpa-overview-main">
            <span className="cgpa-overview-value">
              {isComplete ? cgpaResult.cgpa.toFixed(2) : '...'}
            </span>
            <span className="cgpa-overview-caption">
              {isComplete ? cgpaGradeLabel(cgpaResult.cgpa) : 'add all subjects first'}
            </span>
          </div>
          <div className="cgpa-overview-stats">
            <div className="cgpa-overview-stat">
              <span>credits counted</span>
              <strong>{cgpaResult.totalCredits}</strong>
            </div>
            <div className="cgpa-overview-stat">
              <span>sems / subjects</span>
              <strong>
                {mode === 'semester'
                  ? `${entries.length} sem(s)`
                  : subjectSetup
                    ? `${currentSubjects.length} / ${subjectSetup.totalSubjects} subjects`
                    : '0'}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Entries table */}
      <div className="subjects-grid">
        {mode === 'semester' && entries.length === 0 && (
          <div className="empty-state">nothing here yet. add a semester up there and watch the magic happen.</div>
        )}
        {mode === 'semester' && entries.length > 0 && (
          <SemesterTable
            entries={entries}
            cgpaResult={cgpaResult!}
            onDelete={deleteSemEntry}
            onUpdate={updateSemEntry}
          />
        )}
        {mode === 'subject' && (!subjectSetup || currentSubjects.length === 0) && (
          <div className="empty-state">nothing here yet. fill in the setup above first.</div>
        )}
        {mode === 'subject' && subjectSetup && currentSubjects.length > 0 && (
          <SubjectTable
            setup={subjectSetup}
            subjects={currentSubjects}
            isComplete={isComplete}
            onDelete={deleteSubject}
            onUpdate={updateSubject}
          />
        )}
      </div>
    </div>
  );
}

function SemesterTable({
  entries,
  cgpaResult,
  onDelete,
  onUpdate,
}: {
  entries: CGPAEntry[];
  cgpaResult: { cgpa: number; totalCredits: number; weightedSum: number };
  onDelete: (id: string) => void;
  onUpdate: (id: string, field: 'gp' | 'credits', value: string) => void;
}) {
  return (
    <div className="subject" id="cgpa-semester-results" style={{ borderLeftColor: '#ffaa00' }}>
      <div className="subject-top">
        <div>
          <div className="subject-name" style={{ color: '#ffaa00' }}>semesters</div>
          <div className="subject-caption">tap any number below to fix it.</div>
        </div>
      </div>
      <div className="grades-table grades-table--cgpa">
        <table className="cgpa-table">
          <thead>
            <tr>
              <th>semester</th>
              <th>sgpa</th>
              <th>credits</th>
              <th>sgpa × credits</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, index) => (
              <tr key={e.id} className="cgpa-entry-row">
                <td data-label="semester" className="cgpa-table-title-cell">
                  <span className="cgpa-entry-label">{e.label}</span>
                </td>
                <td data-label="sgpa">
                  <input type="number" className="cgpa-edit-input" defaultValue={e.gp.toFixed(2)}
                    step="0.01" min="0" max="10"
                    onChange={(ev) => onUpdate(e.id, 'gp', ev.target.value)} title="edit sgpa" />
                </td>
                <td data-label="credits">
                  <input type="number" className="cgpa-edit-input" defaultValue={e.credits}
                    step="0.5" min="0.5"
                    onChange={(ev) => onUpdate(e.id, 'credits', ev.target.value)} title="edit credits" />
                </td>
                <td data-label="sgpa x credits" className="cgpa-cell-muted">{(e.gp * e.credits).toFixed(2)}</td>
                <td data-label="action"><button className="btn-delete" onClick={() => onDelete(e.id)}>delete</button></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="cgpa-summary-row">
              <td data-label="summary" className="cgpa-table-title-cell">
                <span className="cgpa-entry-label cgpa-entry-label--summary">cgpa</span>
              </td>
              <td data-label="cgpa"><span className="cgpa-value-highlight">{cgpaResult.cgpa.toFixed(2)}</span></td>
              <td data-label="credits" className="cgpa-value-default">{cgpaResult.totalCredits}</td>
              <td data-label="weighted" className="cgpa-cell-muted">{cgpaResult.weightedSum.toFixed(2)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function SubjectTable({
  setup,
  subjects,
  isComplete,
  onDelete,
  onUpdate,
}: {
  setup: CGPASubjectSetup;
  subjects: CGPAEntry[];
  isComplete: boolean;
  onDelete: (id: string) => void;
  onUpdate: (id: string, field: 'gp' | 'credits', value: string) => void;
}) {
  const { prevCGPA, prevCredits, totalSubjects } = setup;
  const prevW = prevCGPA * prevCredits;
  const semData = calculateCGPA(subjects);
  const totalCredits = prevCredits + semData.totalCredits;
  const totalWeighted = prevW + semData.weightedSum;
  const cgpa = totalCredits > 0 ? totalWeighted / totalCredits : 0;

  return (
    <div className="subject" id="cgpa-subject-results" style={{ borderLeftColor: isComplete ? '#ffaa00' : '#333' }}>
      <div className="subject-top">
        <div>
          <div className="subject-name" style={{ color: isComplete ? '#ffaa00' : '#666' }}>
            {isComplete ? 'this semester - all done ✓' : `this semester - ${subjects.length} / ${totalSubjects} added`}
          </div>
          <div className="subject-caption">every subject stays editable down here.</div>
        </div>
      </div>
      <div className="grades-table grades-table--cgpa">
        <table className="cgpa-table">
          <thead>
            <tr>
              <th>subject</th>
              <th>grade point</th>
              <th>credits</th>
              <th>gp × credits</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {prevCredits > 0 && (
              <tr className="cgpa-base-row">
                <td data-label="base" className="cgpa-table-title-cell">
                  <span className="cgpa-entry-label cgpa-entry-label--base">previous sems (base)</span>
                </td>
                <td data-label="cgpa" className="cgpa-cell-muted">{prevCGPA.toFixed(2)}</td>
                <td data-label="credits" className="cgpa-cell-muted">{prevCredits}</td>
                <td data-label="weighted" className="cgpa-cell-muted">{prevW.toFixed(2)}</td>
                <td />
              </tr>
            )}
            {subjects.map((e) => (
              <tr key={e.id} className="cgpa-entry-row">
                <td data-label="subject" className="cgpa-table-title-cell">
                  <span className="cgpa-entry-label">{e.label}</span>
                </td>
                <td data-label="grade point">
                  <input type="number" className="cgpa-edit-input" defaultValue={e.gp.toFixed(2)}
                    step="0.5" min="0" max="10"
                    onChange={(ev) => onUpdate(e.id, 'gp', ev.target.value)} title="edit grade point" />
                </td>
                <td data-label="credits">
                  <input type="number" className="cgpa-edit-input" defaultValue={e.credits}
                    step="0.5" min="0.5"
                    onChange={(ev) => onUpdate(e.id, 'credits', ev.target.value)} title="edit credits" />
                </td>
                <td data-label="gp x credits" className="cgpa-cell-muted">{(e.gp * e.credits).toFixed(2)}</td>
                <td data-label="action"><button className="btn-delete" onClick={() => onDelete(e.id)}>delete</button></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="cgpa-summary-row">
              <td data-label="summary" className="cgpa-table-title-cell">
                <span className="cgpa-entry-label cgpa-entry-label--summary">updated cgpa</span>
              </td>
              <td data-label="cgpa">
                <span className={isComplete ? 'cgpa-value-highlight' : 'cgpa-cell-muted'}>
                  {isComplete ? cgpa.toFixed(2) : '?'}
                </span>
              </td>
              <td data-label="credits" className="cgpa-value-default">{totalCredits}</td>
              <td data-label="weighted" className="cgpa-cell-muted">{totalWeighted.toFixed(2)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
