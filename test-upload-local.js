const fs = require('fs');

async function run() {
  try {
    const authRes = await fetch('https://api.irraya.com/auth/user/emailpass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@irraya.com', password: 'Admin@12345' })
    });
    const authData = await authRes.json();
    const token = authData.token;

    const form = new FormData();
    const fileBuffer = Buffer.from("hello world this is a test image", "utf-8");
    form.append('files', new Blob([fileBuffer], { type: 'image/jpeg' }), 'test.jpg');

    console.log("Uploading file from local agent over internet...");
    const uploadRes = await fetch('https://api.irraya.com/admin/uploads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: form
    });
    
    if (!uploadRes.ok) {
      console.log("Upload failed:", uploadRes.status, await uploadRes.text());
      return;
    }
    
    const uploadData = await uploadRes.json();
    console.log("Upload successful:", JSON.stringify(uploadData, null, 2));
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();
