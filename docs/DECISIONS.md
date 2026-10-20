# Decisions: Icare Clinic redesign pitch ("Iris Noir")

A redesign proposal for ikiavisioncenter.com (Icare Clinic, Ike Ikechi, OD, Houston TX). It is a pitch, not a launch:
every page is served with `noindex`, and canonical links point at the live site.

## Design and build decisions

| # | Decision | Why |
|---|---|---|
| D1 | **Structure kept exactly.** All 339 live pages that answered 200 are rebuilt at their own URLs, with the same header menu, footer menus, page hierarchy and copy. The 7 live redirects are carried as redirects. | The brief: capture the exact structure and architecture, then redesign. |
| D2 | **"Iris Noir": glassmorphism x tenebrism.** Dark, warm stages lit by one amber key light (the logo's orange iris, `#c25801`) and a teal rim light (the live Designer Optical band, `#00b0a9`); content on frosted glass (the lens) or on a lit ivory reading canvas. Instrument Serif + Manrope, self-hosted. | The brief: a total redesign that keeps the brand (logo, orange, black bands) and its friendly community tone. |
| D3 | **One template placeholder resolved.** The live home page prints "in our [CITY] office"; the rebuild prints "Houston", the city the site gives everywhere else. | A visible template leak; the value is the practice's own fact. |
| D4 | **ADD `/sitemap/`.** The live footer links /sitemap/, which answers 404; the rebuild lists every page there. | A dead footer link becomes a working one. |
| D5 | **Header mega panels.** "Eye Care Services" and "Eyeglasses & Contacts" open panels listing the pages that already exist under them (live titles). The six live menu items and their order are unchanged. | The live menu is flat; 120 + 47 pages sit under those two items. |
| D6 | **Generated imagery is illustrative and labelled.** fal stills and Higgsfield loops show eyewear, light and generic models only; none stands in for Dr. Ikechi, the staff, patients or the Houston office. Every generated file carries the IPTC `trainedAlgorithmicMedia` label. Real practice photos are used wherever the live site has them. | Honesty about AI imagery; the doctor and the office must be real photos. |
| D7 | **Home hero.** The live hero photo (1280x480) becomes a framed photo inside the welcome section; the full-bleed hero is a generated tenebrist portrait with a subtle Higgsfield loop. | A 1280 px photo paints soft on today's screens; the practice can swap in its own high-resolution photo or video. |
| D8 | **Forms are shown, not connected.** The appointment, contact and patient registration forms keep every live field and label, but post nowhere until the practice chooses a HIPAA-appropriate backend. | A static pitch must not collect patient data. |
| D9 | **Removed platform chrome.** "Powered by eyecarepro", the ecpbuilder "Login" link, analytics/tag manager, the keyed Google Maps embeds and the platform's scripts do not ship. The map becomes a click-to-load keyless embed. | Platform-free rebuild; no third-party requests on load. |
| D10 | **Dead live image omitted.** The home page's VSP "get vision coverage" banner image does not load on the live site either; its block is left out. Payment-method icons (platform images) are shown as text labels. | Nothing visible is lost. |

## For the practice to decide

| # | Item |
|---|---|
| B1 | The Yelp and Google links in the footer name an older address (Tomball/Spring, 23110 Kuykendahl Rd); the site's address is 14405B Bellaire Blvd, Houston, TX 77083. Which listings are current? |
| B2 | Ten links on the live site lead to pages that no longer exist (for example the myopia-management articles and two "Your Eye Health" articles). They are carried as they are; should they be removed or pointed elsewhere? |
| B3 | A form backend (HIPAA-appropriate) for the three forms. |
| B4 | High-resolution practice photography (the doctor, the team, the office) to replace generated or small images. |
| B5 | The library articles and blog posts appear to be vendor-syndicated content; confirm the practice may publish them off the current platform. |
| B6 | The live title of `/eye-care-services/myopia-management-optometrist/` reads "Myopia Management in Costa Mesa, CA | Optometrist Near You" (another city). It is carried as live; it should name Houston. |
