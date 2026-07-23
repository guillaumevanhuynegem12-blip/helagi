// Cookie Policy — drafted against the actual storage the app uses. Every
// cookie and localStorage item below must stay in sync with the code
// (lib/auth.ts, lib/consent.ts, lib/googleAuth.ts,
// components/PrototypeNoticeModal.tsx). Bracketed [PLACEHOLDERS] are company
// facts to fill in before launch; final review by a qualified lawyer is
// still recommended (see app/legal/layout.tsx banner).

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy — Helagi",
  description:
    "Every cookie and browser-storage item Helagi uses, what each one does, how long it lives, and how to change your choices.",
};

export default function CookiePolicyPage() {
  return (
    <>
      <h1>Cookie Policy</h1>
      <p className="updated">Last updated: 23 July 2026 · Version 1.0</p>

      <h2>1. Who we are</h2>
      <p>
        Helagi is operated by [COMPANY LEGAL NAME], [REGISTERED ADDRESS],
        Belgium ([PRIVACY CONTACT EMAIL]). This policy explains every cookie
        and similar browser-storage technology Helagi uses. How we handle your
        personal data more broadly is described in our{" "}
        <Link href="/legal/privacy">Privacy Policy</Link>.
      </p>

      <h2>2. The short version</h2>
      <ul>
        <li>
          Helagi sets <strong>four first-party cookies and one browser-storage
          item — nothing else</strong>. All of them exist to make the service
          work; none of them track you.
        </li>
        <li>
          <strong>There are no advertising cookies, no third-party trackers,
          and no cross-site tracking of any kind</strong> — not now, and
          adding any would require asking you first.
        </li>
        <li>
          Our optional analytics is <strong>cookieless</strong> and runs only
          after you consent.
        </li>
      </ul>

      <h2>3. What cookies are</h2>
      <p>
        Cookies are small text files a website stores in your browser so it
        can recognize your browser again — for example, to keep you logged in
        between pages. The law treats similar technologies, such as browser
        &ldquo;local storage,&rdquo; the same way, so this policy covers those
        too. Cookies set by the website you are visiting are
        &ldquo;first-party&rdquo;; cookies set by other companies through that
        website are &ldquo;third-party.&rdquo;{" "}
        <strong>Helagi uses first-party cookies only.</strong>
      </p>

      <h2>4. The cookies Helagi sets</h2>
      <p>
        Strictly necessary cookies do not require consent under the EU
        ePrivacy rules, because the service you are asking for cannot work
        without them — that is why the banner shows them as
        &ldquo;always&nbsp;on.&rdquo; Everything optional requires your
        opt-in.
      </p>
      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Purpose</th>
            <th>Category</th>
            <th>Lifetime</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>helagi_session</td>
            <td>
              Keeps you logged in to your account. Contains only a random
              token; it is httpOnly, meaning scripts on the page can never
              read it.
            </td>
            <td>Strictly necessary</td>
            <td>30 days, renewed while you use Helagi</td>
          </tr>
          <tr>
            <td>helagi_guest</td>
            <td>
              A random anonymous ID for guest visits, so the service can treat
              your visit as one session without an account. Also httpOnly.
            </td>
            <td>Strictly necessary</td>
            <td>30 days</td>
          </tr>
          <tr>
            <td>helagi_consent</td>
            <td>
              Remembers your cookie choices and the date and version of the
              Terms of Use you agreed to. Storing your choice is itself
              necessary — without it we would have to ask on every page.
            </td>
            <td>Strictly necessary</td>
            <td>6 months, then we ask again</td>
          </tr>
          <tr>
            <td>helagi_google_state</td>
            <td>
              Set only if you click &ldquo;Continue with Google&rdquo;: a
              one-time random value that protects the sign-in round trip
              against forgery (CSRF). Deleted as soon as you return from
              Google.
            </td>
            <td>Strictly necessary</td>
            <td>10 minutes or first use, whichever comes first</td>
          </tr>
        </tbody>
      </table>

      <h2>5. Browser storage Helagi uses</h2>
      <table>
        <thead>
          <tr>
            <th>Item (localStorage)</th>
            <th>Purpose</th>
            <th>Category</th>
            <th>Lifetime</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>helagi:prototype-notice-seen</td>
            <td>
              Remembers that you closed the one-time welcome notice in the
              chat, so it is not shown again on every visit. Contains only the
              value &ldquo;1&rdquo;.
            </td>
            <td>Strictly necessary (interface state)</td>
            <td>Until you clear your browser data</td>
          </tr>
        </tbody>
      </table>
      <p>
        Your conversations as a guest exist only in the browser tab&rsquo;s
        memory — they are not written to cookies or local storage, and they
        disappear when the tab closes.
      </p>

      <h2>6. Optional categories in the banner</h2>
      <ul>
        <li>
          <strong>Analytics.</strong> With your consent, Helagi records
          first-party usage events (pages visited, features used, errors,
          session duration, coarse browser/OS type) on our own
          infrastructure. This is <strong>cookieless</strong>: no analytics
          cookie is set and no third-party analytics tool is used — events are
          associated with a pseudonymous ID derived from the session cookies
          above (for logged-in users, a one-way hash, so events cannot be
          traced back to your account) and kept for about 90 days. The content of your conversations is never
          included, and our server discards free-text values as a backstop.
          Consent is checked twice: in your browser before anything is sent,
          and again on our server before anything is stored.
        </li>
        <li>
          <strong>Performance &amp; preferences.</strong> This category covers
          optional cookies that would remember settings between visits. Helagi
          currently sets none; your choice applies automatically to any
          introduced later, and this table will be updated before that
          happens.
        </li>
      </ul>

      <h2>7. What Helagi does not do</h2>
      <ul>
        <li>No advertising or marketing cookies, ever.</li>
        <li>No third-party trackers, pixels, or fingerprinting.</li>
        <li>No selling or sharing of data collected via cookies.</li>
        <li>No tracking of your activity on other websites or apps.</li>
      </ul>
      <p>
        Because nothing here involves selling or sharing data, opt-out signals
        such as Global Privacy Control have nothing additional to switch off:
        optional processing is already disabled unless you explicitly opt in.
      </p>

      <h2>8. Third-party services you may choose to use</h2>
      <p>
        If you click &ldquo;Continue with Google,&rdquo; you temporarily leave
        Helagi for Google&rsquo;s own sign-in pages. Google may use its own
        cookies on its own domains under{" "}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google&rsquo;s privacy policy
        </a>
        ; we neither control nor receive those cookies. On Helagi itself, the
        only trace is the short-lived helagi_google_state cookie above.
      </p>

      <h2>9. Changing your mind</h2>
      <ul>
        <li>
          <strong>In Helagi:</strong> the &ldquo;Cookie settings&rdquo; link
          in the footer reopens the preferences at any time. Withdrawing
          analytics consent takes effect immediately — the very next event is
          simply not sent. Rejecting optional cookies never limits the
          assistant.
        </li>
        <li>
          <strong>In your browser:</strong> you can view, block, or delete
          cookies in your browser settings. If you delete the strictly
          necessary ones, you will be logged out and asked for your choices
          (and Terms of Use acceptance) again — nothing breaks beyond that.
        </li>
      </ul>

      <h2>10. Changes to this policy</h2>
      <p>
        If we ever add a cookie or storage item, we will update the tables
        above and the date at the top first, and — for anything beyond the
        strictly necessary — ask for your consent before it is set. The
        consent banner also reappears roughly every 6 months so your choice
        stays current.
      </p>

      <h2>11. Questions</h2>
      <p>
        Contact [PRIVACY CONTACT EMAIL]. Your rights regarding the personal
        data processed via these cookies — access, deletion, complaint to a
        supervisory authority, and more — are described in the{" "}
        <Link href="/legal/privacy">Privacy Policy</Link>.
      </p>
    </>
  );
}
