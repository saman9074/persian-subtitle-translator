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
    *   **Important:** The application code itself does **not** provide a UI or mechanism to input the API key. It strictly relies on `process.env.API_KEY` being pre-configured.
    *   How you make this environment variable available depends on your serving setup:
        *   **Local Development with a Server:** If you're using a local development server (like `serve`, `live-server`, or a custom Node.js server), you'll need to ensure that server can inject environment variables into the client-side JavaScript, or that `process.env.API_KEY` is otherwise defined in the browser's global scope before the application scripts run.
        *   **Direct File Access (Simpler Scenarios):** For very simple local testing without a server, you might manually create a global `process` object in a `<script>` tag in `index.html` *before* `index.tsx` is loaded. For example:
            ```html
            <script>
              // WARNING: Only for local testing. Do not commit API keys directly into version control.
              var process = {
                env: {
                  API_KEY: 'YOUR_GEMINI_API_KEY'
                }
              };
            </script>
            <script type="module" src="/index.tsx"></script>
            ```
            Replace `'YOUR_GEMINI_API_KEY'` with your actual key. **Be extremely careful not to commit your API key to version control if using this method.**
        *   **Deployment:** In a deployment scenario, your hosting platform or build process should provide a secure way to set environment variables that are accessible to the client-side application.

2.  **Accessing the Application:**
    *   Once the API key is correctly configured and accessible to the JavaScript environment, simply open the `index.html` file in your web browser.

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
