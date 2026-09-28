const statuses = [
  { current_status: "PICKED UP", awb: "AWB123456789" },
  { current_status: "IN TRANSIT", awb: "AWB123456789" },
  { current_status: "OUT FOR DELIVERY", awb: "AWB123456789" },
  { current_status: "DELIVERED", awb: "AWB123456789" },
];

const ORDER_ID = "6"; // display_id
const API_URL = "https://api.irraya.com/webhooks/shiprocket";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log(`Starting automated webhook tests for Order #${ORDER_ID}...\n`);

  for (const status of statuses) {
    console.log(`Sending webhook for status: [${status.current_status}]`);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: ORDER_ID,
          current_status: status.current_status,
          awb: status.awb,
        }),
      });
      
      const responseText = await res.text();
      console.log(`Response (${res.status}): ${responseText}`);
      
      if (!res.ok) {
        console.error("Test failed, stopping.");
        break;
      }
    } catch (e) {
      console.error(`Error sending webhook: ${e.message}`);
    }
    
    console.log("Waiting 2 seconds before next update...\n");
    await sleep(2000);
  }
  
  console.log("Automated status testing complete.");
}

runTests();
