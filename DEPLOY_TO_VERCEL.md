Quick deploy instructions — Vercel

Option A — Fast: Deploy from your machine using Vercel CLI
1. Install Vercel CLI (requires Node.js and npm):

   npm i -g vercel

2. Login:

   vercel login

   Follow the emailed link (or choose your provider) to authenticate.

3. From the project root (`/workspaces/supreme`) run:

   vercel

   - Follow prompts: project name (press Enter to accept), link to existing (No) unless you already created one.
   - For production deploy in one step: `vercel --prod`.

Option B — Git integration (recommended for continuous deploys)
1. Push the repository to GitHub (or GitLab/Bitbucket):

   git init
   git add .
   git commit -m "Initial site"
   # create a remote on GitHub and push
   git remote add origin <your-git-remote-url>
   git push -u origin main

2. Go to https://vercel.com, sign in, choose "New Project" → import your Git repo.
   - Configure root directory: `/` (default).
   - Framework Preset: "Other" / Static Site.
   - Vercel will detect the static files; no build step required.

3. After import, Vercel will deploy automatically on pushes to `main` (you can change this in project settings).

Notes & tips
- `vercel.json` is included to force static deployment and to provide SPA fallback (routes -> index.html).
- If you later add build steps (e.g., a bundler), update Vercel settings or add a `build` script in `package.json`.
- To set a custom domain, go to Project Settings → Domains and follow the DNS instructions.

If you want, I can:
- Run the `vercel` command from this environment (I will need you to confirm and to be present to complete the auth step), or
- Walk you through connecting your GitHub repo to Vercel and configuring domain/DNS.
