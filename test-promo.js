async function run() {
  const cartRes = await fetch("http://localhost:9000/store/carts", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-publishable-api-key": "pk_24ee7256543b593ef9745300f2e032dce7d11ec32ce8dbab07e1c1ccb8a07c39" },
    body: JSON.stringify({ currency_code: "inr" })
  });
  const cartData = await cartRes.json();
  const cartId = cartData.cart.id;
  console.log("Cart created:", cartId);

  const promoRes = await fetch(`http://localhost:9000/store/carts/${cartId}/promotions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-publishable-api-key": "pk_24ee7256543b593ef9745300f2e032dce7d11ec32ce8dbab07e1c1ccb8a07c39" },
    body: JSON.stringify({ promo_codes: ["FIRST10"] })
  });
  const promoData = await promoRes.json();
  console.log("Promo with promo_codes:", JSON.stringify(promoData, null, 2));
}
run();
