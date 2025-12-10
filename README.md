![Yap logo banner](https://i.imgur.com/BsDIQ0R.jpeg)

# Yap — TTS voice-coding tool

Yap is a lightweight tool for voice-driven coding and text-to-speech (TTS) workflows. This repository contains everything needed to run the app locally and experiment with its voice/TTS features.

## Features (summary)
- Text-to-speech / voice interaction support (uses Gemini / configured TTS provider via env)
- Local development server for rapid iteration
- (Other features are implemented in the codebase — please check the source for full details)

## Prerequisites
- Node.js (recommended v18+)
- npm (or yarn / pnpm)

## Quick start

1. Clone the repo
   git clone https://github.com/jamditis/yap.git
   cd yap

2. Install dependencies
   npm install

3. Create environment variables
   Copy or create a `.env.local` file in the project root and set your credentials. At minimum the app requires:

   GEMINI_API_KEY=your_gemini_api_key_here

   (If the codebase expects additional environment variables check the repository for `.env.example` or the server startup files.)

4. Run the app locally (development)
   npm run dev

5. Build and run for production
   npm run build
   npm start

(Note: The README above uses common npm script names — please verify the exact scripts in package.json and adjust commands if different.)

## Configuration / Environment
- GEMINI_API_KEY — API key used for TTS/LLM access (store this in `.env.local`)
- PORT — optionally set a port for the server (defaults commonly to 3000 if used)

Refer to the code (server entry, config files) for any other required variables.

## Troubleshooting
- If `npm run dev` fails, check:
  - Node.js version
  - That `.env.local` exists and the GEMINI_API_KEY is set
  - Any missing native build tools required by native deps

- Check console logs in the terminal and the browser console for runtime errors.

## Contributing
Contributions, issues and feature requests are welcome. Please open an issue describing the change you'd like to see or submit a pull request.

## License
Please check the repository root for a LICENSE file to confirm the project license.

## Contact
For questions or help, open an issue on GitHub or reach out to the repository owner.
