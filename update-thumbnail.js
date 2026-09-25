async function run() {
  try {
    const authRes = await fetch('https://api.irraya.com/auth/user/emailpass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@irraya.com', password: 'Admin@12345' })
    });
    const token = (await authRes.json()).token;

    const productId = 'prod_01M2F3PXACK715RM93EW5GZKF7';
    const payload = {
      thumbnail: "https://api.irraya.com/uploads/1789365620446-IMG_4457.jpg"
    };

    const updateRes = await fetch(`https://api.irraya.com/admin/products/${productId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!updateRes.ok) {
      console.log("Update failed:", updateRes.status, await updateRes.text());
      return;
    }
    console.log("Thumbnail updated successfully!");
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();
