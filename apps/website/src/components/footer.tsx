import { Icon } from "./icon";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <>
      <section
        className="closing container"
        id="begin"
        aria-labelledby="closing-heading"
      >
        <Icon name="spark" className="closing-spark" />
        <h2 id="closing-heading">
          Your world starts
          <br />
          with <em>a blank page.</em>
        </h2>
        <a className="button button-primary" href="#preview">
          Start writing
          <Icon name="arrow" />
        </a>
        <p className="launch-note">
          The writing space and sign-in are coming soon.
          <br />
          For now, take a look around.
        </p>
      </section>
      <footer className="site-footer container">
        <a className="wordmark" href="#top">
          Rawan
        </a>
        <p>A little space for a bigger imagination.</p>
        <span>© {year} Rawan</span>
      </footer>
    </>
  );
}
