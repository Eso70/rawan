import { Icon } from "./icon";

export function WorkspacePreview() {
  return (
    <figure
      className="workspace-preview"
      id="preview"
      aria-labelledby="preview-caption"
    >
      <div className="preview-art">
        <div className="world-note">
          <span className="note-star">✦</span>A world taking shape
        </div>
        <div className="workspace-window">
          <div className="window-bar">
            <span className="window-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>The Cartographer&apos;s Daughter</span>
            <Icon name="spark" />
          </div>
          <div className="workspace-body">
            <div className="mock-sidebar" aria-hidden="true">
              <span className="sidebar-label">YOUR STORY</span>
              <span className="sidebar-item selected">
                <Icon name="book" />
                Manuscript
              </span>
              <span className="sidebar-item">
                <Icon name="world" />
                World
              </span>
              <span className="sidebar-item">
                <Icon name="connect" />
                Connections
              </span>
              <span className="sidebar-divider" />
              <span className="sidebar-label">MANUSCRIPT</span>
              <span className="chapter-item current">
                01 <span>The quiet sea</span>
              </span>
              <span className="chapter-item">
                02 <span>A map of stars</span>
              </span>
              <span className="chapter-item">
                03 <span>What remains</span>
              </span>
              <span className="sidebar-bottom">
                <span className="small-dot" />A little world of your own
              </span>
            </div>
            <div className="manuscript">
              <div className="document-meta">
                <span>CHAPTER ONE</span>
                <Icon name="book" />
              </div>
              <h2>The quiet sea</h2>
              <div className="document-prose">
                <p>
                  The sea was still that morning. Not peaceful, exactly. More
                  like a thought held quietly between two people who had
                  forgotten how to speak.
                </p>
                <p>
                  Elara unfolded the map her father had left behind. Beyond the
                  last inked coastline, a single word waited.
                </p>
                <p className="manuscript-last">
                  Begin.
                  <span className="writing-cursor" aria-hidden="true" />
                </p>
              </div>
              <div className="document-status">
                <span className="small-dot" />
                Every story starts somewhere.<span>01</span>
              </div>
            </div>
          </div>
        </div>
        <div className="character-note">
          <div className="character-avatar" aria-hidden="true">
            <span>E</span>
          </div>
          <div>
            <span className="card-eyebrow">CHARACTER</span>
            <h3>Elara Vey</h3>
            <p>Cartographer. Reluctant explorer.</p>
          </div>
          <span className="card-connection" aria-hidden="true">
            <Icon name="connect" />
          </span>
        </div>
        <div className="timeline-note">
          <span className="timeline-point" />
          <div>
            <span className="card-eyebrow">A MOMENT IN YOUR WORLD</span>
            <p>The voyage begins</p>
          </div>
          <span className="timeline-line" aria-hidden="true" />
        </div>
      </div>
      <figcaption id="preview-caption">
        <span className="caption-line" />A glimpse of what&apos;s to come. A
        static workspace concept.
      </figcaption>
    </figure>
  );
}
