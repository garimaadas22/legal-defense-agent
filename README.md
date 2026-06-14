Legal Defense Agent 🛡️
A high-performance, API-first compliance scanning agent designed to ensure open-source projects remain legally secure. This agent is built to integrate seamlessly into CI/CD pipelines and developer workflows, providing automated license and compliance insights.

🚀 Overview
The Legal Defense Agent acts as a headless service that monitors and analyzes codebases for legal compliance. By utilizing a robust Node.js and Express architecture, it provides an "always-on" endpoint for real-time security and license auditing.

🛠 Tech Stack
Runtime: Node.js

Framework: Express.js

Deployment: Render (Cloud PaaS)

Architecture: API-First / Headless Service

⚙️ How it Works
Event Trigger: The agent is designed to receive webhooks from GitHub Copilot or other CI/CD triggers.

Processing: It processes incoming payloads to perform automated compliance checks.

Security: The service utilizes express.raw to preserve request buffers, ensuring secure signature verification for GitHub webhooks.

📊 Project Proof
Live Deployment (Render Logs):

API Testing (Postman):

🌐 Live API Endpoint
The service is live and operational. You can verify the agent's status via our health check endpoint:
https://legal-defense-agent-la5f.onrender.com/health

📡 Deployment Status
Status: Operational

Environment: Production

Logs: The service is actively monitoring for webhook traffic and maintaining uptime.

🧪 Testing the Agent
Since this is a headless service, testing can be performed via standard API tools like Postman:

Method: POST

Endpoint: /agent

Headers: Content-Type: application/json

Body: Provide the JSON payload representing the repository code scan.

