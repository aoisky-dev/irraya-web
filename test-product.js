async function run() {
  try {
    const authRes = await fetch('https://api.irraya.com/auth/user/emailpass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@irraya.com', password: 'Admin@12345' })
    });
    const token = (await authRes.json()).token;

    const productId = 'prod_01M2F3PXACK715RM93EW5GZKF7';
    
    const productRes = await fetch(`https://api.irraya.com/admin/products/${productId}?fields=*images`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const productData = await productRes.json();
    console.log(JSON.stringify(productData.product.images, null, 2));
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();
