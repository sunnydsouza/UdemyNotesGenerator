# Udemy Notes Generator - Chrome Extension
![Udemy Notes Generator - Chrome Extension](images/128.png)

The **Udemy Notes Generator** is a feature-rich Chrome extension that allows Udemy users to efficiently extract and generate organized markdown notes for their courses. Whether you want to capture the entire course structure or generate detailed notes for individual lectures, this extension makes note-taking quick and seamless.

With the extension, you can:
- Automatically generate markdown outlines for any Udemy courses.
- Extract detailed notes for the currently playing lecture based on the transcript.
- Save and navigate through the history of generated notes for easy reference.

---

## Features

- **Course Structure as Markdown**: Automatically generate a markdown structure of all course sections, lectures, and durations.
- **Lecture Notes from Transcripts**: Generate detailed notes for the current lecture based on its transcript, and prepend the course title to the generated notes.
- **History Navigation for Notes**: All generated notes are saved for each lecture, allowing users to **navigate** through the history of generated notes using buttons like `<1/2>`, making it easy to switch between different versions of notes.
- **Copy Markdown Button**: A dedicated "Copy" button below the generated markdown allows you to quickly copy the markdown content and paste it into any note-taking app or editor.
- **Two Distinct Buttons**:
  - **Generate Course Markdown**: This button generates a markdown outline for the entire course.
  - **Re/Generate Notes**: This button generates or regenerates detailed notes for the current lecture based on its transcript.
- **Automatic Section Expansion**: The extension automatically expands collapsed sections to ensure all course content is included in the markdown output.
- **Easy-to-Use Interface**: The interface provides users with a clear and intuitive experience, displaying the generated markdown and allowing easy navigation through past notes.

---

## How to Use

1. **Install the Extension**: Download the extension and load it into Chrome via Developer Mode (instructions below).

2. **Open a Udemy Course**: Navigate to the Udemy course for which you want to generate notes.

3. **Click the Extension Icon**: Click the **Udemy Course Notes Generator** icon in the Chrome toolbar to open the popup.

4. **Generate or Regenerate Notes**:
   - **Pre-requisties**Before you use the extension, make sure you have 'Course Content' tab selected and 'transcript' from video clicked. The transcript window should be open and visible. The extension will only work if the 'Course Content' tab is selected and the 'transcript' window is open and visible, as that information is required for OpenAI to generate the notes.

    There is a way to automate this process. Currently I use 'Tampermonkey' extension to run a script that will automatically open the 'transcript' window when the course page is loaded. The script is available in the 'tampermonkey' folder in the repository.

![The 'transcript' and 'Course content' should be in view before using the extension options](<docs/screencast 2024-10-25 06-54-04.gif>)

   - **Generate Course Markdown**: Click this button to generate a markdown outline of the entire course, including sections, lectures, and durations.
   - **Re/Generate Notes**: Click this button to generate detailed notes for the current playing lecture from the transcript. The extension stores the generated notes for each lecture.

5. **Copy the Markdown**: After generating notes, click the **Copy** button to copy the markdown output. This is particularly useful for pasting into markdown editors, note-taking apps like Notion or Obsidian, or even into documents.

6. **Navigate the History of Notes**: After regenerating notes for a lecture, you can use the **navigation buttons** (like `<1/2>`) to move through the history of generated notes for that specific lecture. This allows you to switch between versions of notes easily.

---

## Popup Page (`popup.html`)

![The extension popup](<docs/Image 2024-10-25 06-49-22.png>)
![Ability to naigate between regenerations](<docs/Image 2024-10-25 06-50-02.png>)

The **popup.html** file is the main user interface of the extension. This popup appears when the user clicks the extension icon in the Chrome toolbar and offers two primary buttons for note generation and markdown generation. Additionally, there are controls for copying the generated markdown and navigating through the history of notes.

### Pre-requisites:
**Make sure you have 'Course Content' tab seelected and 'transcript' from video clicked. The transcript window should be open and visible**
    

### Key Elements:

1. **Generate Course Markdown Button**:
   - This button extracts all course sections, lectures, and durations and generates a complete markdown outline of the course content.
   - **How It Works**: When clicked, this button scans the entire Udemy course page, expands all sections (if necessary), and formats the course content into a markdown structure that is displayed below.

2. **Re/Generate Notes Button**:
   - This button generates or regenerates detailed notes for the currently playing lecture based on its transcript. It saves the notes for that lecture, allowing users to regenerate and update the notes as needed.
   - **How It Works**: When watching a lecture, click this button to extract the transcript and generate structured markdown notes. The notes are automatically saved, so you can revisit them later.

3. **Markdown Display Area**:
   - Instead of a textarea, the markdown output is displayed in a formatted block below the buttons. This block contains the course structure or lecture notes in markdown format.

4. **Copy Button**:
   - A dedicated "Copy" button is provided below the markdown display. When clicked, it copies the displayed markdown to the user's clipboard, allowing for quick pasting into markdown editors or note-taking apps.
   - **How It Works**: The button copies the markdown displayed in the output area, making it easy for users to move the content to other applications.

5. **History Navigation Buttons**:
   - These buttons (`<1/2>`, `<2/2>`, etc.) allow users to navigate through the history of generated notes for each lecture. Every time you regenerate notes for a lecture, a new version is saved, and you can easily switch between versions by clicking these buttons.
   - **How It Works**: Users can click on the navigation buttons to move between the previous versions of the notes for the current lecture, ensuring they can always retrieve past notes.

---

## Options Page (`options.html`)

The **options.html** page is designed to allow users to configure future settings for the extension. Although the current core functionality does not rely on external APIs, the options page is ready for future features.

![Options](<docs/Image 2024-10-25 06-51-38.png>)

### Key Elements:

1. **OpenAI API Key Input**:
   - Here, users can enter their OpenAI API key, which will be used for future advanced features that require AI-generated summaries or notes.

2. **GPT Model Selector**:
   - Users can select the GPT model (e.g., `gpt-4o`, `gpt-4o-mini`) for any future OpenAI-based features.

3. **Save Button**:
   - The "Save" button stores the entered API key and selected GPT model in Chrome's storage for later use.

---


## Installation Instructions

1. **Download or Clone the Repository**:
   Clone the repository using the following command:
   ```bash
   git clone https://github.com/sunnydsouza/UdemyNotesGenerator.git
   ```

2. **Load the Extension into Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable "Developer Mode" by toggling the switch in the top-right corner.
   - Click "Load unpacked" and select the folder where you downloaded the extension files.

3. **Start Using the Extension**:
   - Open a Udemy course.
   - Click the extension icon in the Chrome toolbar.
   - Use the **"Generate Course Markdown"** button to generate a markdown outline of the course or **"Re/Generate Notes"** to create lecture notes based on the transcript.



---

## Permissions

To ensure the extension works seamlessly on Udemy, the following permissions are required in the `manifest.json`:

- **`activeTab`**: This allows the extension to interact with the currently active tab where the Udemy course is open.
- **`scripting`**: The extension injects scripts into the active Udemy course page to extract the content.
- **`host_permissions`**: Access to `https://*.udemy.com/*` is required to allow the extension to work across all Udemy course pages.

Here’s a snippet from the `manifest.json`:

```json
{
  "permissions": [
    "scripting",
    "activeTab"
  ],
  "host_permissions": [
    "https://*.udemy.com/*"
  ]
}
```

---

## Troubleshooting

- **Markdown not appearing**: Ensure you are on a Udemy course page, and the course has fully loaded before clicking "Generate Course Markdown." As mentioned earlier, the extension requires the 'Course Content' tab to be selected and the 'transcript' window to be open and visible.
- **Extension not working**: Double-check that the extension is enabled under `chrome://extensions/`. Ensure that you are using the latest version of Chrome.

---

## Contributing

We welcome contributions to improve the functionality or add new features to this project. Please feel free to open an issue or submit a pull request on GitHub.


---

## License

This project is licensed under the MIT License. Feel free to use it and modify it as per your needs!
