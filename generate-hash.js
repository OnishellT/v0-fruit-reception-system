const bcrypt = require('bcryptjs');

// Generate bcrypt hash for 'admin123'
async function generateHash() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hash:', hash);

  // Verify it works
  const isValid = await bcrypt.compare(password, hash);
  console.log('Verification:', isValid);
}

generateHash();