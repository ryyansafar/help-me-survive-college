'use client';

import { useState, useEffect, useRef } from 'react';
import { GRADE_THRESHOLDS, calculateRequiredESE } from '@/lib/calculators/grade';
import type { AnySubject, Subject, MiniProjectSubject } from '@/lib/types';
import EmptyState from '@/components/ui/EmptyState';
import { revealElement } from '@/lib/dom/revealElement';
import { useAppHaptics } from '@/lib/hooks/useAppHaptics';
import { createId } from '@/lib/utils/createId';

const HELP_KEY = 'grade-calc-help-state';

type Preset = 'theory' | 'integrated' | 'lab' | 'mini' | null;

export default function GradeCalculator() {
  const haptics = useAppHaptics();
  const [subjects, setSubjects] = useState<AnySubject[]>([]);
  const [preset, setPreset] = useState<Preset>('theory');
  const [maxSess, setMaxSess] = useState(50);
  const [maxESE, setMaxESE] = useState(100);
  const [helpOpen, setHelpOpen] = useState(false);

  // form fields
  const [subjectName, setSubjectName] = useState('');
  const [currentMarks, setCurrentMarks] = useState('');
  const [miniName, setMiniName] = useState('');
  const [miniReceived, setMiniReceived] = useState('');
  const [miniTotal, setMiniTotal] = useState('150');

  const panelRef = useRef<HTMLDivElement>(null);
  const subjectNameInputRef = useRef<HTMLInputElement>(null);
  const currentMarksInputRef = useRef<HTMLInputElement>(null);
  const maxSessInputRef = useRef<HTMLInputElement>(null);
  const maxESEInputRef = useRef<HTMLInputElement>(null);
  const miniNameInputRef = useRef<HTMLInputElement>(null);
  const miniReceivedInputRef = useRef<HTMLInputElement>(null);
  const miniTotalInputRef = useRef<HTMLInputElement>(null);

  // Persist help state
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HELP_KEY) || '{}');
      if (typeof saved.grades === 'boolean') setHelpOpen(saved.grades);
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
      localStorage.setItem(HELP_KEY, JSON.stringify({ ...saved, grades: next }));
    } catch {}
    haptics.light();
  };

  // Animate help panel height
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (helpOpen) {
      el.hidden = false;
      el.style.maxHeight = '0px';
      el.offsetHeight; // force reflow
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

  const applyPreset = (type: Preset) => {
    if (type !== preset) {
      haptics.selection();
    }
    setPreset(type);
    if (type === 'theory')     { setMaxSess(50);  setMaxESE(100); }
    if (type === 'integrated') { setMaxSess(150); setMaxESE(100); }
    if (type === 'lab')        { setMaxSess(75);  setMaxESE(75);  }
  };

  const addSubject = () => {
    const name = (subjectNameInputRef.current?.value ?? subjectName).trim();
    const current = parseFloat(currentMarksInputRef.current?.value ?? currentMarks);
    const latestMaxSess = parseFloat(maxSessInputRef.current?.value ?? String(maxSess));
    const latestMaxESE = parseFloat(maxESEInputRef.current?.value ?? String(maxESE));
    if (!name || isNaN(current) || isNaN(maxSess) || isNaN(maxESE)) {
      showValidationError('fill all fields bro');
      return;
    }
    if (isNaN(latestMaxSess) || isNaN(latestMaxESE)) {
      showValidationError('fill all fields bro');
      return;
    }
    if (current > latestMaxSess) {
      showValidationError('current marks cant be more than max sessional');
      return;
    }
    const id = createId();
    const s: Subject = { id, name, current, maxSess: latestMaxSess, maxESE: latestMaxESE, isMini: false };
    setSubjects((prev) => [...prev, s]);
    setSubjectName('');
    setCurrentMarks('');
    setMaxSess(latestMaxSess);
    setMaxESE(latestMaxESE);
    haptics.success();
    revealElement(`grade-subject-${id}`);
  };

  const addMini = () => {
    const name = (miniNameInputRef.current?.value ?? miniName).trim();
    const received = parseFloat(miniReceivedInputRef.current?.value ?? miniReceived);
    const total = parseFloat(miniTotalInputRef.current?.value ?? miniTotal);
    if (!name || isNaN(received) || isNaN(total)) {
      showValidationError('fill all the fields bro');
      return;
    }
    if (total <= 0) {
      showValidationError('total marks cant be zero or negative');
      return;
    }
    if (received > total) {
      showValidationError('marks received cant exceed total marks');
      return;
    }
    if (received < 0) {
      showValidationError('marks cant be negative');
      return;
    }
    const id = createId();
    const s: MiniProjectSubject = { id, name, received, total, isMini: true };
    setSubjects((prev) => [...prev, s]);
    setMiniName('');
    setMiniReceived('');
    setMiniTotal(String(total));
    haptics.success();
    revealElement(`grade-subject-${id}`);
  };

  const deleteSubject = (id: string) => {
    haptics.warning();
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSubject = (id: string, field: 'current' | 'maxSess', value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setSubjects((prev) =>
      prev.map((s) => (s.id === id && !s.isMini ? { ...s, [field]: num } : s))
    );
  };

  return (
    <div>
      {/* Add Section */}
      <div className="add-section">
        <div className="section-toolbar">
          <span className="section-help-status">{helpOpen ? 'tips visible' : 'tips hidden'}</span>
          <button
            type="button"
            className={`btn-help${helpOpen ? ' is-open' : ''}`}
            aria-expanded={helpOpen}
            onClick={toggleHelp}
          >
            {helpOpen ? 'hide help' : '? help me'}
          </button>
        </div>

        <div
          ref={panelRef}
          className={`help-panel${helpOpen ? ' is-open' : ''}`}
          hidden={!helpOpen}
        >
          <div className="help-panel-title">help loaded</div>
          <div className="help-block">
            <div className="help-block-title">course types</div>
            <ul className="help-list">
              <li className="help-line"><strong>theory courses:</strong> max sessional = 50, max ese = 100 (classic torture format)</li>
              <li className="help-line"><strong>integrated courses:</strong> max sessional = 150, max ese = 100 (double the pain)</li>
              <li className="help-line"><strong>lab courses:</strong> max sessional = 75, max ese = 75 (at least it&apos;s fair i guess)</li>
            </ul>
          </div>
          <div className="help-block">
            <div className="help-block-title">before you calculate</div>
            <ul className="help-list">
              <li className="help-line"><strong>minimum ese to pass:</strong> you need at least 40% of the max ese even if your sessional is great. blame the university, not me.</li>
              <li className="help-line"><strong>open RSMS first:</strong> check your current sessional marks, come back here, then panic (or don&apos;t, idk).</li>
            </ul>
          </div>
        </div>

        <div className="preset-buttons">
          <button className="btn-preset"
            style={preset === 'theory' ? { borderColor: '#00ffff', color: '#00ffff' } : {}}
            onClick={() => applyPreset('theory')}>theory course</button>
          <button className="btn-preset"
            style={preset === 'integrated' ? { borderColor: '#00ffff', color: '#00ffff' } : {}}
            onClick={() => applyPreset('integrated')}>integrated course</button>
          <button className="btn-preset"
            style={preset === 'lab' ? { borderColor: '#00ffff', color: '#00ffff' } : {}}
            onClick={() => applyPreset('lab')}>lab course</button>
          <button className={`btn-preset-mini${preset === 'mini' ? ' active' : ''}`}
            onClick={() => applyPreset('mini')}>✦ mini project</button>
        </div>

        {/* Standard form */}
        {preset !== 'mini' && (
          <div className="form-grid">
            <div className="field">
              <label>subject name (whatever they call it)</label>
              <input ref={subjectNameInputRef} type="text" value={subjectName} onChange={(e) => setSubjectName(e.target.value)}
                placeholder="EC600A-B2"
                onKeyDown={(e) => e.key === 'Enter' && addSubject()} />
            </div>
            <div className="field">
              <label>your marks right now</label>
              <input ref={currentMarksInputRef} type="number" value={currentMarks} onChange={(e) => setCurrentMarks(e.target.value)}
                placeholder="39"
                onKeyDown={(e) => e.key === 'Enter' && addSubject()} />
            </div>
            <div className="field">
              <label>max sessional marks</label>
              <input ref={maxSessInputRef} type="number" value={maxSess} onChange={(e) => setMaxSess(parseFloat(e.target.value))} />
            </div>
            <div className="field">
              <label>max ese marks</label>
              <input ref={maxESEInputRef} type="number" value={maxESE} onChange={(e) => setMaxESE(parseFloat(e.target.value))} />
            </div>
            <div className="field">
              <label>&nbsp;</label>
              <button type="button" className="btn-add" onClick={addSubject}>add subject</button>
            </div>
          </div>
        )}

        {/* Mini project form */}
        {preset === 'mini' && (
          <div>
            <div style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 13, color: '#ff55bb', marginBottom: 12 }}>
              → total marks (default 150) split however the dept decided. just enter what you got.
            </div>
            <div className="form-grid form-grid--4">
              <div className="field">
                <label>project name / course code</label>
                <input ref={miniNameInputRef} type="text" value={miniName} onChange={(e) => setMiniName(e.target.value)}
                  placeholder="Mini Project S5"
                  onKeyDown={(e) => e.key === 'Enter' && addMini()} />
              </div>
              <div className="field">
                <label>marks received</label>
                <input ref={miniReceivedInputRef} type="number" value={miniReceived} onChange={(e) => setMiniReceived(e.target.value)}
                  placeholder="112"
                  onKeyDown={(e) => e.key === 'Enter' && addMini()} />
              </div>
              <div className="field">
                <label>total marks</label>
                <input ref={miniTotalInputRef} type="number" value={miniTotal} onChange={(e) => setMiniTotal(e.target.value)} />
              </div>
              <div className="field">
                <label>&nbsp;</label>
                <button type="button" className="btn-add" style={{ background: '#ff55bb', color: '#0a0a0a' }} onClick={addMini}>
                  add project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subjects list */}
      <div className="subjects-grid">
        {subjects.length === 0 ? (
          <EmptyState />
        ) : (
          subjects.map((subject) =>
            subject.isMini
              ? <MiniCard key={subject.id} subject={subject} onDelete={deleteSubject} />
              : <SubjectCard key={subject.id} subject={subject} onDelete={deleteSubject} onUpdate={updateSubject} />
          )
        )}
      </div>
    </div>
  );
}

/* ── Standard Subject Card ───────────────────────────────── */
function SubjectCard({
  subject,
  onDelete,
  onUpdate,
}: {
  subject: Subject;
  onDelete: (id: string) => void;
  onUpdate: (id: string, field: 'current' | 'maxSess', value: string) => void;
}) {
  const totalMarks = subject.maxSess + subject.maxESE;
  const currentPercentage = ((subject.current / totalMarks) * 100).toFixed(1);
  const minESEThreshold = 0.4 * subject.maxESE;

  const passResult = calculateRequiredESE(subject.current, subject.maxSess, subject.maxESE, 50);
  let passMessage: string;
  let passClass: string;
  if (passResult.required > subject.maxESE) {
    passMessage = `cannot pass even with ${subject.maxESE}/${subject.maxESE} in ese`;
    passClass = 'pass-alert danger';
  } else if (passResult.required <= minESEThreshold) {
    passMessage = `any score ≥${minESEThreshold}/${subject.maxESE} in ese will pass`;
    passClass = 'pass-alert safe';
  } else {
    passMessage = `need ${passResult.required}/${subject.maxESE} in ese to pass`;
    passClass = 'pass-alert';
  }

  return (
    <div className="subject" id={`grade-subject-${subject.id}`}>
      <div className="subject-top">
        <div className="subject-name">{subject.name}</div>
        <button className="btn-delete" onClick={() => onDelete(subject.id)}>delete</button>
      </div>

      <div className="stats-bar">
        <div className="stat-item"><span>current:</span><span>{subject.current}/{subject.maxSess}</span></div>
        <div className="stat-item"><span>total_marks:</span><span>{totalMarks}</span></div>
        <div className="stat-item"><span>current_%:</span><span>{currentPercentage}%</span></div>
      </div>

      <div className={passClass}>{passMessage}</div>

      <div className="grades-table">
        <table>
          <thead>
            <tr>
              <th>grade</th>
              <th>gp</th>
              <th>target_%</th>
              <th>min_ese_required (out of {subject.maxESE})</th>
            </tr>
          </thead>
          <tbody>
            {GRADE_THRESHOLDS.map((grade) => {
              const result = calculateRequiredESE(subject.current, subject.maxSess, subject.maxESE, grade.min);
              let eseClass = 'ese-value';
              let note = '';
              if (!result.possible) {
                if (result.required > subject.maxESE) {
                  eseClass += ' impossible';
                  note = 'impossible';
                } else {
                  eseClass += ' warning';
                  note = `below min ${minESEThreshold}`;
                }
              }
              const displayVal = result.required <= subject.maxESE
                ? Math.max(result.required, minESEThreshold)
                : '—';
              return (
                <tr key={grade.grade}>
                  <td><span className={`grade-tag ${grade.color}`}>{grade.grade}</span></td>
                  <td>{grade.point}</td>
                  <td>{grade.min}%</td>
                  <td>
                    <span className={eseClass}>{displayVal}</span>
                    {note && <span className="note">{note}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="edit-bar">
        <input type="number" className="edit-input" placeholder="update current marks"
          onChange={(e) => onUpdate(subject.id, 'current', e.target.value)} />
        <input type="number" className="edit-input" placeholder="update max sessional"
          onChange={(e) => onUpdate(subject.id, 'maxSess', e.target.value)} />
      </div>
    </div>
  );
}

/* ── Mini Project Card ───────────────────────────────────── */
function MiniCard({ subject, onDelete }: { subject: MiniProjectSubject; onDelete: (id: string) => void }) {
  const pct = (subject.received / subject.total) * 100;
  const hasPassed = pct >= 50;
  const grade = GRADE_THRESHOLDS.find((g) => pct >= g.min) || null;
  const passClass = hasPassed ? 'pass-alert safe' : 'pass-alert danger';
  const passMsg = hasPassed
    ? `passed ✓ — ${pct.toFixed(1)}% overall`
    : `failed ✗ — need at least 50% (${Math.ceil(subject.total * 0.5)} / ${subject.total}) to pass`;

  return (
    <div className="subject" id={`grade-subject-${subject.id}`} style={{ borderLeftColor: '#ff55bb' }}>
      <div className="subject-top">
        <div className="subject-name" style={{ color: '#ff55bb' }}>✦ {subject.name}</div>
        <button className="btn-delete" onClick={() => onDelete(subject.id)}>delete</button>
      </div>
      <div className="stats-bar">
        <div className="stat-item"><span>marks:</span><span style={{ color: '#ff55bb' }}>{subject.received} / {subject.total}</span></div>
        <div className="stat-item"><span>percentage:</span><span style={{ color: '#ff55bb' }}>{pct.toFixed(2)}%</span></div>
        <div className="stat-item">
          <span>grade:</span>
          <span>
            {grade
              ? <span className={`grade-tag ${grade.color}`}>{grade.grade}</span>
              : <span style={{ color: '#ff4444', fontFamily: 'var(--font-jetbrains-mono,monospace)', fontSize: 14 }}>—</span>}
          </span>
        </div>
        <div className="stat-item"><span>grade_point:</span><span style={{ color: '#ff55bb' }}>{grade ? grade.point : '—'}</span></div>
      </div>
      <div className={passClass}>{passMsg}</div>
    </div>
  );
}
