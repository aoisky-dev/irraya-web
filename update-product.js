async function run() {
  try {
    const authRes = await fetch('https://api.irraya.com/auth/user/emailpass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@irraya.com', password: 'Admin@12345' })
    });
    const authData = await authRes.json();
    const token = authData.token;

    const productId = 'prod_01M2F3PXACK715RM93EW5GZKF7';
    
    // The URLs of the images the user uploaded earlier
    const payload = {
      images: [
        { url: "https://api.irraya.com/uploads/1789365620446-IMG_4457.jpg" },
        { url: "https://api.irraya.com/uploads/1789365620447-IMG_4458.jpg" },
        { url: "https://api.irraya.com/uploads/1789365620449-IMG_4459.jpg" }
      ]
    };

    console.log("Updating product...");
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
    
    const updateData = await updateRes.json();
    console.log("Update successful!");
    
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();
