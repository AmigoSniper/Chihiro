require('dotenv').config();

const required = ['DISCORD_TOKEN', 'CREATE_VC_ID'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Variabel .env belum diisi: ${missing.join(', ')}`);
  process.exit(1);
}

module.exports = {
  token: process.env.DISCORD_TOKEN,
  createVcId: process.env.CREATE_VC_ID,
};