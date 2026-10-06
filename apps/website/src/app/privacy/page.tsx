import type { Metadata } from "next";
import { LegalPage } from "../../components/legal/legal-page";
import { DISCORD_INVITE } from "../../components/site-links";

export const metadata: Metadata = {
  title: "Privacy Policy — Rawan",
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" current="privacy">
      <section>
        <h2>1. Scope of this preview</h2>
        <p>
          This draft describes the current Rawan website preview and identifies
          information that must be confirmed before a public account service
          opens. It does not claim that unfinished integrations or privacy
          processes are already operating.
        </p>
        <p>
          The released policy will name the organization responsible for
          information and provide a dedicated contact for privacy requests.
        </p>
      </section>
      <section>
        <h2>2. What happens on the login page</h2>
        <p>
          Local testing supports Google sign-in. Google asks permission to share
          your basic profile and verified email with Rawan. After verification,
          Rawan stores your Google account identifier, email and name in the
          local database and creates an author profile on your first sign-in.
        </p>
        <ul>
          <li>Your Google password is entered on Google, never on Rawan.</li>
          <li>
            Discord, Apple and email sign-in are not enabled on this website.
          </li>
          <li>
            Google access and refresh tokens are not stored. The account page
            checks your Rawan session with the backend.
          </li>
        </ul>
      </section>
      <section>
        <h2>Onboarding preferences and tutorial writing</h2>
        <p>
          Rawan saves your story-type choice, tutorial progress and completion,
          and the sample card’s name, role, selected illustration and text to
          your signed-in account in the local database. This lets you resume
          onboarding and keep your tutorial edits. These are private tutorial
          examples, rather than a shared world or manuscript project.
        </p>
        <p>
          The introduction includes subtitles and optional narration using your
          browser’s speech service. Available voices and processing depend on
          your browser and device. Narration is off until you enable it.
        </p>
      </section>
      <section>
        <h2>3. Browser preferences</h2>
        <p>
          The website remembers the last selected Google method in your
          browser’s local storage under <strong>rawan-login-method</strong>.
          This stores a method name, not an email address, password or sign-in
          token.
        </p>
        <p>
          A temporary HTTP-only cookie protects the Google sign-in request for
          ten minutes. A separate HTTP-only cookie holds your Rawan session for
          up to seven days. Signing out removes those cookies. These cookies use
          SameSite protection; HTTP is used only for this localhost setup.
        </p>
        <p>
          You can remove that preference using your browser’s controls for site
          data. Private browsing or blocked storage may prevent the preference
          from being saved.
        </p>
      </section>
      <section>
        <h2>4. Artwork and sample stories</h2>
        <p>
          The landing page uses supplied images, videos and a 3D model, along
          with illustrative story data. Selecting a map marker or a sample entry
          changes the demonstration shown on the page; it does not upload your
          own writing or create a backend project.
        </p>
        <p>
          The published policy will separately explain the handling of
          manuscripts, world entries, uploaded files and collaborator
          information when those features are available.
        </p>
      </section>
      <section>
        <h2>5. Requests to the website</h2>
        <p>
          Your browser requests pages, fonts and media from the server serving
          Rawan. That server and its hosting provider may handle connection
          information needed to deliver those requests. The production provider,
          log fields and retention settings have not been established by this
          draft.
        </p>
        <p>
          Any future analytics or additional cookies will need to be assessed
          and described before being introduced.
        </p>
      </section>
      <section>
        <h2>6. Following external links</h2>
        <p>
          Help opens the Rawan Discord community. Artist credits may lead to the
          source of an artwork. After following an external link, your browser
          communicates with that destination and its own privacy rules apply.
        </p>
        <p>
          Help does not send account credentials to Discord. Avoid placing
          private material into public community posts.
        </p>
      </section>
      <section>
        <h2>7. Optional features and processors</h2>
        <p>
          A future account service may use separate systems for storage,
          delivery or optional assistance. Before release, the actual providers
          and the information sent to them need to be recorded. This page does
          not identify another platform’s vendors as Rawan’s vendors.
        </p>
        <h3>Writing assistance</h3>
        <p>
          The final policy will explain which text an optional assistance
          feature receives, the purpose of processing and the choices available
          to an author. No AI request is sent by the current landing-page
          demonstrations.
        </p>
      </section>
      <section>
        <h2>8. Access and retention details</h2>
        <p>
          Production access controls, hosting locations, backup periods and
          removal procedures must be checked against the deployed service. This
          draft does not guarantee a particular storage region, deletion period
          or backup schedule.
        </p>
        <p>
          Keep private account credentials out of community conversations and
          use the released service’s dedicated account controls when they become
          available.
        </p>
      </section>
      <section>
        <h2>9. Requests concerning information</h2>
        <p>
          The final policy will describe how a person can raise a privacy
          concern and use any rights applicable to their circumstances. A
          dedicated request channel and a verification process will be provided
          before public accounts open.
        </p>
        <p>
          For a question about this preview, the{" "}
          <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
            Rawan Discord community
          </a>{" "}
          is available. Public chat is not intended for exchanging identity
          documents or confidential requests.
        </p>
      </section>
      <section>
        <h2>10. Updates to this draft</h2>
        <p>
          As account features and hosting are confirmed, this page will be
          revised to describe actual behavior. The revision date will change
          with the text. The companion{" "}
          <a href="/terms">Terms & Conditions draft</a> explains the preview’s
          current status.
        </p>
      </section>
    </LegalPage>
  );
}
