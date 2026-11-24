import "../styles/loadingPage.css";
import owlLogo from "../assets/owl-logo.png";

export default function LoadingPage() {
  return (
    <main className="loading-page" role="status" aria-label="Loading Eskwela Ta">
      <div className="loading-page-brand">
        <img className="loading-page-logo" src={owlLogo} alt="Eskwela Ta owl" />
        <h1 className="loading-page-title">Eskwela Ta</h1>
        <div className="loading-page-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </main>
  );
}
