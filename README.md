# Persian Subtitle Translator

## Overview

The Persian Subtitle Translator is a web application designed to translate subtitle files (in `.srt` or `.vtt` format) into Persian. It utilizes the Google Gemini API for translation and incorporates contextual understanding by analyzing preceding and succeeding subtitle lines. Users can also select the subject matter of the subtitles to help the AI provide more accurate and domain-specific translations.

## Features

*   **SRT and VTT Support:** Upload and translate both SubRip (`.srt`) and WebVTT (`.vtt`) subtitle files.
*   **Context-Aware Translation:** Considers surrounding lines of dialogue (configurable window size) to improve translation accuracy and coherence.
*   **Subject-Specific Prompts:** Allows users to select the subject of the content (e.g., Film, TV Series, General Education, Specialized Programming Education) to tailor the AI's translation approach.
*   **Gemini Model Selection:** Users can choose from available Gemini models for translation (currently defaults to `gemini-2.5-flash-preview-04-17`).
*   **Resume Translation:** If the translation process is interrupted (e.g., network error), users can resume from where they left off.
*   **Retry Failed Lines:** A dedicated option to re-attempt translation for any lines that failed during the initial process.
*   **Format Preservation:** Translated subtitles can be downloaded in the same format as the uploaded file (SRT out for SRT in, VTT out for VTT in).
*   **UTF-8 Encoding:** Output files are UTF-8 encoded, ensuring correct display of Persian (RTL) characters.
*   **Responsive Design:** User interface adapts to various screen sizes.
*   **Progress Indication:** Visual feedback on parsing and translation progress.

## Prerequisites

*   A modern web browser (e.g., Chrome, Firefox, Safari, Edge).
*   A valid Google Gemini API Key.

## Setup and Running

1.  **API Key Configuration (Crucial):**
    *   This application requires a Google Gemini API Key to function.
    *   The API key **must** be available as an environment variable named `process.env.API_KEY` in the execution context where the application's JavaScript runs.
    *   **Important:** The application code itself does **not** provide a UI or mechanism to input the API key. It strictly relies on `process.env.API_KEY` being pre-configured and accessible to the client-side JavaScript.

    There are different ways to make this variable available depending on your environment:

    **a) Local Development:**

    *   **Using a Local HTTP Server (Recommended for most features):**
        When you open `index.html` directly in the browser using the `file:///` protocol, `process.env.API_KEY` will likely not be defined. For proper local development and to simulate a real server environment, it's best to serve the files using a simple local HTTP server.
        You can use tools like `serve` or `live-server`:
        ```bash
        # If you have Node.js and npm/npx:
        npx serve .  # Run this command in the project's root directory
        # Or
        npm install -g live-server
        live-server . # Run this command in the project's root directory
        ```
        Then, you'll still need to make the API key available. One way for local testing is the script tag method below.

    *   **`<script>` Tag Method (For quick local testing, less secure):**
        You can temporarily define the `process.env.API_KEY` by adding a `<script>` tag to your `index.html` file *before* the main application script (`index.tsx`) is loaded.

        Open `index.html` and add the following block in the `<head>` or `<body>` before `<script type="module" src="/index.tsx"></script>`:
        ```html
        <script>
          // WARNING: ONLY FOR LOCAL TESTING.
          // DO NOT commit your API key directly into version control if using this method.
          // Consider using a .env file or other secure methods for more robust development.
          var process = {
            env: {
              API_KEY: 'YOUR_GEMINI_API_KEY_HERE' // Replace with your actual key
            }
          };
        </script>
        ```
        Replace `'YOUR_GEMINI_API_KEY_HERE'` with your actual Gemini API Key.
        **Security Warning:** This method embeds your API key directly in the HTML. It's acceptable for private, local testing, but **never commit your API key to a public or shared repository.** If you use Git, ensure your `index.html` (if modified this way) is in your `.gitignore` or that you remove the key before committing.

    *   **Development Frameworks (e.g., Vite, Next.js - Not used here but for context):**
        If this project were built with a JavaScript framework like Vite or Next.js, these tools often have built-in support for `.env` files (e.g., `.env.local`) to manage environment variables during development, which is a more common and secure practice.

    **b) Deployment / Hosting on a Server:**

    *   When deploying this application to a hosting provider (e.g., Vercel, Netlify, AWS Amplify, Google Cloud, Firebase Hosting, traditional web servers), you **must not** hardcode the API key in your client-side files.
    *   Instead, use the hosting platform's mechanism for setting environment variables. These variables are then securely injected into the application's runtime environment.
        *   **Example:** On platforms like Vercel or Netlify, you can set environment variables through their project settings dashboard. The variable name should be `API_KEY` and its value your actual Gemini API Key.
    *   **Security Best Practice:** The API key should be treated as a secret. Exposing it directly in client-side code that is publicly accessible is a security risk. Hosting platforms provide secure ways to manage these secrets.
    *   **Backend Proxy (Alternative Advanced Setup):** For maximum API key security in a production environment, an alternative approach (not implemented in this specific application) is to use a backend proxy. The client would make requests to your backend, and your backend would then securely call the Gemini API using the key stored on the server. This application, however, relies on the API key being available directly to the client-side JavaScript, assuming the hosting environment securely provides it.

2.  **Accessing the Application:**
    *   **Local Development:** After setting up the API key (e.g., using the `<script>` tag method and a local HTTP server), open your browser and navigate to the local address provided by your server (e.g., `http://localhost:3000` or `http://localhost:8080`).
    *   **Deployed Version:** If hosted, access the application via the URL provided by your hosting service.

## How to Use

1.  **Upload File:**
    *   Click on the "1. Upload Subtitle File" section.
    *   Select your `.srt` or `.vtt` file from your computer.
    *   The application will parse the file. You'll see a "Parsing file..." indicator if the file is large.

2.  **Configure Translation Settings:**
    *   Navigate to the "2. Configure Translation Settings" section.
    *   **Subtitle Subject:** Choose the subject that best describes your subtitle content from the dropdown list (e.g., "Film", "Specialized Programming Education"). This helps tailor the translation.
    *   **Gemini Model:** Select the Gemini model to use for translation.
    *   **Context Window Size:** Specify how many preceding and succeeding lines should be sent to the AI for context (0-10).

3.  **Translate:**
    *   Click the "Translate [X] lines" button in the "3. Translate to Persian" section.
    *   A progress bar will show the translation status.
    *   If the process is interrupted, the button text will change to "Resume Translation", allowing you to continue.

4.  **Retry Failed Translations (If Necessary):**
    *   If some lines fail to translate, an error message will indicate this, and a "Retry Failed Translations (Y)" button will become active. Click it to attempt translating only the failed lines.

5.  **Review & Download:**
    *   In the "4. Review & Download" section, a table will display the original text alongside its Persian translation.
    *   If you're satisfied, click the "Download Translated SRT" or "Download Translated VTT" button (the format will match your uploaded file type).
    *   The downloaded file will be named descriptively, including the original filename base and the selected subject.

## Technology Stack

*   **Frontend:** React, TypeScript
*   **Styling:** Tailwind CSS
*   **AI API:** Google Gemini API (`@google/genai`)
*   **Module Loading:** ES Modules with `esm.sh` for CDN-based package imports.

## License

This project is licensed under the MIT License. See the `LICENSE.md` file for details.