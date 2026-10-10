# Give the WillFit team a live link

The current address, `http://127.0.0.1:4173/`, is a preview on your Mac. It cannot be shared with the team. A live website stays available when your computer is off.

## The free setup prepared for WillFit

Use your GitHub account to keep the website files, and a Cloudflare **Workers Free** account to host the website and shared calendar. A custom domain is optional. Stay on the free plan; its usage limits apply. Vercel’s free Hobby plan is for personal, non-commercial use, so it is unsuitable for this gym’s business dashboard.

### 1. Open your accounts

- Sign in to GitHub: https://github.com/
- Sign in to Cloudflare, or create an account: https://dash.cloudflare.com/sign-up
- Keep the Cloudflare Workers plan **Free**. You do not need to buy a domain.

### 2. Put the website in GitHub

Download and unzip `WillFit-Media-Studio.zip`. Inside is a `willfit-media` folder.

Create a **private** GitHub repository, for example `willfit-media`. Put the contents of that folder at the repository root. Include the hidden `.github` folder, which contains the prepared publishing workflow. Do not upload `.local` or any private credentials. The supplied ZIP already excludes those files.

If using Finder, press **Command + Shift + .** to show hidden files so you can include `.github`.

### 3. Create the shared calendar database

In Cloudflare, open **Storage & databases → D1** and create a database named `willfit-media`. Copy the **Database ID**. This is an identifier, not a password.

### 4. Connect publishing

In your GitHub repository, open **Settings → Secrets and variables → Actions**.

Under **Variables**, add:

- `WILLFIT_D1_ID`: the Database ID from step 3.

Under **Secrets**, add:

- `CLOUDFLARE_ACCOUNT_ID`: your Cloudflare account ID, available in the Cloudflare account dashboard.
- `CLOUDFLARE_API_TOKEN`: a deployment token created in Cloudflare’s API token settings, scoped to your account, with Workers Scripts Edit and D1 Edit access. Follow Cloudflare’s current token guidance if an additional account-read permission is requested.

Enter credentials directly into the account settings. Do not paste them into chat or put them in website files. Open-page reminders do not require notification keys or another account.

### 5. Publish

In GitHub, open **Actions → Deploy WillFit → Run workflow**. Choose `main` and run it. The prepared workflow checks the app, creates the calendar tables and deploys the website and Sunday schedule.

When it completes successfully, find `willfit-media` under Cloudflare **Workers & Pages**.

### 6. Set the team code

Open the deployed Worker’s **Settings → Variables and Secrets**. Add a **secret** called `TEAM_KEY`. Choose a long private team code; the existing instructions recommend at least 32 characters. Save and deploy the secret if prompted.

Do not add `LOCAL_PREVIEW` to the hosted website. Before the team code is set, the calendar remains locked.

### 7. Share the real link

Cloudflare will display the actual `workers.dev` website address. Open it and enter the team code. Send the team that address and the code privately. Every team member will see the same calendar and saved edits.

For a single private access link, append `/#access=YOUR_TEAM_CODE` to the actual site address. Anyone with that link can edit the calendar. Use the separate code method if you prefer not to include it in the link.

Test one harmless note edit in two browsers to confirm it is shared. In Cloudflare’s Worker trigger settings, confirm the Sunday schedule is `0 5 * * SUN`: 06:00 Kinshasa / 12:00 WIB. Then each teammate can enable reminders while keeping the dashboard open.

The local preview’s saved edits are not uploaded automatically. If you edited captions or notes locally, export the plan before publishing and preserve any changes you want the team to use.

## If the local preview refuses to connect again

Double-click **Open WillFit.command** inside the website folder. It starts the preview and opens it in your browser. You may need to do this again after restarting your Mac.

## Official references

- Cloudflare free hosting: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare shared database limits: https://developers.cloudflare.com/d1/platform/pricing/
- Vercel Hobby restrictions: https://vercel.com/docs/plans/hobby

## Connect WillFit to Meta after publishing

Current status: the website can be hosted now. Instagram account login, live stats, and automatic publishing have not yet been implemented in the dashboard. Daily assistant preparation saves images on this Mac; it does not upload them to the hosted calendar. Meta account setup below prepares the connection.

1. In the Instagram app, open @willfit__gym and check its account type under the professional account tools. For the documented Instagram API with Facebook Login Story publishing flow, change Creator to Business if you choose to proceed with that flow. Menu wording can vary by app version. Keep the same Instagram profile.
2. Sign in to https://business.facebook.com/ with the Facebook profile authorized to manage WillFit. Select WillFit's business portfolio and check its settings for both the Facebook Page and @willfit__gym. If they are already linked, retain the existing connection. Complete any requested Instagram login or connection review. Have the owner grant the access Meta requests if an account is missing or inaccessible.
3. Open the Business Suite Planner and confirm Instagram is selectable. For an interim manual workflow, create a Story, upload a downloaded WillFit PNG, select Instagram and schedule it. Verify the scheduled date and timezone before submitting: 09:00 Kinshasa equals 15:00 WIB. This manually queues an image; it does not activate the dashboard's automation.
4. Sign in to https://developers.facebook.com/apps/ and create an app for WillFit's own Instagram integration. Associate it with the appropriate WillFit business portfolio and configure the Instagram/Facebook Login publishing flow according to the options Meta presents. Do not grant advertising or messaging access merely for Story publishing.
5. Provide the live dashboard URL and non-secret Meta App ID to the developer implementing the connection. Configure an exact HTTPS login callback only after the dashboard's actual callback endpoint exists. Add the privacy and data-deletion information Meta requests. Business verification and App Review requirements depend on the access level and who will authorize the app; complete the requirements shown for this app rather than assuming approval is automatic.
6. The implementation will securely store the app secret and access tokens on the server, let an authorized owner connect @willfit__gym, and verify publishing and insights permissions. Enter secrets directly into the hosting settings or the finished secure connection flow. Never put them in GitHub source, the shared team URL, or chat.
7. The daily publishing implementation also needs hosted PNG images accessible to Meta, an unattended rendering/publishing job at 08:00 UTC (09:00 Kinshasa), retries, duplicate prevention, and genuine platform success/failure status. The approved Drive folder URL alone is insufficient as an image-publishing URL. These parts are still to be built.
8. Once the account, integration and hosted job are ready, schedule one agreed test Story and verify it appears on Instagram. Then enable the approved daily French educational Stories and check the first automatic run. Keep the shared calendar edit code private to the team.

Meta's official API collection documents the Facebook Page connection, permissions and Business-only Story publishing limitation for this flow:
https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api?entity=request-23987686-fdf7020f-3cd0-4a5d-859b-66fb856b80b6

Meta's own Business Suite scheduling tutorial:
https://www.youtube.com/watch?v=PQjvbXyMhkM
