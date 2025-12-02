require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

app.use(cors());
app.use(bodyParser.json());
app.use(passport.initialize());

function readUsers(){
  try{ return JSON.parse(fs.readFileSync(DATA_FILE,'utf8')||'[]'); }catch(e){ return []; }
}
function writeUsers(u){ fs.writeFileSync(DATA_FILE, JSON.stringify(u, null, 2)); }

// password strength check
function strongPassword(pwd){
  // min 8, upper, lower, digit, special
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  return re.test(pwd);
}

async function createTransport(){
  // If SMTP env vars present, use them
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  // Fallback to ethereal test account
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass }
  });
}

app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  if (!strongPassword(password)) return res.status(400).json({ error: 'Password is not strong enough' });

  const users = readUsers();
  if (users.find(u=>u.email === email.toLowerCase())) return res.status(409).json({ error: 'Email already registered' });

  const hash = await bcrypt.hash(password, 10);
  const verifyToken = uuidv4();
  const user = { id: uuidv4(), email: email.toLowerCase(), passwordHash: hash, verified: false, verifyToken, createdAt: Date.now() };
  users.push(user);
  writeUsers(users);

  // send verification email
  try{
    const transporter = await createTransport();
    const base = process.env.BASE_URL || `http://localhost:${PORT}`;
    const verifyUrl = `${base}/api/verify?token=${verifyToken}`;
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'no-reply@moveit.local',
      to: email,
      subject: 'Verify your Move It account',
      text: `Welcome to Move It. Verify your email by visiting: ${verifyUrl}`,
      html: `<p>Welcome to Move It.</p><p>Verify your email by clicking <a href="${verifyUrl}">this link</a>.</p>`
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || null;
    return res.json({ ok:true, message: 'Verification email sent', previewUrl, verifyUrl });
  }catch(err){
    // still return verify link so developer can open it
    const base = process.env.BASE_URL || `http://localhost:${PORT}`;
    const verifyUrl = `${base}/api/verify?token=${verifyToken}`;
    return res.json({ ok:true, message: 'Created account (email not sent)', verifyUrl });
  }
});

// Passport OAuth strategies
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK || `http://localhost:${PORT}/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const users = readUsers();
      const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || null;
      if (!email) return done(new Error('No email in Google profile'));
      let user = users.find(u=>u.email === email.toLowerCase());
      if (!user) {
        user = { id: uuidv4(), email: email.toLowerCase(), verified: true, createdAt: Date.now(), oauth: { provider: 'google', id: profile.id } };
        users.push(user);
        writeUsers(users);
      } else {
        user.verified = true;
      }
      return done(null, user);
    } catch (err) { return done(err); }
  }));

  app.get('/auth/google', passport.authenticate('google', { scope: ['profile','email'] }));
  app.get('/auth/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/'}), (req, res) => {
    const token = jwt.sign({ id: req.user.id, email: req.user.email }, JWT_SECRET, { expiresIn: '7d' });
    // redirect to frontend with token
    const front = process.env.FRONTEND_URL || 'http://localhost:8001';
    return res.redirect(`${front}/?token=${token}`);
  });
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK || `http://localhost:${PORT}/auth/facebook/callback`,
    profileFields: ['id','emails','name']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const users = readUsers();
      const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || null;
      if (!email) return done(new Error('No email in Facebook profile'));
      let user = users.find(u=>u.email === email.toLowerCase());
      if (!user) {
        user = { id: uuidv4(), email: email.toLowerCase(), verified: true, createdAt: Date.now(), oauth: { provider: 'facebook', id: profile.id } };
        users.push(user);
        writeUsers(users);
      } else {
        user.verified = true;
      }
      return done(null, user);
    } catch (err) { return done(err); }
  }));

  app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
  app.get('/auth/facebook/callback', passport.authenticate('facebook', { session: false, failureRedirect: '/'}), (req, res) => {
    const token = jwt.sign({ id: req.user.id, email: req.user.email }, JWT_SECRET, { expiresIn: '7d' });
    const front = process.env.FRONTEND_URL || 'http://localhost:8001';
    return res.redirect(`${front}/?token=${token}`);
  });
}

app.get('/api/verify', (req, res) => {
  const { token } = req.query || {};
  if (!token) return res.status(400).send('Missing token');
  const users = readUsers();
  const u = users.find(x=>x.verifyToken === token);
  if (!u) return res.status(404).send('Token not found or already used');
  u.verified = true;
  delete u.verifyToken;
  writeUsers(users);
  return res.send('<h2>Thank you — your email is verified.</h2><p>You can now return to the site and sign in.</p>');
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
  const users = readUsers();
  const u = users.find(x=>x.email === email.toLowerCase());
  if (!u) return res.status(401).json({ error: 'Invalid credentials' });
  if (!u.verified) return res.status(403).json({ error: 'Email not verified' });
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: u.id, email: u.email }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ ok:true, token, email: u.email });
});

// simple health
app.get('/api/health', (req, res) => res.json({ ok:true, env: process.env.NODE_ENV || 'dev' }));

// OAuth placeholders - require configuration
app.get('/auth/google', (req,res)=>{
  res.status(501).send('Google OAuth not configured. See server/README.md to enable.');
});
app.get('/auth/facebook', (req,res)=>{
  res.status(501).send('Facebook OAuth not configured. See server/README.md to enable.');
});

app.listen(PORT, ()=>console.log(`Auth server running on http://localhost:${PORT}`));
