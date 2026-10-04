import { Icon } from "./icon";
import { WorkspacePreview } from "./workspace-preview";

export function Hero() {
  return (
    <section className="hero container" aria-labelledby="hero-heading">
      <div className="hero-copy">
        <p className="eyebrow">
          <span className="eyebrow-line" />A HOME FOR YOUR IMAGINATION
        </p>
        <h1 id="hero-heading">
          Where stories
          <br />
          become <em>worlds.</em>
        </h1>
        <p className="hero-description">
          A quiet space to write, shape your world, and bring every thread of
          your story together.
        </p>
        <div className="hero-actions">
          <a className="button button-primary" href="#begin">
            Start writing
            <Icon name="arrow" />
          </a>
          <a className="text-link" href="#features">
            Explore Rawan<span aria-hidden="true">↗</span>
          </a>
        </div>
        <p className="hero-footnote">For the stories only you can tell.</p>
      </div>
      <WorkspacePreview />
    </section>
  );
}
