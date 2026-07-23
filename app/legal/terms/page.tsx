// Terms of Use — drafted for a Belgian company operating a free, worldwide,
// consumer-facing AI health-information service. Version 1.0 must match
// TERMS_VERSION in lib/consent.ts: bumping that constant re-asks every
// visitor to accept, so bump it whenever this document materially changes.
//
// Drafting notes (keep in mind when editing):
// - Liability and warranty clauses deliberately carve out what EU/Belgian
//   consumer law forbids excluding (intent, fraud, death/personal injury
//   from negligence, mandatory statutory rights). Overreaching would risk
//   the whole clause being struck as unfair (Directive 93/13/EEC).
// - Consumers keep their home-country mandatory protections and courts
//   (Rome I art. 6, Brussels I bis art. 18) — stated explicitly on purpose.
// - Bracketed [PLACEHOLDERS] are company facts to fill in before launch.

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use — Helagi",
  description:
    "The agreement that governs your use of Helagi: what the service is and is not, your responsibilities, and the limits of ours.",
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Use</h1>
      <p className="updated">Last updated: 23 July 2026 · Version 1.0</p>

      <h2>1. Who we are and what you are agreeing to</h2>
      <p>
        These Terms of Use (the &ldquo;Terms&rdquo;) are an agreement between
        you and [COMPANY LEGAL NAME] ([LEGAL FORM]), a company incorporated in
        Belgium, registered office at [REGISTERED ADDRESS], enterprise number
        [BCE/KBO NUMBER] (&ldquo;Helagi&rdquo;, &ldquo;we&rdquo;,
        &ldquo;us&rdquo;). They govern your use of the Helagi website and chat
        service (the &ldquo;Service&rdquo;).
      </p>
      <p>
        You accept these Terms through the notice shown when you first use the
        Service, and you re-confirm acceptance whenever we publish a
        materially revised version. If you do not agree, do not use the
        Service. The <Link href="/legal/privacy">Privacy Policy</Link>,{" "}
        <Link href="/legal/cookies">Cookie Policy</Link>, and{" "}
        <Link href="/legal/medical-disclaimer">Medical Disclaimer</Link> form
        part of your relationship with us; the Medical Disclaimer is
        incorporated into these Terms.
      </p>

      <h2>2. The most important term: Helagi is not a doctor</h2>
      <p>
        The Service uses artificial intelligence to provide{" "}
        <strong>general health information</strong> and to help you prepare
        for a conversation with a qualified healthcare professional. You
        acknowledge and agree that:
      </p>
      <ul>
        <li>
          the Service does <strong>not</strong> provide medical advice,
          diagnosis, or treatment, and its responses are not a substitute for
          the judgment of a licensed clinician who can examine you;
        </li>
        <li>
          no doctor&ndash;patient or other professional relationship is
          created by using the Service;
        </li>
        <li>
          the Service is <strong>not for emergencies</strong> — if you may be
          experiencing one, call your local emergency number (such as 112 or
          911) immediately instead of using the Service;
        </li>
        <li>
          AI-generated responses can be inaccurate, incomplete, or outdated,
          even when they sound confident, and you must verify any
          health-related information with a qualified professional before
          acting on it;
        </li>
        <li>
          you will not make, delay, or change any medical decision — including
          starting or stopping medication — on the basis of the Service alone;
        </li>
        <li>
          the &ldquo;Summary for your doctor&rdquo; feature produces a
          conversation aid, not a medical record, and its content must be
          reviewed by you and your clinician;
        </li>
        <li>
          the Service is not a medical device and has not been reviewed or
          approved by any medicines, medical-device, or health authority. Use
          of World Health Organization ICD-11 terminology does not imply WHO
          endorsement of the Service or its responses.
        </li>
      </ul>

      <h2>3. Who may use the Service</h2>
      <p>
        You must be at least 16 years old (or older where your local law
        requires a higher age for services like this). If you are a minor
        under the law of your country, you may use the Service only with the
        agreement of a parent or legal guardian, who is then bound by these
        Terms. By using the Service you confirm you meet these requirements
        and that you are not barred from using it under applicable law.
      </p>

      <h2>4. The Service is a free prototype (for now)</h2>
      <p>
        The Service is currently provided free of charge, during a prototype
        phase. Because of that, you agree that we may modify features, impose
        or change usage limits (such as daily message caps and chat-history
        caps — older conversations beyond those caps are deleted), suspend the
        Service for maintenance, or discontinue it. If we discontinue the
        Service or introduce paid plans, we will give reasonable advance
        notice in the app, and you will always be able to delete your account
        and data first. We never charge you without your explicit prior
        agreement.
      </p>

      <h2>5. Accounts and guest use</h2>
      <ul>
        <li>
          You may use the Service as a guest (no account, chats not stored on
          our servers) or with an account (email and password, or Google
          sign-in), which stores your chat history as described in the{" "}
          <Link href="/legal/privacy">Privacy Policy</Link>.
        </li>
        <li>
          Keep your credentials confidential; you are responsible for
          activity under your account unless it results from our failure to
          secure the Service. Tell us promptly at [PRIVACY CONTACT EMAIL] if
          you believe your account is compromised.
        </li>
        <li>One account per person; provide a real email address you control.</li>
        <li>
          You can delete your account at any time in Settings — deletion is
          immediate and removes your chat history, as described in the
          Privacy Policy.
        </li>
      </ul>

      <h2>6. Acceptable use</h2>
      <p>Using the Service, you agree not to:</p>
      <ul>
        <li>break any applicable law or infringe anyone&rsquo;s rights;</li>
        <li>
          submit personal data about another person — especially health data —
          unless you are legally entitled to do so (for example, as the
          parent or guardian of a minor in your care);
        </li>
        <li>
          use the Service to produce content that is unlawful or intended to
          harm, harass, or deceive others;
        </li>
        <li>
          probe, overload, or interfere with the Service or its security, or
          attempt to bypass rate limits, usage caps, or access controls;
        </li>
        <li>
          access the Service by automated means (bots, scrapers, bulk API
          calls) or use it to build a dataset, except as permitted by us in
          writing;
        </li>
        <li>
          resell, sublicense, or offer the Service to third parties as your
          own, or use it to provide medical or diagnostic services to others;
        </li>
        <li>
          copy, modify, or reverse-engineer the Service, except to the extent
          a law that cannot be contractually waived allows it;
        </li>
        <li>
          misrepresent the Service&rsquo;s responses as coming from a human
          clinician or as a medical diagnosis.
        </li>
      </ul>
      <p>
        We may suspend or terminate access that violates this section (see
        section 11).
      </p>

      <h2>7. Your content and our license to it</h2>
      <p>
        You keep all rights in what you type into the Service. You grant us
        only the limited license needed to operate the Service: to process,
        transmit, and (for account holders) store your messages in order to
        provide responses, summaries, and your chat history, as described in
        the Privacy Policy. We do not use your conversations for advertising
        or to train AI models, and this license ends when the corresponding
        content is deleted. You are responsible for what you submit and must
        have the right to submit it.
      </p>
      <p>
        If you send us feedback or suggestions, you allow us to use them to
        improve the Service without obligation or compensation — feedback is
        voluntary and never required.
      </p>

      <h2>8. Our intellectual property</h2>
      <p>
        The Service — including its software, design, name, and logo — belongs
        to us or our licensors and is protected by intellectual-property law.
        We grant you a personal, non-exclusive, non-transferable, revocable
        right to use the Service in accordance with these Terms. You may use
        the responses you receive for your own personal, non-commercial
        purposes, including sharing a doctor summary with your healthcare
        providers.
      </p>

      <h2>9. Warranties and the &ldquo;as is&rdquo; basis</h2>
      <p>
        We work hard to make the Service reliable and safe, but to the
        maximum extent permitted by applicable law, the Service is provided{" "}
        <strong>&ldquo;as is&rdquo; and &ldquo;as available&rdquo;</strong>,
        without warranties of any kind, express or implied — including
        accuracy, completeness, fitness for a particular purpose, and
        uninterrupted or error-free operation. AI output is probabilistic by
        nature; section 2 governs how you may rely on it.
      </p>
      <p>
        <strong>Your statutory rights are not affected.</strong> If the law of
        your country of residence grants you rights as a consumer that cannot
        be limited by contract — including conformity rights for digital
        services in the European Union — those rights prevail over this
        section to that extent.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        <strong>Nothing in these Terms excludes or limits our liability
        for:</strong> our fraud or intentional misconduct; our gross
        negligence; death or personal injury caused by our negligence; or any
        other liability that applicable law does not allow to be excluded or
        limited.
      </p>
      <p>Subject to that paragraph, and to the extent permitted by law:</p>
      <ul>
        <li>
          we are not liable for indirect or consequential losses, loss of
          data caused by circumstances outside our reasonable control, or
          losses arising from your breach of these Terms;
        </li>
        <li>
          we are not liable for the consequences of medical decisions made
          contrary to section 2 — that is, decisions made in reliance on the
          Service alone, without consulting a qualified professional, or
          delaying emergency care to use the Service;
        </li>
        <li>
          we are not liable for events beyond our reasonable control,
          including outages of the third-party infrastructure and AI
          providers identified in the Privacy Policy (force majeure);
        </li>
        <li>
          our total aggregate liability to you arising out of or relating to
          the Service is limited to the greater of (a) the amounts you paid
          us for the Service in the 12 months before the event giving rise to
          the claim, and (b) &euro;100.
        </li>
      </ul>
      <p>
        If you are a consumer, you always retain the mandatory protections of
        the law of the country where you live, and nothing in this section
        reduces them.
      </p>

      <h2>11. Suspension and termination</h2>
      <p>
        You may stop using the Service at any time and, if you have an
        account, delete it in Settings. We may suspend or terminate your
        access if you materially breach these Terms (including section 6), if
        we are required to by law, or if we discontinue the Service under
        section 4. Unless the breach is serious, ongoing, or we are legally
        prevented from doing so, we will tell you the reason and, where
        appropriate, give you a chance to remedy it first. Termination does
        not deprive you of the right to obtain a copy of your data
        beforehand where the Privacy Policy provides for it, and sections 2,
        7&ndash;10, and 12&ndash;14 survive termination.
      </p>

      <h2>12. Changes to these Terms</h2>
      <p>
        We may revise these Terms — for example, when we add features, change
        legal requirements apply, or the prototype phase ends. For material
        changes we will show the revised version in the app and ask you to
        accept it before continuing to use the Service; the version and date
        at the top of this page will always tell you what you agreed to.
        Changes never apply retroactively, and if you do not accept a revised
        version you simply stop using the Service (and may delete your
        account and data first).
      </p>

      <h2>13. Governing law and where disputes are resolved</h2>
      <p>
        These Terms are governed by Belgian law, and disputes are subject to
        the competent courts of Brussels, Belgium —{" "}
        <strong>except that if you are a consumer</strong>, you additionally
        enjoy the mandatory consumer protections of the country where you
        live, and you may bring proceedings in, or be sued only in, the
        courts of that country where applicable law (including EU Regulation
        1215/2012) so provides. Nothing in this section takes away
        protections or forums the law of your habitual residence guarantees
        you.
      </p>
      <p>
        If you have a complaint, contact us first at [PRIVACY CONTACT EMAIL]
        — most issues are resolved that way. Consumers in Belgium and the EU
        may also contact the Belgian Consumer Mediation Service (Service de
        M&eacute;diation pour le Consommateur / Consumentenombudsdienst,
        Boulevard du Roi Albert II 8, 1000 Brussels,{" "}
        <a
          href="https://mediationconsommateur.be"
          target="_blank"
          rel="noopener noreferrer"
        >
          mediationconsommateur.be
        </a>
        ) for out-of-court dispute resolution.
      </p>

      <h2>14. General</h2>
      <ul>
        <li>
          <strong>Severability:</strong> if any provision of these Terms is
          held invalid or unenforceable, the remainder stays in force, and
          the invalid provision is replaced by a valid one that comes closest
          to its intent.
        </li>
        <li>
          <strong>No waiver:</strong> our not enforcing a provision is not a
          waiver of it.
        </li>
        <li>
          <strong>Assignment:</strong> you may not transfer your rights under
          these Terms without our consent; we may transfer ours as part of a
          corporate transaction, provided your rights under these Terms and
          the Privacy Policy are preserved and you are notified.
        </li>
        <li>
          <strong>Entire agreement:</strong> these Terms, together with the
          documents referenced in section 1, are the whole agreement between
          you and us about the Service.
        </li>
        <li>
          <strong>Language:</strong> these Terms are drafted in English. If we
          provide translations, the English version prevails to the extent
          your local law allows.
        </li>
      </ul>

      <h2>15. Contact</h2>
      <p>
        [COMPANY LEGAL NAME], [REGISTERED ADDRESS], Belgium · enterprise
        number [BCE/KBO NUMBER] · [PRIVACY CONTACT EMAIL].
      </p>
    </>
  );
}
