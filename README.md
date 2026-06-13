# Legal Defense Agent 🛡️

An algorithmic GitHub Copilot Extension built for the Microsoft Agents League Hackathon (Creative Apps Track). It helps developers scan their source code for open-source license compliance risks directly inside their chat workflow.

## 💡 The Problem & Idea
Whenever we use open-source packages or copy snippets from the internet, we rarely check their legal licenses (like GPL, LGPL, or SSPL). Using a highly restrictive license in a commercial project can lead to massive legal risks and compliance issues. 

Checking these licenses manually is boring and interrupts the coding flow. So, I built the **Legal Defense Agent**—a virtual legal assistant that lives right inside your GitHub Copilot Chat. It parses your code snippets, references an internal compliance registry, and alerts you with visual risk flags before you commit!

## 🧠 Architecture & How it Works
The project is built fully on top of the official GitHub Copilot Extension framework and integrates directly with the GitHub Copilot LLM layer.

1. **Developer Interface:** The user interacts with the agent using `@legal-defense` inside the GitHub Chat interface to check specific code blocks.
2. **Secure Webhook Layer:** The Express.js backend receives the payload safely. Requests are verified via cryptographic signatures (`verifySignature.js`) to ensure they originate genuinely from GitHub.
3. **Core Intelligence Pipeline:** 
   - `codeExtractor` parses and pulls out the code blocks from the incoming request.
   - `licenseScanner` runs regex fingerprinting to detect restricted license patterns (GPL, LGPL, SSPL, etc.).
   - `promptBuilder` takes these scan findings and injects them into an enriched system prompt.
4. **Grounded License Database:** The agent references `licenseDatabase.js`, a local compliance store that categorizes licenses into risk levels (Red/Orange/Yellow/Green) and provides specific refactor hints without external third-party calls.
5. **Streaming Output:** The server bundles everything and talks to `api.githubcopilot.com/chat/completions` (GPT-4o), sending token-by-token streaming responses (SSE) back to the GitHub Chat UI with clear violation details, refactored code, and an IP safety certificate.

## 🛠️ Tech Stack & Structure
- **Runtime:** Node.js (ES Modules, version >= 20)
- **Framework:** Express.js (`@copilot-extensions/preview-sdk`)
- **APIs:** GitHub Copilot Chat Completions API (GitHub Copilot IQ Layer)

- src/core/ -> Core processing (Copilot LLM integration, prompt building, scanner)
- src/data/ -> Grounded knowledge base (License compliance registry)
- src/handlers/ -> Webhook routes and chat request processing
- src/middleware/ -> HMAC verification, request logging, and global error handling
- src/utils/ -> Markdown fenced code block extraction logic

## 🚀 Future Roadmap
- Add real-time legal data syncing with enterprise registries.
- Support automated pull request scanning (GitHub Actions integration) to auto-comment on risky dependency additions.
- Expand support from JavaScript/TypeScript parsing to Python and Go.
