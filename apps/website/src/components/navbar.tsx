import { Icon } from "./icon";

export function Navbar() {
  return (
    <header className="site-header">
      <nav className="container navigation" aria-label="Main navigation">
        <a className="wordmark" href="#top" aria-label="Rawan home">
          <Icon name="spark" />
          Rawan
        </a>
        <div className="navigation-links">
          <a href="#features">Features</a>
          <a href="#about">About</a>
        </div>
        <div className="navigation-actions">
          <a className="sign-in" href="#begin">
            Sign in
          </a>
          <a className="button button-small button-outline" href="#begin">
            Start writing
            <Icon name="arrow" />
          </a>
        </div>
      </nav>
    </header>
  );
}
