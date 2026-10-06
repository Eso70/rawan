import type { Metadata } from "next";
import { LegalPage } from "../../components/legal/legal-page";
import { DISCORD_INVITE } from "../../components/site-links";

export const metadata: Metadata = {
  title: "Terms & Conditions — Rawan",
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions" current="terms">
      <section>
        <h2>1. About this draft</h2>
        <p>
          Rawan is being developed as a place to write manuscripts and connect
          the people, places, timelines, notes and ideas behind a story. This
          page shows the intended presentation of its terms. It is a temporary
          draft rather than an active account or subscription agreement.
        </p>
        <p>
          The operating company, applicable jurisdiction and final conditions
          will be identified in the published version.
        </p>
      </section>
      <section>
        <h2>2. Exploring the preview</h2>
        <p>
          You can browse the landing page, artwork and sample story
          demonstrations without creating an account. The examples illustrate
          planned experiences; they do not create a writing workspace or save a
          manuscript for you.
        </p>
        <ul>
          <li>
            Google sign-in is enabled for localhost testing and creates a local
            author account on your first successful sign-in.
          </li>
          <li>Other website sign-in methods remain unavailable.</li>
          <li>
            Future workspace access will have its own published eligibility and
            account requirements.
          </li>
        </ul>
      </section>
      <section>
        <h2>3. Your creative work</h2>
        <h3>Authorship</h3>
        <p>
          The intended product keeps authorship with the person who creates a
          work. Writing a story in Rawan should not transfer ownership of that
          story to the platform.
        </p>
        <h3>Materials you bring</h3>
        <p>
          Before uploading illustrations, music, reference material or another
          person’s writing, check that you have permission to use it.
          Attribution and license conditions attached to an asset still apply.
        </p>
      </section>
      <section>
        <h2>4. Permissions for a future workspace</h2>
        <p>
          A working writing service needs permission to process the material an
          author chooses to store in it. The final agreement will describe the
          permissions needed for editing, search, previews, exports and storage.
          This draft does not establish those permissions.
        </p>
      </section>
      <section>
        <h2>5. Sharing and collaborators</h2>
        <p>
          Private drafting, inviting a collaborator and publishing a world are
          different actions. The product should make the audience clear before
          sharing. Do not publish another contributor’s unpublished material
          without their permission.
        </p>
        <p>
          Workspace roles and the practical consequences of removing access will
          be explained when collaboration is available to users.
        </p>
      </section>
      <section>
        <h2>6. Responsible access</h2>
        <p>
          Use previews and future workspaces in a way that respects other
          authors and the systems supporting them.
        </p>
        <ul>
          <li>
            Do not try to access a project that has not been shared with you.
          </li>
          <li>Do not use uploads or links to distribute malicious files.</li>
          <li>Do not present someone else’s work as your own.</li>
          <li>Do not interfere with another person’s account or writing.</li>
        </ul>
      </section>
      <section>
        <h2>7. Connected tools</h2>
        <p>
          Buttons and illustrations may show tools planned for Rawan. An
          illustrated provider or integration is not a promise that a connection
          is available. When a connection is enabled, its purpose and any
          separate provider conditions should be shown before use.
        </p>
      </section>
      <section>
        <h2>8. Charges and plans</h2>
        <p>
          No Rawan price list, renewal schedule or refund arrangement is
          established by this page. Any paid offering will need clearly
          published limits, payment terms and cancellation information before an
          author purchases it.
        </p>
      </section>
      <section>
        <h2>9. Availability and keeping a copy</h2>
        <p>
          The preview is still changing. Demonstrations can be replaced, and
          unfinished tools may behave differently from a future release. Keep
          your own copy of important creative material while evaluating a
          developing product.
        </p>
        <p>
          Final service commitments and any lawful limitations of responsibility
          will be reviewed separately before launch.
        </p>
      </section>
      <section>
        <h2>10. Leaving a workspace</h2>
        <p>
          Account closure, content export, removal of shared access and backup
          handling will need documented processes in the released service. This
          draft does not promise a deletion deadline or an export format that
          has not been made available.
        </p>
      </section>
      <section>
        <h2>11. Future revisions</h2>
        <p>
          This draft will be replaced as the product and its operating details
          are confirmed. The date above identifies this version. Material
          changes to released account terms should be communicated clearly to
          affected users.
        </p>
        <p>
          Read the accompanying <a href="/privacy">Privacy Policy draft</a> for
          the current preview’s handling of information.
        </p>
      </section>
      <section>
        <h2>12. Questions and feedback</h2>
        <p>
          Visit the{" "}
          <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
            Rawan Discord community
          </a>{" "}
          to ask about the project or report a problem with the preview. Do not
          post passwords, private manuscripts or sensitive account details in a
          public channel.
        </p>
        <p>
          A formal business and legal contact will be listed with the final
          terms.
        </p>
      </section>
    </LegalPage>
  );
}
