import { useState } from "react";
import "../styles/gwa.css";

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
  const [draftSubjects, setDraftSubjects] = useState([]);
  const [calculatedGwa, setCalculatedGwa] = useState(null);
  const [error, setError] = useState("");

  const totalUnits = subjects.reduce((total, subject) => total + subject.units, 0);
  const gwa = totalUnits
    ? subjects.reduce((total, subject) => total + subject.grade * subject.units, 0) / totalUnits
    : null;

  function saveSubjects(nextSubjects) {
    localStorage.setItem("skwela_gwa_subjects", JSON.stringify(nextSubjects));
    setSubjects(nextSubjects);
  }

  function createEmptySubject() {
    return { id: `${Date.now()}-${Math.random()}`, name: "", units: "3", grade: "" };
  }

  function openForm() {
    const rows = subjects.length
      ? subjects.map((subject) => ({
          id: subject.id,
          name: subject.name,
          units: String(subject.units),
          grade: String(subject.grade),
        }))
      : Array.from({ length: 5 }, createEmptySubject);
    setDraftSubjects(rows);
    setCalculatedGwa(null);
    setError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setError("");
  }

  function calculateGwa(event) {
    event.preventDefault();
    const populatedRows = draftSubjects.filter(
      (subject) => subject.name.trim() || subject.grade !== "" || subject.units !== "3",
    );
    if (populatedRows.length === 0) {
      setError("Add at least one subject with a grade.");
      return;
    }

    const nextSubjects = [];
    for (const subject of populatedRows) {
      const numericGrade = Number(subject.grade);
      const numericUnits = Number(subject.units);
      if (!subject.name.trim()) {
        setError("Enter a subject name for each row with values.");
        return;
      }
      if (!Number.isFinite(numericGrade) || numericGrade < 1 || numericGrade > 5) {
        setError("Enter a grade from 1.00 to 5.00 for each subject.");
        return;
      }
      if (!Number.isFinite(numericUnits) || numericUnits <= 0) {
        setError("Units must be greater than zero.");
        return;
      }
      nextSubjects.push({
        id: subject.id,
        name: subject.name.trim(),
        grade: numericGrade,
        units: numericUnits,
      });
    }

    const unitsTotal = nextSubjects.reduce((total, subject) => total + subject.units, 0);
    const nextGwa = nextSubjects.reduce(
      (total, subject) => total + subject.grade * subject.units,
      0,
    ) / unitsTotal;
    saveSubjects(nextSubjects);
    setCalculatedGwa(nextGwa);
    setError("");
  }

  function resetCalculator() {
    const emptyRows = Array.from({ length: 5 }, createEmptySubject);
    setDraftSubjects(emptyRows);
    saveSubjects([]);
    setCalculatedGwa(null);
    setError("");
  }

  function updateDraftSubject(id, field, value) {
    setDraftSubjects((current) => current.map((subject) => (
      subject.id === id ? { ...subject, [field]: value } : subject
    )));
    setCalculatedGwa(null);
    setError("");
  }

  return (
    <main className="gwa-page">
      {subjects.length === 0 ? (
        <section className="gwa-empty" aria-label="No subjects added">
          <GraduationCap />
          <h2>No subjects yet</h2>
          <p>Add a subject to start calculating your grade.</p>
        </section>
      ) : (
        <section className="gwa-subjects" aria-label="GWA calculator">
          <div className="gwa-summary">
            <span className="gwa-summary-label">SEMESTER AVERAGE</span>
            <div className="gwa-summary-main">
              <strong>{gwa.toFixed(2)}</strong>
              {gwa <= 1.75 && <span className="gwa-champion">Academic Champion</span>}
              <button type="button" className="gwa-edit-grades" onClick={openForm}>
                <span aria-hidden="true">▱</span> Edit Grades
              </button>
            </div>
            <small>Total Units: {totalUnits} units</small>
          </div>
          <div className="gwa-subjects-panel">
            <header>
              <strong>CALCULATED SUBJECTS</strong>
              <span>{subjects.length} Subjects</span>
            </header>
            <div className="gwa-subject-list">
              {subjects.map((subject) => (
                <article className="gwa-subject-card" key={subject.id}>
                  <div>
                    <h2>{subject.name}</h2>
                    <p>{subject.units} {subject.units === 1 ? "Unit" : "Units"}</p>
                  </div>
                  <strong>{subject.grade.toFixed(2)}</strong>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <button
        className="gwa-floating-add"
        type="button"
        aria-label="Add subject"
        title="Add subject"
        onClick={openForm}
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
          <form className="gwa-modal gwa-calculator-modal" onSubmit={calculateGwa} aria-labelledby="gwa-form-title">
            <header className="gwa-calculator-header">
              <div>
                <h2 id="gwa-form-title">GWA Calculator</h2>
                <p>Enter your subjects, units, and final grades</p>
              </div>
              <button type="button" aria-label="Close" onClick={closeForm}>×</button>
            </header>
            <div className="gwa-calculator-table">
              <div className="gwa-calculator-row gwa-calculator-columns" aria-hidden="true">
                <span>Subject</span>
                <span>No. of units</span>
                <span>Final Grade</span>
                <span />
              </div>
              {draftSubjects.map((subject) => (
                <div className="gwa-calculator-row" key={subject.id}>
                  <input
                    type="text"
                    aria-label="Subject name"
                    value={subject.name}
                    onChange={(event) => updateDraftSubject(subject.id, "name", event.target.value)}
                    placeholder="e.g., Application Development"
                  />
                  <input
                    type="number"
                    aria-label="Number of units"
                    min="0.5"
                    step="0.5"
                    value={subject.units}
                    onChange={(event) => updateDraftSubject(subject.id, "units", event.target.value)}
                  />
                  <input
                    type="number"
                    aria-label="Final grade"
                    min="1"
                    max="5"
                    step="0.01"
                    value={subject.grade}
                    onChange={(event) => updateDraftSubject(subject.id, "grade", event.target.value)}
                    placeholder="1.4"
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${subject.name || "subject row"}`}
                    onClick={() => setDraftSubjects((current) => current.filter((row) => row.id !== subject.id))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {error && <p className="gwa-form-error" role="alert">{error}</p>}
            {calculatedGwa !== null && (
              <div className="gwa-calculator-result" role="status">
                <span>Grade Weighted Average:</span>
                <strong>{calculatedGwa.toFixed(2)}</strong>
                <small>{calculatedGwa <= 1.75 ? "Academic Champion" : ""}</small>
              </div>
            )}
            <div className="gwa-calculator-actions">
              <button type="button" className="gwa-calculator-add" onClick={() => setDraftSubjects((current) => [...current, createEmptySubject()])}>
                <span aria-hidden="true">+</span> Add Subject
              </button>
              <button type="submit" className="gwa-calculate">Calculate</button>
              <button type="button" className="gwa-reset" onClick={resetCalculator}>Reset</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
