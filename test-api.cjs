/* eslint-disable @typescript-eslint/no-require-imports, no-console */
const axios = require("axios");
async function run() {
    try {
        const res = await axios.post(
            "http://localhost:3000/api/v1/transactions/inbound",
            {
                docNo: "TRX-INBOUND-TEST",
                date: "2026-06-08T00:00:00Z",
                warehouseId: "b9c4306e-b52f-497a-9da5-eb27a51d41b2",
                supplierId: "a8663bf0-7bf3-4f2e-a553-d7b0f72fb5e0",
                notes: "Test via API",
                lines: [
                    {
                        productId: "08cc7051-defa-4384-92af-cdf3f459c600",
                        locationId: "8bf30859-cbee-48d4-989c-e13aab586fe5",
                        qty: 5,
                    },
                ],
            },
        );
        console.log("Success:", res.data);
    } catch (err) {
        console.error(
            "API Error:",
            err.response ? err.response.data : err.message,
        );
    }
}
run();
