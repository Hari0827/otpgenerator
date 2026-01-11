const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const OTP_TTL = 60 * 1000; // 60 seconds

const store = new Map(); // simple in-memory store: mobile -> {otp, expiry}

function generateOTP(len = 6) {
  let otp = '';
  for (let i = 0; i < len; i++) otp += Math.floor(Math.random() * 10);
  return otp;
}

async function sendSmsWithTwilio(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) return {ok: false, error: 'Twilio not configured'};
  const client = require('twilio')(sid, token);
  try {
    await client.messages.create({to, from, body});
    return {ok: true};
  } catch (err) {
    return {ok: false, error: err.message};
  }
}

app.post('/send-otp', async (req, res) => {
  const mobile = (req.body.mobile || '').toString().replace(/\D/g, '');
  if (!/^\d{6,15}$/.test(mobile)) return res.status(400).json({ok: false, error: 'Invalid mobile number'});

  const otp = generateOTP(6);
  const expiry = Date.now() + OTP_TTL;
  store.set(mobile, {otp, expiry});

  let smsResult = {ok: false};
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) {
    smsResult = await sendSmsWithTwilio(mobile, `Your OTP is ${otp}`);
  }

  const debug = process.env.DEBUG === 'true';
  // In debug mode (or when Twilio not configured) return the OTP in response for local testing only
  return res.json({ok: smsResult.ok || !smsResult.error, otp: debug ? otp : undefined, smsError: smsResult.error});
});

app.post('/verify-otp', (req, res) => {
  const mobile = (req.body.mobile || '').toString().replace(/\D/g, '');
  const code = (req.body.otp || '').toString().trim();
  const entry = store.get(mobile);
  if (!entry) return res.json({ok: false, error: 'No OTP for this number or it expired'});
  if (Date.now() > entry.expiry) { store.delete(mobile); return res.json({ok: false, error: 'OTP expired'}); }
  if (entry.otp === code) { store.delete(mobile); return res.json({ok: true}); }
  return res.json({ok: false, error: 'Incorrect OTP'});
});

app.listen(PORT, () => console.log(`OTP server listening on port ${PORT}`));
