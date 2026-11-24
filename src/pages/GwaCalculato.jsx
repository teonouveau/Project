import { useState } from "react";
import "./gwa.css";

function loadSubjects() {
  try {
    const saved = JSON.parse(localStorage.getItem("skwela_gwa_subjects") || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    localStorage.removeItem("skwela_gwa_subjects");
    return [];
  }
}

function GraduationCap() {
  return (
    <svg viewBox="0 0 96 76" aria-hidden="true">
      <path d="M5 24 48 7l43 17-43 18L5 24Z" fill="currentColor" />
      <path d="m22 34 26 11 26-11v20L48 65 22 54V34Z" fill="currentColor" />
      <path d="M88 27v25" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <circle cx="88" cy="56" r="5" fill="currentColor" />
    </svg>
  );
}

export default function GwaCalculato() {
  const [subjects, setSubjects] = useState(loadSubjects);
  const [formOpen, setFormOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [grade, setGrade] = useState("");
  const [units, setUnits] = useState("3");
  const [error, setError] = useState("");

  const totalUnits = subjects.reduce((total, subject) => total + subject.units, 0);
  const gwa = totalUnits
    ? subjects.reduce((total, subject) => total + subject.grade * subject.units, 0) / totalUnits
    : null;

  function saveSubjects(nextSubjects) {
    localStorage.setItem("skwela_gwa_subjects", JSON.stringify(nextSubjects));
    setSubjects(nextSubjects);
  }

  function closeForm() {
    setFormOpen(false);
    setSubjectName("");
    setGrade("");
    setUnits("3");
    setError("");
  }

  function addSubject(event) {
    event.preventDefault();
    const numericGrade = Number(grade);
    const numericUnits = Number(units);
    if (!subjectName.trim()) {
      setError("Enter a subject name.");
      return;
    }
    if (!Number.isFinite(numericGrade) || numericGrade < 1 || numericGrade > 5) {
      setError("Enter a grade from 1.00 to 5.00.");
      return;
    }
    if (!Number.isFinite(numericUnits) || numericUnits <= 0) {
      setError("Units must be greater than zero.");
      return;
    }

    saveSubjects([
      ...subjects,
      {
        id: `${Date.now()}-${subjectName.trim()}`,
        name: subjectName.trim(),
        grade: numericGrade,
        units: numericUnits,
      },
    ]);
    closeForm();
  }

  function removeSubject(id) {
    saveSubjects(subjects.filter((subject) => subject.id !== id));
  }

  return (
    <main className="gwa-page">
      {subjects.length === 0 ? (
        <section className="gwa-empty" aria-label="No subjects added">
          <GraduationCap />
          <h2>No subjects yet</h2>
          <p>Add a subject to start calculating your grade.</p>
          <button type="button" className="gwa-add-subject" onClick={() => setFormOpen(true)}>
            <span aria-hidden="true">+</span> Add Subject
          </button>
        </section>
      ) : (
        <section className="gwa-subjects" aria-label="GWA calculator">
          <div className="gwa-summary">
            <span>General Weighted Average</span>
            <strong>{gwa.toFixed(2)}</strong>
            <small>{subjects.length} {subjects.length === 1 ? "subject" : "subjects"} · {totalUnits} units</small>
          </div>
          <div className="gwa-subject-list">
            {subjects.map((subject) => (
              <article className="gwa-subject-card" key={subject.id}>
                <div>
                  <h2>{subject.name}</h2>
                  <p>{subject.units} {subject.units === 1 ? "unit" : "units"}</p>
                </div>
                <strong>{subject.grade.toFixed(2)}</strong>
                <button
                  type="button"
                  aria-label={`Remove ${subject.name}`}
                  onClick={() => removeSubject(subject.id)}
                >
                  ×
                </button>
              </article>
            ))}
          </div>
          <button type="button" className="gwa-add-subject" onClick={() => setFormOpen(true)}>
            <span aria-hidden="true">+</span> Add Subject
          </button>
        </section>
      )}

      <button
        className="gwa-floating-add"
        type="button"
        aria-label="Add subject"
        title="Add subject"
        onClick={() => setFormOpen(true)}
      >
        +
      </button>

      {formOpen && (
        <div
          className="gwa-modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <form className="gwa-modal" onSubmit={addSubject} aria-labelledby="gwa-form-title">
            <h2 id="gwa-form-title">Add Subject</h2>
            {error && <p className="gwa-form-error" role="alert">{error}</p>}
            <label>
              Subject name
              <input
                autoFocus
                type="text"
                value={subjectName}
                onChange={(event) => setSubjectName(event.target.value)}
                placeholder="e.g. Mathematics"
              />
            </label>
            <div className="gwa-form-row">
              <label>
                Grade (1.00–5.00)
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.01"
                  value={grade}
                  onChange={(event) => setGrade(event.target.value)}
                  placeholder="1.00"
                />
              </label>
              <label>
                Units
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={units}
                  onChange={(event) => setUnits(event.target.value)}
                />
              </label>
            </div>
            <div className="gwa-modal-actions">
              <button type="button" className="gwa-cancel" onClick={closeForm}>Cancel</button>
              <button type="submit" className="gwa-save">Add Subject</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
