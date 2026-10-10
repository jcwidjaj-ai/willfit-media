# WillFit Media Studio

A bilingual English/French media workspace for WillFit Gym, Kinshasa. Black, yellow and white, using the supplied WillFit logo.

## What is included

- Weekly calendar: 5 feed items (varying reel/post mix) and 7 daily French Stories at 09:00 Kinshasa / 15:00 WIB.
- Editable English and French captions in the supplied WillFit format. The exact contact block, including the bold email lettering, is enforced at the bottom of every saved and copied caption.
- Creative briefs, editable posting dates/times, notes and approved-media links.
- Automatic green ticks on dates and content cards once the day has ended in Kinshasa. These show elapsed days, not publication status. No manual checklist.
- Specific nutrition and body stories: fact, practical example and interactive question/poll, with primary NIH/WHO/CDC sources.
- Posting reminders while the dashboard is open: an on-screen alert, optional browser notifications, per-device enable/disable and a test button. No push keys or notification hosting setup are needed.
- Team access through one shared code; no individual accounts needed.
- DRC national days incorporated as both feed content and stories, with Saturday observance when a holiday falls on Sunday.
- Plain-text export in the selected language.
- Sunday generation at 06:00 **Africa/Kinshasa** (12:00 WIB), preparing the coming Monday.
- Monday–Sunday in one calendar row, with Kinshasa/WIB previews and correct next-day dates.
- One weekly pre-launch podcast teaser inside the five feed items, inviting topic ideas from the community.
- Book, podcast and store shown at the bottom as future goals, not launched products.
- Instagram statistics panel awaiting Meta connection; no stats have been retrieved or fabricated. The user chose to connect Meta later.

## Honest status

The local version works. Hosting, live team sharing and unattended Sunday generation become active only after the Cloudflare deployment steps below. No Cloudflare resources or GitHub repository have been created by this project alone.

This free version uses a **prepared bilingual editorial library**, not a paid AI model. It changes formats, dates, and topic selection weekly, uses 20 general feed concepts, 4 future-podcast teaser ideas and 15 specific educational story ideas, and repeats concepts over time. Existing team edits, dates, media links and notes are preserved. When the planner version changes, untouched drafts are refreshed and edited captions keep their wording while the required contact footer is normalized. New weeks also load on demand as a fallback if the Sunday trigger is delayed or missed.

**Instagram posting is manual.** Drive links open approved files; the app neither reads your private Drive files nor publishes to Instagram. Direct publishing requires a separate Meta connection and suitable externally accessible media. No mock connection or non-working publish button is shown.

Instagram and Drive browsing were unavailable during setup. Class names were checked against WillFit’s own website. Story copy is original WillFit writing. Dr James’s website provides broad topic inspiration; educational facts link directly to NIH, WHO or CDC sources. Stories are not attributed quotations. Coach review is included in exercise briefs.

## Preview on your computer

On this Mac, double-click **Open WillFit.command** to start the preview and open the website. If you restart the computer and see “refused to connect”, open that file again. This address works only on your computer.

Alternatively, install Node.js 24 from its official website if needed, then open a terminal in this directory:

```sh
npm run preview
```

Open http://127.0.0.1:4173. The local preview uses `.local/studio.sqlite` on your computer and bypasses the team code only for this localhost server. Production never uses that bypass. Local changes are not copied to production automatically.

```sh
npm test
```

The tests cover bilingual weekly counts, the exact unique contact footer, WIB midnight/year boundaries, matching holiday stories, future podcast teasers, preservation of edits during upgrades, shared edits, conflict handling, access protection, invalid input, and idempotent Sunday generation.

## Free deployment through GitHub + Cloudflare

Vercel Hobby is restricted to personal, non-commercial use. WillFit’s business dashboard should not be deployed there under an assumption that it is free. This project targets Cloudflare Workers + D1, within their free quotas. A paid model and a custom domain are not required. Check provider terms and quotas before deploying.

1. Create or sign in to a **Cloudflare Free** account. Do not enable a paid Workers plan.
2. Under **Storage & databases → D1**, create a database named `willfit-media`. Copy its database ID.
3. Create a **private GitHub repository** and place the contents of this directory at the repository root. Include the hidden `.github` directory. Exclude `.local`, `.dev.vars`, `.env` files and any credentials.
4. In GitHub **Settings → Secrets and variables → Actions**, add:
   - Repository variable `WILLFIT_D1_ID`: the D1 database ID.
   - Repository secret `CLOUDFLARE_ACCOUNT_ID`: your Cloudflare account ID.
   - Repository secret `CLOUDFLARE_API_TOKEN`: an account-scoped deployment token with Workers Scripts Edit and D1 Edit. Use Cloudflare’s official API token interface; do not paste it into chat or commit it.
5. In GitHub **Actions → Deploy WillFit**, select **Run workflow**. The workflow runs tests, applies the schema, deploys the app and registers its Sunday trigger. Subsequent pushes to `main` redeploy automatically. No dependency install or front-end build is needed.
6. In Cloudflare, open the deployed worker → **Settings → Variables and Secrets**. Add a **secret** named `TEAM_KEY`, using a randomly generated value of at least 32 characters. Do not set `LOCAL_PREVIEW` on Cloudflare. Until a team code is set, calendar access fails closed.
7. Open the generated `https://willfit-media.<your-subdomain>.workers.dev` URL and enter the team code. Verify that a caption or note edited in one browser appears in another browser after refresh.
8. Check **Settings → Triggers** for `0 5 * * SUN` (05:00 UTC = 06:00 Kinshasa), then check its execution log after Sunday. This is a Cloudflare UTC cron expression; it does not use Vercel’s cron format.

For a shared link without typing a code, distribute `https://<your-site>/#access=<your-team-code>` privately to the team. The app removes the fragment immediately after exchanging it for a secure, HTTP-only cookie. Anyone with this link has full editing access. Treat it like a team password. Rotating `TEAM_KEY` revokes previous sessions and links. The code never goes in a query string.

Private GitHub Actions has a monthly free allowance. This small project is intended to fit within it; do not authorize paid overages. Cloudflare D1 and Workers also have free usage limits rather than unlimited service.

### Optional command-line deployment

Use Cloudflare’s official Wrangler CLI. After logging into your own Cloudflare account:

```sh
npx --yes wrangler@4 login
npx --yes wrangler@4 d1 create willfit-media
```

Replace the database ID placeholder in `wrangler.jsonc` with the returned ID, then:

```sh
npm run db:migrate
npx --yes wrangler@4 secret put TEAM_KEY
npm run deploy
```

If Wrangler requires the Worker to exist before setting a secret, deploy first, then set `TEAM_KEY`. Until then, the app returns an unavailable state rather than exposing team data.

## Routine maintenance

- Every week: review the plan, confirm class times, attach approved media, copy the complete final caption and post manually. Date ticks appear automatically after the Kinshasa day ends.
- Maintain feed ideas in `public/planner.mjs` and story facts in `public/story-library.mjs`. Increment the engine version to refresh untouched generated copy. Team-written text remains preserved.
- Annually: review DRC holiday announcements. The current baseline is the 30 March 2023 ordinance; ad hoc future holidays are not automatically scraped.
- Content scheduling supports 2025–2035; extend and verify the supported range if needed.
- The API uses row versions to prevent two teammates silently overwriting the same item. On conflict, reload before retrying. Caption drafts stay in the editor after a failed save. The editor shows the entire final caption, including its topic-specific CTA, hashtags and contact footer. Save and copy keep the required footer unique at the bottom.
- Back up production with Cloudflare D1 export. The local SQLite file is not a production backup.

## References

- Classes: https://willfitgym.com/pricing-page/
- National days: https://natlex.ilo.org/dyn/natlex2/natlex2/files/download/118102/COD-118102.pdf
- Physical activity: https://www.who.int/news-room/fact-sheets/detail/physical-activity
- Nutrition: https://www.who.int/news-room/fact-sheets/detail/healthy-diet
- Broad story inspiration: https://www.drjamesdinic.com/
- Vercel Hobby terms: https://vercel.com/docs/plans/hobby
- Workers free usage: https://developers.cloudflare.com/workers/platform/pricing/
- D1 free usage: https://developers.cloudflare.com/d1/platform/pricing/

WebMCP tools progressively enhance compatible browsers. Browser-based UI and WebMCP verification were unavailable because the app’s browser security check could not be verified. Server tests and static syntax checks passed; visual QA remains to be done in a permitted browser.

## Posting reminders while the dashboard is open

1. Click **Enable on this device**. If your browser supports notifications, allow them when prompted. If they are blocked or unsupported, an alert still appears inside the dashboard.
2. Click **Send a test** to check the alert.
3. Keep the page open and your device awake. The current week's saved plan is checked even when you are viewing a different week. Reminders follow Kinshasa time and display WIB as well; edited posting times update the next check.
4. Click **Open content** on an alert to open the matching card. **Turn off on this device** stops reminders. They also stop when the page is closed.

Checks run about every fifteen seconds. Browser throttling or device sleep can delay delivery; reminders older than five minutes are skipped to avoid stale alerts. Previously delivered time slots are remembered on that browser, and a moved posting time creates a new slot. No notification prompt appears automatically.

The earlier background-push code remains optional source material and is not used by the dashboard. Its minute-by-minute Cron Trigger is disabled. Public/private push keys are not required for the current deployment, and no closed-page delivery is enabled.

## Daily French Story images

Open a Story card to preview its 1080 × 1920 French graphic and download a PNG. Anton is the headline font; Barlow is the supporting font. Both are bundled with their open-source font licenses, so export does not depend on Google Fonts being online. The layout follows the supplied black/yellow/white Story reference. Keep text concise; oversized custom copy is rejected instead of silently clipped.

The calendar still offers English translations for the English-speaking team, but exported Story images are always French. There are seven Stories and five feed items each week. Each Story asks a reply question; the image does not contain a working Instagram poll sticker.

The dashboard selects prepared, scientifically sourced editorial topics. A separate daily assistant automation, “WillFit daily French Story”, prepares newly researched copy at 08:00 Kinshasa / 14:00 WIB, ahead of the intended 09:00 posting time. It uses this chat and local files. The computer must be on and the desktop app running. Its PNG and story.json output is saved under stories/YYYY-MM-DD; these files are not automatically uploaded or imported into the shared calendar.

To render a dated calendar Story locally with the bundled Node runtime:

```text
node scripts/render-story.mjs 2026-10-12
```

The renderer uses @napi-rs/canvas, supplied by this desktop's workspace dependencies. On another machine, install that package separately. A JSON item file can replace the date argument for newly researched content. The output explicitly records `publishing.status = "not-connected"`; no Instagram publishing action is currently implemented or enabled.

Before direct Story publishing, verify account eligibility and authorize a supported Meta connection. Meta's documented Instagram API with Facebook Login permits Story publishing for Business accounts, while WillFit was reported as Creator. The daily preparation automation is active; an Instagram Story has not been scheduled or posted. Hosting the calendar alone does not activate Meta publishing.
