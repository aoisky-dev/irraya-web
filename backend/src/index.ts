import { appContainer } from "./app.js";

async function bootstrap(): Promise<void> {
  const products = await appContainer.services.productService.listPublishedProducts();

  console.log("[backend-bootstrap] backend skeleton ready");
  console.log(`[backend-bootstrap] payment provider: ${appContainer.env.PAYMENT_PROVIDER}`);
  console.log(`[backend-bootstrap] published products loaded: ${products.length}`);
}

void bootstrap();

