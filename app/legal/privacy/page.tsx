// Privacy Policy — drafted against the actual data flows in this codebase
// (lib/auth.ts, lib/chatStore.ts, app/api/analytics/route.ts,
// app/api/survey/route.ts, lib/rateLimit.ts, lib/email.ts, lib/icd.ts,
// app/api/chat/route.ts). Every factual statement below must stay in sync
// with the code. Bracketed [PLACEHOLDERS] are company facts that must be
// filled in before launch; the whole document still requires review by a
// qualified lawyer before public launch (see app/legal/layout.tsx banner).

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Helagi",
  description:
    "How Helagi collects, uses, protects, and deletes your data — including the health information you choose to share in chat.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="updated">Last updated: 23 July 2026 · Version 1.0</p>

      <h2>1. Who we are</h2>
      <p>
        Helagi is operated by [COMPANY LEGAL NAME] ([LEGAL FORM, e.g. BV]), a
        company incorporated in Belgium with registered office at [REGISTERED
        ADDRESS], enterprise number [BCE/KBO NUMBER] (&ldquo;Helagi&rdquo;,
        &ldquo;we&rdquo;, &ldquo;us&rdquo;). We are the &ldquo;data
        controller&rdquo; of the personal data described in this policy under
        the EU General Data Protection Regulation (GDPR).
      </p>
      <p>
        For anything related to privacy or your data, contact us at
        [PRIVACY CONTACT EMAIL]. We answer data-protection requests within one
        month, as the GDPR requires.
      </p>

      <h2>2. What Helagi is — and is not</h2>
      <p>
        Helagi is an AI assistant that provides general health information and
        helps you prepare for a conversation with a real healthcare
        professional. It is <strong>not</strong> a medical device, does not
        provide medical advice, diagnosis, or treatment, and no
        doctor&ndash;patient relationship is created by using it. See the{" "}
        <Link href="/legal/medical-disclaimer">Medical Disclaimer</Link> and{" "}
        <Link href="/legal/terms">Terms of Use</Link>. This policy explains
        what happens to your data; the Terms of Use govern your use of the
        service.
      </p>

      <h2>3. The short version</h2>
      <ul>
        <li>
          <strong>You decide what health information to share.</strong> We only
          see what you type into the chat.
        </li>
        <li>
          <strong>Guest chats are never stored on our servers.</strong> They
          exist only in your browser and are gone when you close the tab.
        </li>
        <li>
          <strong>Account chats are stored only for you</strong>, encrypted in
          transit, deletable by you at any time, and never used for
          advertising, analytics, or AI training.
        </li>
        <li>
          <strong>We do not sell or rent your data. Ever.</strong> There is no
          advertising and there are no third-party marketing trackers on
          Helagi.
        </li>
        <li>
          <strong>Analytics is optional</strong>, first-party, runs only after
          you consent, and never contains conversation content.
        </li>
      </ul>

      <h2>4. What we collect</h2>
      <ul>
        <li>
          <strong>Account data</strong> — if you create an account: your email
          address, a salted cryptographic hash of your password (never the
          password itself), and the date the account was created. If you sign
          in with Google, we receive your verified email address and Google
          account identifier only; we never receive your Google password or
          profile contents. We do not ask for your name, date of birth, or any
          medical information at signup.
        </li>
        <li>
          <strong>Conversation content</strong> — the messages you exchange
          with the assistant. These may include health information you choose
          to share (see section 5). Guests: kept only in your browser, never
          stored server-side. Accounts: stored server-side, linked only to
          your account ID, so your history follows you across devices.
        </li>
        <li>
          <strong>Session data</strong> — a random session token (accounts) or
          a random anonymous ID (guests), held in cookies so the service
          works. Details in the{" "}
          <Link href="/legal/cookies">Cookie Policy</Link>.
        </li>
        <li>
          <strong>IP address</strong> — processed transiently to enforce rate
          limits that protect the service from abuse, and present in standard,
          short-lived infrastructure logs. We do not link IP addresses to your
          conversations or analytics.
        </li>
        <li>
          <strong>Usage analytics (only with your consent)</strong> —
          first-party event counts (pages visited, features used, error rates,
          session duration) and coarse browser/OS type, tied to a pseudonymous
          session identifier. Analytics never includes conversation content,
          email addresses, or IP addresses, and our server actively discards
          any free-text values as a backstop.
        </li>
        <li>
          <strong>Feedback surveys (optional)</strong> — if you fill in the
          feedback survey: a rating, structured answers, and any comments you
          write. Survey responses are stored without your name, email, or any
          identifier that could link them back to your account, and the form
          asks you not to include personal or medical details.
        </li>
      </ul>
      <p>
        We collect nothing else. In particular, we do not collect precise
        location, contacts, advertising identifiers, or data from data
        brokers, and we do not track you across other websites or apps.
      </p>

      <h2>5. Health information and your explicit consent</h2>
      <p>
        Anything you type about symptoms or health is &ldquo;special
        category&rdquo; data under Article 9 GDPR and receives our strictest
        handling. We process it <strong>only</strong> because and while you
        explicitly choose to share it with the assistant, only to generate the
        responses and doctor summaries you request, and for no other purpose.
        You give this explicit consent by submitting health information in the
        chat after having been informed through this policy and the notices
        shown in the app; you may withdraw it at any time by stopping use,
        deleting individual conversations, or deleting your account — after
        which the corresponding data is gone from our systems (section 10).
      </p>
      <p>We commit that conversation content is:</p>
      <ul>
        <li>never used for advertising or marketing;</li>
        <li>never sold, rented, or shared with data brokers;</li>
        <li>never used to train AI models — by us or by our AI provider;</li>
        <li>never included in analytics or surveys;</li>
        <li>
          never read by our staff, except where strictly necessary to
          investigate abuse, a security incident, or a legal obligation — and
          then only the minimum necessary.
        </li>
      </ul>
      <p>
        Practical advice: share only what is needed to describe your concern.
        You do not need to (and should not) include your full name, national
        ID numbers, or other people&rsquo;s identifying details in a chat.
      </p>

      <h2>6. Why we process your data, and on what legal basis</h2>
      <table>
        <thead>
          <tr>
            <th>Purpose</th>
            <th>Data</th>
            <th>Legal basis (GDPR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Providing the chat service and generating responses</td>
            <td>Conversation content, session data</td>
            <td>
              Performance of a contract (Art. 6(1)(b)); for health data, your
              explicit consent (Art. 9(2)(a))
            </td>
          </tr>
          <tr>
            <td>Creating and operating your account; syncing chat history</td>
            <td>Email, password hash, account chats</td>
            <td>Performance of a contract (Art. 6(1)(b))</td>
          </tr>
          <tr>
            <td>Verification and password-reset emails</td>
            <td>Email address</td>
            <td>Performance of a contract (Art. 6(1)(b))</td>
          </tr>
          <tr>
            <td>Security, abuse prevention, and rate limiting</td>
            <td>IP address, session identifiers</td>
            <td>
              Legitimate interests (Art. 6(1)(f)): keeping the service safe,
              available, and affordable
            </td>
          </tr>
          <tr>
            <td>Usage analytics</td>
            <td>Pseudonymous events, coarse browser/OS</td>
            <td>Your consent (Art. 6(1)(a)) — via the cookie banner</td>
          </tr>
          <tr>
            <td>Product feedback</td>
            <td>Survey responses (no identifiers)</td>
            <td>Your consent (Art. 6(1)(a)) — by submitting the survey</td>
          </tr>
          <tr>
            <td>Complying with law and defending legal claims</td>
            <td>The minimum required</td>
            <td>
              Legal obligation (Art. 6(1)(c)); legitimate interests
              (Art. 6(1)(f))
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Where we rely on consent, you can withdraw it at any time without
        affecting your use of the core service — rejecting analytics cookies
        never limits the assistant. Where we rely on legitimate interests, you
        have the right to object (section 12).
      </p>

      <h2>7. Who processes data on our behalf</h2>
      <p>
        We do not share your personal data with anyone for their own purposes.
        A small number of service providers (&ldquo;processors&rdquo;) handle
        data strictly on our documented instructions, under data-processing
        agreements, and only to run Helagi:
      </p>
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Role</th>
            <th>What they process</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Anthropic (USA)</td>
            <td>AI model provider (Claude API)</td>
            <td>
              Conversation content, transmitted server-to-server to generate
              each response and doctor summary. Under Anthropic&rsquo;s
              commercial API terms, inputs and outputs are not used to train
              their models.
            </td>
          </tr>
          <tr>
            <td>Vercel (USA)</td>
            <td>Hosting and content delivery</td>
            <td>
              All service traffic in transit; standard short-lived request
              logs (including IP addresses)
            </td>
          </tr>
          <tr>
            <td>Upstash (USA)</td>
            <td>Database (Redis)</td>
            <td>
              Account records, sessions, account chat history, rate-limit
              counters, analytics counters, survey responses
            </td>
          </tr>
          <tr>
            <td>Resend (USA)</td>
            <td>Transactional email</td>
            <td>
              Your email address and the content of verification and
              password-reset emails
            </td>
          </tr>
          <tr>
            <td>Google (USA) — only if you choose it</td>
            <td>&ldquo;Sign in with Google&rdquo;</td>
            <td>
              Handles the sign-in and confirms your verified email to us.
              Google&rsquo;s own privacy policy applies to your Google account.
            </td>
          </tr>
          <tr>
            <td>World Health Organization (Switzerland)</td>
            <td>ICD-11 medical terminology API</td>
            <td>
              Short medical search terms only (e.g. &ldquo;migraine&rdquo;) —
              never your identity, account, IP-linked profile, or full
              conversation
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Beyond these processors, we disclose personal data only if required by
        a valid legal order, to protect someone&rsquo;s life or safety, or —
        with the same protections and subject to this policy — as part of a
        corporate transaction such as a merger, in which case you will be
        notified. We never respond to informal data requests.
      </p>

      <h2>8. International transfers</h2>
      <p>
        We are based in Belgium; some of the providers above are in the United
        States, and Helagi is available worldwide. Whenever personal data
        leaves the European Economic Area, we rely on the safeguards the GDPR
        requires: an adequacy decision (including the EU&ndash;U.S. Data
        Privacy Framework for certified providers) and/or the European
        Commission&rsquo;s Standard Contractual Clauses, together with the
        technical measures in section 11. You can request a copy of the
        applicable safeguards via [PRIVACY CONTACT EMAIL].
      </p>

      <h2>9. Automated processing — no automated decisions</h2>
      <p>
        Helagi&rsquo;s responses are generated by an AI model, but Helagi does
        not make any decision about you that produces legal or similarly
        significant effects. The output is general information for you to
        discuss with a qualified professional, and nothing in the service
        profiles you for advertising or scoring of any kind.
      </p>

      <h2>10. How long we keep data</h2>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Kept for</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Guest conversations</td>
            <td>
              Never stored on our servers — they live in your browser tab and
              are gone when you leave
            </td>
          </tr>
          <tr>
            <td>Account conversations</td>
            <td>
              Until you delete the conversation or your account — deletion is
              immediate and permanent
            </td>
          </tr>
          <tr>
            <td>Account record (email, password hash)</td>
            <td>Until you delete your account (self-service, in Settings)</td>
          </tr>
          <tr>
            <td>Login sessions</td>
            <td>30 days after your last activity, then they expire</td>
          </tr>
          <tr>
            <td>Pending signup (unverified email)</td>
            <td>15 minutes, then automatically erased</td>
          </tr>
          <tr>
            <td>Password-reset tokens</td>
            <td>30 minutes or first use, whichever comes first</td>
          </tr>
          <tr>
            <td>Rate-limit records (IP-based)</td>
            <td>Rolling windows of 1 minute and 24 hours</td>
          </tr>
          <tr>
            <td>Analytics counters (with consent)</td>
            <td>Approximately 90 days</td>
          </tr>
          <tr>
            <td>Survey responses</td>
            <td>
              Counters ~90 days; the most recent responses are kept (oldest
              are discarded), with no link to your identity
            </td>
          </tr>
          <tr>
            <td>Infrastructure logs (hosting provider)</td>
            <td>Short, provider-standard periods</td>
          </tr>
          <tr>
            <td>Cookie-consent choice</td>
            <td>6 months, then we ask again</td>
          </tr>
        </tbody>
      </table>
      <p>
        When you delete your account, your chat history is deleted first, then
        the account record; sessions on all devices stop working immediately.
        We may retain the minimum data necessary to comply with a legal
        obligation or resolve an ongoing dispute, and only for as long as that
        reason exists.
      </p>

      <h2>11. How we protect your data</h2>
      <ul>
        <li>All traffic is encrypted in transit (TLS/HTTPS, with HSTS).</li>
        <li>
          Passwords are hashed with scrypt and a unique salt per account; we
          could not read your password even if we wanted to.
        </li>
        <li>
          Session tokens are long random values stored only server-side; your
          browser holds an opaque token in an httpOnly cookie that JavaScript
          on the page can never read.
        </li>
        <li>
          Chat history is keyed to your account server-side — no other account
          can ever address it.
        </li>
        <li>
          Password-reset and email-verification codes are stored only as
          cryptographic hashes.
        </li>
        <li>
          Strict security headers (content-security-policy, frame blocking,
          referrer suppression) and same-origin checks on every API route.
        </li>
        <li>
          Provider error details are kept in server logs only; your browser
          never receives internal system information.
        </li>
      </ul>
      <p>
        No internet service can promise perfect security. If a breach ever
        creates a risk to you, we will notify the competent supervisory
        authority within 72 hours and affected users without undue delay, as
        the GDPR requires.
      </p>

      <h2>12. Your rights</h2>
      <p>
        Wherever you live, we extend the same core rights to you. You can, at
        any time and free of charge:
      </p>
      <ul>
        <li>
          <strong>Access</strong> the personal data we hold about you and get
          a copy in a portable, machine-readable format;
        </li>
        <li>
          <strong>Correct</strong> inaccurate data (your email address can be
          verified again after a change);
        </li>
        <li>
          <strong>Delete</strong> your data — individual conversations and
          your entire account are self-service, no questions asked;
        </li>
        <li>
          <strong>Withdraw consent</strong> (e.g. analytics via the
          &ldquo;Cookie settings&rdquo; link in the footer) — withdrawal stops
          the processing immediately and never degrades the core service;
        </li>
        <li>
          <strong>Object</strong> to processing based on legitimate interests,
          and <strong>restrict</strong> processing while a request is handled;
        </li>
        <li>
          <strong>Complain</strong> to a supervisory authority (below).
        </li>
      </ul>
      <p>
        To exercise any right that is not self-service, email [PRIVACY CONTACT
        EMAIL] from the address on your account (that is how we verify it is
        really you — we will never ask you for your password). We respond
        within one month. We do not discriminate against you in any way for
        exercising your rights.
      </p>

      <h2>13. Region-specific information</h2>
      <p>
        <strong>European Economic Area, United Kingdom, Switzerland.</strong>{" "}
        Our lead supervisory authority is the Belgian Data Protection
        Authority (Gegevensbeschermingsautoriteit / Autorité de protection des
        données), Rue de la Presse 35, 1000 Brussels,{" "}
        <a
          href="https://www.dataprotectionauthority.be"
          target="_blank"
          rel="noopener noreferrer"
        >
          dataprotectionauthority.be
        </a>
        . You may also complain to the authority of your own country of
        residence or place of work.
      </p>
      <p>
        <strong>United States (including California).</strong> We do not sell
        or share personal information as defined by the California Consumer
        Privacy Act, we do not use sensitive personal information beyond
        providing the service you request, and we honor the rights to know,
        delete, correct, and non-discrimination described above. Because we
        never sell or share data, there is nothing to opt out of; we treat
        Global Privacy Control signals as a rejection of optional cookies.
        Helagi is not a &ldquo;covered entity&rdquo; or &ldquo;business
        associate&rdquo; under HIPAA, and your conversations are not medical
        records — but we protect them as described in this policy regardless.
      </p>
      <p>
        <strong>Brazil.</strong> We process personal data as described above
        under the corresponding legal bases of the LGPD (consent, contract
        performance, and legitimate interest), and you may exercise the rights
        in Article 18 LGPD — including confirmation, access, correction,
        anonymization, deletion, and information about sharing — via [PRIVACY
        CONTACT EMAIL]. Complaints may be directed to the ANPD.
      </p>
      <p>
        <strong>Canada.</strong> We process personal information with your
        consent or as reasonably required to provide the service, consistent
        with PIPEDA&rsquo;s fair information principles. You may access and
        correct your information and complain to the Office of the Privacy
        Commissioner of Canada.
      </p>
      <p>
        <strong>Australia.</strong> We handle personal information (including
        health information) consistently with the Australian Privacy
        Principles; complaints may be directed to us first and then to the
        OAIC.
      </p>
      <p>
        <strong>Everywhere else.</strong> The protections in this policy apply
        to every user of Helagi worldwide. Where your local law grants
        additional rights, we will honor them; contact us and we will work it
        out.
      </p>

      <h2>14. Children</h2>
      <p>
        Helagi is not directed at children and is not intended for use by
        anyone under 16 (or the higher age your country requires for consent
        to the processing of health data). We do not knowingly collect
        personal data from children. If you believe a child has used Helagi
        and shared personal data, contact [PRIVACY CONTACT EMAIL] and we will
        delete it.
      </p>

      <h2>15. Changes to this policy</h2>
      <p>
        When we change this policy, we will update the date at the top and,
        for material changes, show a clear notice in the app before the change
        takes effect. If a change requires new consent (for example, a new
        purpose for health data), we will ask for it — we will never rely on
        silence for anything that matters.
      </p>

      <h2>16. Contact</h2>
      <p>
        [COMPANY LEGAL NAME], [REGISTERED ADDRESS], Belgium · enterprise
        number [BCE/KBO NUMBER] · [PRIVACY CONTACT EMAIL]. This policy is
        governed by Belgian law, without prejudice to mandatory protections
        you enjoy under the law of your country of residence.
      </p>
    </>
  );
}
