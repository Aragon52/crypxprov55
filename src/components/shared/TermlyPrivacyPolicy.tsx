import { Scale, Mail, MapPin, ExternalLink, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';

export const TermlyPrivacyPolicy = () => {
  return (
    <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
      {/* Exemption Notice */}
      <div className="p-5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive-foreground space-y-2">
        <h4 className="font-extrabold text-red-500 flex items-center gap-2 text-sm sm:text-base">
          <ShieldCheck size={18} /> FULL DEVELOPER & OPERATOR LIABILITY EXEMPTION
        </h4>
        <p className="text-xs text-red-400/95 leading-relaxed">
          <strong>IMPORTANT LEGAL NOTICE:</strong> By registering, signing up, or interacting with CrypX-Pro, the user agrees that the software development team, independent developers, software authors, and platform operators are completely exempt from any liability, claims, financial damages, legal disputes, or losses. The application is a simulated crypto exchange platform for educational purposes and does not process real financial assets or payments.
        </p>
      </div>

      {/* Main Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Scale className="text-primary" size={24} />
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Privacy Policy</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar size={14} className="text-primary/70" />
          <span>Last Updated: <strong>August 16, 2026</strong></span>
        </div>
      </div>

      {/* Intro */}
      <div className="space-y-4">
        <p className="text-foreground/90 font-medium">
          This Privacy Notice for <strong>CrypX-PRO</strong> ("<strong>we</strong>," "<strong>us</strong>," or "<strong>our</strong>"), describes how and why we might access, collect, store, use, and/or share ("<strong>process</strong>") your personal information when you use our services ("<strong>Services</strong>"), including when you:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Visit our website at <a href="https://crypxpro.com" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 font-bold">https://crypxpro.com <ExternalLink size={12} /></a> or any website of ours that links to this Privacy Notice.
          </li>
          <li>
            Use <strong>A crypto exchange platform</strong>. This site has been built to deliver a smooth and premium touch for both beginners and experienced traders trying to improve in the cryptocurrency trading field. It is a demo trading platform intended for learning and practicing daily operations in the real world later. There are <strong>no real financial assets, real payments, or live transactions included</strong>, but only premium polished designs to make everything perfect, safe, and realistic.
          </li>
          <li>
            Engage with us in other related ways, including any marketing, inquiries, or customer support.
          </li>
        </ul>
        <p>
          <strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <a href="mailto:admin@crypxpro.com" className="text-primary hover:underline font-bold">admin@crypxpro.com</a>.
        </p>
      </div>

      {/* Key Highlights */}
      <div className="p-5 rounded-2xl bg-muted/50 border border-border space-y-3">
        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
          <AlertCircle size={16} className="text-primary" /> Key Summary Points
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-foreground block">What we process:</span>
            <span>Profile credentials like email, username, and simulated trade records to maintain your learning state.</span>
          </div>
          <div className="space-y-1">
            <span className="font-bold text-foreground block">Sensitive information:</span>
            <span>We do not process sensitive personal information (racial origin, sexual orientation, beliefs).</span>
          </div>
          <div className="space-y-1">
            <span className="font-bold text-foreground block">Third-party collection:</span>
            <span>We do not collect or purchase any personal information from external third parties.</span>
          </div>
          <div className="space-y-1">
            <span className="font-bold text-foreground block">How we protect it:</span>
            <span>We utilize robust technical and organizational security procedures to keep your credentials fully safe.</span>
          </div>
        </div>
      </div>

      {/* TOC */}
      <div className="space-y-2 border-y border-border/60 py-4">
        <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">Table of Contents</h3>
        <ol className="list-decimal pl-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          <li><a href="#toc-1" className="text-primary hover:underline">What Information Do We Collect?</a></li>
          <li><a href="#toc-2" className="text-primary hover:underline">How Do We Process Your Information?</a></li>
          <li><a href="#toc-3" className="text-primary hover:underline">What Legal Bases Do We Rely On?</a></li>
          <li><a href="#toc-4" className="text-primary hover:underline">When and With Whom Do We Share?</a></li>
          <li><a href="#toc-5" className="text-primary hover:underline">Do We Use Cookies & Tracking?</a></li>
          <li><a href="#toc-6" className="text-primary hover:underline">How Do We Handle Social Logins?</a></li>
          <li><a href="#toc-7" className="text-primary hover:underline">How Long Do We Keep Your Data?</a></li>
          <li><a href="#toc-8" className="text-primary hover:underline">How Do We Keep Your Data Safe?</a></li>
          <li><a href="#toc-9" className="text-primary hover:underline">Do We Collect From Minors?</a></li>
          <li><a href="#toc-10" className="text-primary hover:underline">What Are Your Privacy Rights?</a></li>
          <li><a href="#toc-11" className="text-primary hover:underline">Do-Not-Track Controls</a></li>
          <li><a href="#toc-12" className="text-primary hover:underline">Do We Make Updates to This Notice?</a></li>
          <li><a href="#toc-13" className="text-primary hover:underline">How Can You Contact Us?</a></li>
          <li><a href="#toc-14" className="text-primary hover:underline">Review, Update or Delete Your Data</a></li>
        </ol>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {/* Sec 1 */}
        <section id="toc-1" className="space-y-3">
          <h3 className="text-base font-bold text-foreground">1. What Information Do We Collect?</h3>
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Personal information you disclose to us</h4>
            <p>
              We collect personal information that you voluntarily provide to us when you register on the Services, express interest in obtaining information about us or our mock trading operations, or otherwise contact us.
            </p>
            <p>
              <strong>Personal Information Provided by You:</strong> The information we collect depends on your interactions, but may include:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Email addresses</li>
              <li>Usernames</li>
              <li>Passwords</li>
              <li>Names</li>
              <li>Contact preferences</li>
            </ul>
            <p>
              <strong>Sensitive Information:</strong> We do not process sensitive personal information.
            </p>
            <p>
              <strong>Social Media Login Data:</strong> We may provide you with the option to register with us using your existing social media accounts (like Facebook or Google).
            </p>
            <p>
              <strong>Google API Services:</strong> Our use of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 font-semibold">Google API Services User Data Policy <ExternalLink size={11} /></a>, including its Limited Use requirements.
            </p>
          </div>
        </section>

        {/* Sec 2 */}
        <section id="toc-2" className="space-y-3">
          <h3 className="text-base font-bold text-foreground">2. How Do We Process Your Information?</h3>
          <p>
            We process your information to provide, improve, and administer our Services, communicate with you, manage security, prevent fraud, and comply with laws.
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>To facilitate account creation and authentication:</strong> Managing your secure logins and keeping your account in proper working order.</li>
            <li><strong>To request feedback:</strong> Contacting you about your evaluation of our simulated exchange.</li>
            <li><strong>To deliver targeted advertising:</strong> Displaying personalized content tailored to your preferences.</li>
            <li><strong>To determine marketing effectiveness:</strong> Understanding promotional campaigns.</li>
            <li><strong>To save or protect an individual's vital interest:</strong> Preventing physical or legal harm.</li>
          </ul>
        </section>

        {/* Sec 3 */}
        <section id="toc-3" className="space-y-3">
          <h3 className="text-base font-bold text-foreground">3. What Legal Bases Do We Rely On?</h3>
          <p>
            We only process your personal information when we believe it is necessary and we have a valid legal reason (legal basis) to do so under applicable law, such as with your consent, to comply with laws, to enter into or fulfill our contractual obligations, or to protect your rights.
          </p>
          <p>
            If you are located in the <strong>EU, UK, or Canada</strong>, we rely on valid legal bases under the GDPR, UK GDPR, or PIPEDA, including:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Explicit Consent:</strong> Where you have given us clear permission for a specific purpose.</li>
            <li><strong>Legitimate Interests:</strong> To improve user experience, manage promotional activities, and support marketing safely.</li>
            <li><strong>Legal Obligations:</strong> Compliance with cooperation requests or litigation evidence.</li>
            <li><strong>Vital Interests:</strong> Protecting immediate safety.</li>
          </ul>
        </section>

        {/* Sec 4 */}
        <section id="toc-4" className="space-y-3">
          <h3 className="text-base font-bold text-foreground">4. When and With Whom Do We Share?</h3>
          <p>
            We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company. We do not sell or lease personal data to external advertisers.
          </p>
        </section>

        {/* Sec 5 */}
        <section id="toc-5" className="space-y-3">
          <h3 className="text-base font-bold text-foreground">5. Do We Use Cookies & Tracking?</h3>
          <p>
            We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. These help us maintain site security, prevent crashes, fix layout bugs, and save your preferences.
          </p>
        </section>

        {/* Sec 6 */}
        <section id="toc-6" className="space-y-3">
          <h3 className="text-base font-bold text-foreground">6. How Do We Handle Social Logins?</h3>
          <p>
            If you register or log in using a third-party social media account, we receive certain profile information (such as name, email address, profile picture, etc.) from that provider. We use this strictly to facilitate authentication and account setup.
          </p>
        </section>

        {/* Sec 7 */}
        <section id="toc-7" className="space-y-3">
          <h3 className="text-base font-bold text-foreground">7. How Long Do We Keep Your Data?</h3>
          <p>
            We only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice. No purpose in this notice will require us to keep your personal information for longer than <strong>one (1) month</strong> past the start of the idle period of your account.
          </p>
        </section>

        {/* Sec 8 */}
        <section id="toc-8" className="space-y-3">
          <h3 className="text-base font-bold text-foreground">8. How Do We Keep Your Data Safe?</h3>
          <p>
            We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, please remember that no electronic transmission or storage is 100% secure, and transmission is at your own risk.
          </p>
        </section>

        {/* Sec 9 */}
        <section id="toc-9" className="space-y-3">
          <h3 className="text-base font-bold text-foreground">9. Do We Collect From Minors?</h3>
          <p>
            We do not knowingly collect, solicit data from, or market to children under 18 years of age. By using the Services, you represent that you are at least 18 years of age or the parent/guardian of a minor using the platform. If we detect data from minors under 18, we will immediately deactivate the account and delete the records.
          </p>
        </section>

        {/* Sec 10 */}
        <section id="toc-10" className="space-y-3">
          <h3 className="text-base font-bold text-foreground">10. What Are Your Privacy Rights?</h3>
          <p>
            In certain regions, such as the European Economic Area (EEA), United Kingdom (UK), Switzerland, and Canada, you have rights that allow greater access to and control over your personal information. These include the right to request access, obtain a copy, request rectification or erasure, restrict processing, or data portability. You can make such requests at <a href="mailto:admin@crypxpro.com" className="text-primary hover:underline font-semibold">admin@crypxpro.com</a>.
          </p>
        </section>

        {/* Sec 11 */}
        <section id="toc-11" className="space-y-3">
          <h3 className="text-base font-bold text-foreground">11. Controls for Do-Not-Track Features</h3>
          <p>
            Most web browsers and operating systems include a Do-Not-Track ("DNT") signal. Because there is currently no uniform standard for recognizing these, we do not respond to automated DNT browser signals.
          </p>
        </section>

        {/* Sec 12 */}
        <section id="toc-12" className="space-y-3">
          <h3 className="text-base font-bold text-foreground">12. Do We Make Updates to This Notice?</h3>
          <p>
            Yes, we will update this notice as necessary to remain compliant with relevant laws and platform transparency standards.
          </p>
        </section>

        {/* Sec 13 */}
        <section id="toc-13" className="space-y-4">
          <h3 className="text-base font-bold text-foreground">13. How Can You Contact Us?</h3>
          <p>
            If you have questions or comments about this notice, you may email us at <a href="mailto:admin@crypxpro.com" className="text-primary hover:underline font-semibold">admin@crypxpro.com</a> or contact us by post at:
          </p>
          <div className="p-4 rounded-xl bg-muted/60 border border-border flex items-start gap-3">
            <MapPin className="text-primary shrink-0 mt-0.5" size={16} />
            <div className="text-xs space-y-1">
              <span className="font-bold text-foreground block text-sm">CrypX-PRO Headquarters</span>
              <span>710 County Road 3141 East</span>
              <br />
              <span>Cleveland, TX 77327</span>
              <br />
              <span>United States</span>
            </div>
          </div>
        </section>

        {/* Sec 14 */}
        <section id="toc-14" className="space-y-3">
          <h3 className="text-base font-bold text-foreground">14. Review, Update or Delete Your Data</h3>
          <p>
            Based on the applicable laws of your country, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. To exercise your rights, you can submit a request to <a href="mailto:admin@crypxpro.com" className="text-primary hover:underline font-semibold">admin@crypxpro.com</a>.
          </p>
          <div className="text-[11px] pt-4 text-muted-foreground border-t border-border/40">
            This Privacy Policy was created and formatted in full compliance with Termly's Privacy Policy Generator guidelines.
          </div>
        </section>
      </div>
    </div>
  );
};
