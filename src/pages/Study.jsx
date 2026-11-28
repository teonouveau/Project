import { useEffect, useRef, useState } from "react";
import "../styles/std.css";

export default function Study() {
  const fileInput = useRef(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [reviewerOpen, setReviewerOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [questionFormat, setQuestionFormat] = useState("MCQ");
  const [questionCount, setQuestionCount] = useState("10");
  const [difficulty, setDifficulty] = useState("Moderate");

  useEffect(() => {
    if (!files.some((item) => item.progress < 100)) return undefined;

    const timer = window.setInterval(() => {
      setFiles((currentFiles) => currentFiles.map((item) => ({
        ...item,
        progress: Math.min(100, item.progress + 10),
      })));
    }, 100);

    return () => window.clearInterval(timer);
  }, [files]);

  useEffect(() => {
    if (!generateOpen || generateProgress >= 100) return undefined;

    const timer = window.setTimeout(() => {
      setGenerateProgress((progress) => Math.min(100, progress + 5));
    }, 50);

    return () => window.clearTimeout(timer);
  }, [generateOpen, generateProgress]);

  function openFilePicker() {
    fileInput.current?.click();
  }

  function handleFileChange(event) {
    const newFiles = Array.from(event.target.files || []);
    setFiles((currentFiles) => [
      ...currentFiles,
      ...newFiles
        .filter((file) => !currentFiles.some(
          (currentItem) =>
            currentItem.file.name === file.name &&
            currentItem.file.size === file.size &&
            currentItem.file.lastModified === file.lastModified,
        ))
        .map((file) => ({ file, progress: 0 })),
    ]);
    event.target.value = "";
  }

  function removeFile(fileToRemove) {
    setFiles((currentFiles) => currentFiles.filter((item) => item.file !== fileToRemove));
  }

  function finishUpload() {
    setSelectedDocuments(files.map((item) => item.file));
    setFiles([]);
    setUploadOpen(false);
  }

  return (
    <main className="study-page">
      <section className="study-uploader" aria-labelledby="study-upload-title">
        <svg className="study-cloud-icon" viewBox="0 0 96 76" role="img" aria-label="Upload">
          <path
            d="M25 62a18 18 0 0 1-2-36 27 27 0 0 1 50-6 21 21 0 0 1 1 42H25Z"
            fill="currentColor"
          />
          <path d="M48 70V34m0 0L37 45m11-11 11 11" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 id="study-upload-title">Upload a document</h2>
        <p>pdf to ready note/mock question</p>
        <p className="study-upload-hint">Tap the + button to upload docs/pdf file.</p>
        {selectedDocuments.length > 0 && (
          <div className="study-completed-documents" role="status" aria-label="Finished uploads">
            {selectedDocuments.map((file) => (
              <div className="study-completed-file" key={`${file.name}-${file.size}-${file.lastModified}`}>
                <span className="study-completed-check" aria-label="Finished">✓</span>
                <span title={file.name}>{file.name}</span>
              </div>
            ))}
          </div>
        )}
        <input
          ref={fileInput}
          className="study-file-input"
          type="file"
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          multiple
          onChange={handleFileChange}
          aria-label="Choose a study document"
        />
      </section>

      <button
        className="study-floating-add"
        type="button"
        aria-label="Open document upload"
        title="Upload a document"
        onClick={() => setUploadOpen(true)}
      >
        +
      </button>

      {uploadOpen && (
        <div
          className="study-upload-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setUploadOpen(false);
          }}
        >
          <section
            className="study-upload-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="study-dialog-title"
          >
            <button
              type="button"
              className="study-create-close"
              aria-label="Close"
              onClick={() => setUploadOpen(false)}
            >
              ×
            </button>
            <h2 id="study-dialog-title">What would you like to create?</h2>
            <p className="study-create-subtitle">Choose an option to get started</p>
            <button
              type="button"
              className="study-create-option"
              onClick={() => {
                setUploadOpen(false);
                setReviewerOpen(true);
              }}
            >
              <span className="study-create-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
                  <path d="M4 5.5v15A2.5 2.5 0 0 0 6.5 23H20" />
                </svg>
              </span>
              <span>
                <strong>Generate a reviewer</strong>
                <small>Convert uploaded documents into summarized notes and reviewer</small>
              </span>
            </button>
            <button
              type="button"
              className="study-create-option"
              onClick={() => {
                setUploadOpen(false);
                setQuizOpen(true);
              }}
            >
              <span className="study-create-icon green" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M5 3h10l4 4v14H5z" />
                  <path d="M15 3v5h5M8 12h8M8 16h8" />
                </svg>
              </span>
              <span>
                <strong>Make a quiz</strong>
                <small>Turn documents or topics into mock quiz and practice questions</small>
              </span>
            </button>
          </section>
        </div>
      )}

      {quizOpen && (
        <div
          className="study-upload-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setQuizOpen(false);
          }}
        >
          <section
            className="study-quiz-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="study-quiz-title"
          >
            <header className="study-quiz-header">
              <span className="study-quiz-icon" aria-hidden="true">✍</span>
              <div>
                <h2 id="study-quiz-title">Configure Practice Quiz</h2>
                <p>Customize your quiz to match your needs</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setQuizOpen(false)}>×</button>
            </header>

            <label className="study-quiz-field">
              <span>Source Material or Topic</span>
              <button type="button" className="study-quiz-upload" onClick={openFilePicker}>
                <span>Upload PDF, DOC, or TXT</span>
                <strong>+</strong>
              </button>
            </label>

            <fieldset className="study-quiz-field">
              <legend>Question Format</legend>
              <div className="study-quiz-options format">
                {["MCQ", "True / False", "Mixed"].map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={questionFormat === option ? "active" : ""}
                    onClick={() => setQuestionFormat(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="study-quiz-field">
              <legend>Number of Questions</legend>
              <div className="study-quiz-options count">
                {["5", "10", "15", "20"].map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={questionCount === option ? "active" : ""}
                    onClick={() => setQuestionCount(option)}
                  >
                    {option} Qs
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="study-quiz-field">
              <legend>Difficulty Level</legend>
              <div className="study-quiz-options difficulty">
                {["Easy", "Moderate", "Challenging"].map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={difficulty === option ? "active" : ""}
                    onClick={() => setDifficulty(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>

            <button type="button" className="study-quiz-generate" onClick={() => setQuizOpen(false)}>
              ⚡ Generate Mock Quiz
            </button>
          </section>
        </div>
      )}

      {reviewerOpen && (
        <div
          className="study-upload-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setReviewerOpen(false);
          }}
        >
          <section
            className="study-reviewer-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="study-reviewer-title"
          >
            <header className="study-reviewer-header">
              <h2 id="study-reviewer-title">Upload document for Reviewer</h2>
              <button type="button" aria-label="Close" onClick={() => setReviewerOpen(false)}>×</button>
            </header>

            <button type="button" className="study-reviewer-drop" onClick={openFilePicker}>
              <span className="study-reviewer-cloud" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 8.5 4.8 4.8 0 0 1 17 18H7Z" />
                  <path d="m12 15 0-7m0 0-3 3m3-3 3 3" />
                </svg>
              </span>
              <strong>Upload PDF, DOC format</strong>
              <small>Drag &amp; drop or click to choose documents (Max 25 MB)</small>
              <span className="study-reviewer-browse">Browse</span>
            </button>

            <div className="study-reviewer-samples">
              <p>Or try a sample document:</p>
              <button type="button">
                <span>📕</span> Software_Engineering_Module.pdf
              </button>
              <button type="button">
                <span>📘</span> Data_Structures_LectureNotes.docx
              </button>
            </div>

            {files.length > 0 && (
              <div className="study-reviewer-files" aria-live="polite">
                {files.map(({ file, progress }) => (
                  <div className="study-reviewer-file" key={`${file.name}-${file.size}-${file.lastModified}`}>
                    <span className="study-reviewer-pdf">PDF</span>
                    <div>
                      <strong>{file.name}</strong>
                      <div
                        className="study-reviewer-progress"
                        role="progressbar"
                        aria-label={`Uploading ${file.name}`}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow={progress}
                      >
                        <span style={{ width: `${progress}%` }} />
                      </div>
                      <small>
                        {file.size ? `${Math.max(1, Math.round(file.size / 1024 / 1024 * 10) / 10)} MB` : ""}
                        {" · "}
                        {progress < 100 ? `Uploading ${progress}%` : "Ready"}
                      </small>
                    </div>
                    {progress === 100 ? (
                      <span className="study-reviewer-ready" aria-label="Ready">✓</span>
                    ) : (
                      <span className="study-reviewer-spinner" role="status" aria-label={`Uploading ${progress}%`} />
                    )}
                    <button type="button" aria-label={`Remove ${file.name}`} onClick={() => removeFile(file)}>×</button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              className="study-reviewer-next"
              disabled={files.length === 0 || files.some((file) => file.progress < 100)}
              onClick={() => {
                setReviewerOpen(false);
                setGenerateProgress(0);
                setGenerateOpen(true);
              }}
            >
              Continue to Generate <span>→</span>
            </button>
          </section>
        </div>
      )}

      {generateOpen && (
        <div
          className="study-upload-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setGenerateOpen(false);
          }}
        >
          <section
            className="study-generate-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="study-generate-title"
          >
            <header className="study-generate-header">
              <h2 id="study-generate-title">Generate</h2>
              <button type="button" aria-label="Close" onClick={() => setGenerateOpen(false)}>×</button>
            </header>

            <div className="study-generate-file">
              <span className="study-generate-pdf">PDF</span>
              <strong>{files[0]?.file.name || "SASWEEK14.pdf"}</strong>
            </div>

            <div className="study-generate-arrow" aria-hidden="true">↓</div>

            <div className="study-generate-reviewer">
              <span>{files[0]?.file.name || "SASWEEK14.pdf"}&nbsp; Reviewer.pdf</span>
              <strong className={generateProgress === 100 ? "ready" : "generating"} role="status">
                {generateProgress < 100 && <span className="study-reviewer-spinner" aria-hidden="true" />}
                {generateProgress < 100 ? "Generating..." : "Ready!"}
              </strong>
            </div>

            <div
              className="study-generate-progress"
              role="progressbar"
              aria-label="Generating reviewer"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={generateProgress}
            >
              <span className="study-generate-progress-track">
                <span style={{ width: `${generateProgress}%` }} />
              </span>
              <small>{generateProgress}%</small>
            </div>

            <button
              type="button"
              className="study-generate-finish"
              disabled={generateProgress < 100}
              onClick={finishUpload}
            >
              Finish Now
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
