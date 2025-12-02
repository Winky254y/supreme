Auth server for Move It (local testing)

1) Install dependencies

```bash
cd server
npm install
```

2) Run server

```bash
npm start
# server listens on 3000 by default
```

3) Environment
- `JWT_SECRET` - secret for JWT
- `BASE_URL` - base URL used in verification links (defaults to http://localhost:3000)
- Optionally configure SMTP by setting `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_PORT`

4) Notes
- For local testing, if SMTP is not configured the server uses Ethereal and returns a `previewUrl` in the signup response.

5) OAuth (Google & Facebook)
- To enable Google OAuth, set environment variables `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and optionally `GOOGLE_CALLBACK`.
- To enable Facebook OAuth, set `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, and optionally `FACEBOOK_CALLBACK`.
- The server will create or update a verified user record and redirect to the frontend with a `?token=...` JWT param. Configure `FRONTEND_URL` to point to your frontend (e.g. `https://Winky254y.github.io/supreme` when deployed).

6) Deploying to Heroku via GitHub Actions
- The repository includes a GitHub Actions workflow `.github/workflows/deploy-heroku.yml` which will deploy the server folder to Heroku when you push `main`.
- You must set these repository secrets in GitHub: `HEROKU_API_KEY`, `HEROKU_APP_NAME`, `HEROKU_EMAIL`.
- On Heroku, set environment variables (Config Vars): `JWT_SECRET`, `BASE_URL` (Heroku app URL), `FRONTEND_URL` (your frontend site URL), and SMTP credentials if you want real emails.

7) Security / Production notes
- Use a real database instead of `users.json` for production (Postgres, MySQL, MongoDB). The repository includes a simple file store for demo purposes only.
- For OAuth, create credentials in Google Cloud Console and Meta for Facebook and add the callback URLs exactly as configured (e.g. `https://your-app.herokuapp.com/auth/google/callback`).
