import { useRef, useState } from "react";
import "./std.css";

export default function Study() {
  const fileInput = useRef(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);

  function openFilePicker() {
    fileInput.current?.click();
  }

  function handleFileChange(event) {
    const newFiles = Array.from(event.target.files || []);
    setFiles((currentFiles) => [
      ...currentFiles,
      ...newFiles.filter((file) => !currentFiles.some(
        (currentFile) =>
          currentFile.name === file.name &&
          currentFile.size === file.size &&
          currentFile.lastModified === file.lastModified,
      )),
    ]);
    event.target.value = "";
  }

  function removeFile(fileToRemove) {
    setFiles((currentFiles) => currentFiles.filter((file) => file !== fileToRemove));
  }

  function finishUpload() {
    setSelectedDocuments(files);
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
        <button className="study-upload-button" type="button" onClick={() => setUploadOpen(true)}>
          <span aria-hidden="true">+</span> Upload
        </button>
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
            <span className="study-dialog-handle" aria-hidden="true" />
            <h2 id="study-dialog-title">Upload file</h2>
            <div className="study-browse-panel">
              <svg className="study-dialog-cloud" viewBox="0 0 96 76" aria-hidden="true">
                <path d="M25 62a18 18 0 0 1-2-36 27 27 0 0 1 50-6 21 21 0 0 1 1 42H25Z" fill="currentColor" />
                <path d="M48 70V34m0 0L37 45m11-11 11 11" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p>Upload PDF, DOC format</p>
              <button type="button" className="study-browse-button" onClick={openFilePicker}>
                Browse
              </button>
            </div>

            <div className="study-file-list" aria-live="polite">
              {files.map((file) => {
                const isPdf = file.name.toLowerCase().endsWith(".pdf");
                return (
                  <div className="study-file-row" key={`${file.name}-${file.size}-${file.lastModified}`}>
                    <span className={`study-file-type${isPdf ? " pdf" : ""}`}>
                      {isPdf ? "PDF" : "DOC"}
                    </span>
                    <span className="study-file-name" title={file.name}>{file.name}</span>
                    <button
                      type="button"
                      className="study-file-remove"
                      aria-label={`Remove unfinished file ${file.name}`}
                      title="Not finished — remove file"
                      onClick={() => removeFile(file)}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="study-finish-button"
              disabled={files.length === 0}
              onClick={finishUpload}
            >
              Finish
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
