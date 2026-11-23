# Personal CV Website

A minimal, single-page curriculum vitae built with HTML5, CSS3, vanilla
JavaScript and JSON. All CV content lives in `data/cv.json`; the HTML, CSS and
JavaScript only provide structure, presentation and behaviour.

There is no framework, build step, package manager, backend or external runtime
dependency. The site is designed to work as a static GitHub Pages project site.

**Live URL (after GitHub Pages is enabled):**
<https://armenbadal.github.io/cv/>

---

## Content

`data/cv.json` contains the CV content supplied by the site owner. The
implementation did not invent professional facts: identity, summary, skills,
experience, teaching, education and publications come from that file.

The `teaching` array currently contains a clearly marked placeholder entry
because teaching details were not supplied. Replace its bracketed values with the
real institution, role, dates and courses (or remove the entry to hide the
section).

If a section array is empty — for example, `projects` — the corresponding section
is intentionally omitted rather than rendered as an empty heading. Add entries
to the array to make the section appear.

The profile image is currently a neutral “AB” monogram placeholder
(`assets/profile.jpg`), not a photograph. Replace the file and update
`personal.profileImageAlt` when a real photo is available.

The static title, description, canonical URL and Open Graph metadata in
`index.html` reflect the current name, title, summary and deployment URL. Update
those fallback values whenever the CV identity or deployment location changes;
they are what non-JavaScript crawlers and social previews read.

---

## Features

- Single-page CV rendered entirely from `data/cv.json`.
- Sections: summary, technical skills, professional experience, selected
  projects, teaching experience, education and publications.
- Optional fields and empty sections are skipped cleanly.
- Asynchronous loading with explicit handling for network failures, HTTP errors,
  invalid JSON and invalid data structures.
- Accessible, semantic HTML with a skip link, sensible heading hierarchy,
  keyboard focus styles and accessible external link labels.
- URL scheme validation; external links open in a new tab with
  `rel="noopener noreferrer"`.
- Responsive layout for desktop, tablet and mobile.
- Dedicated A4 print stylesheet and a **Download / Print CV** button.
- Relative asset and data paths, so the site works under `/cv/` on GitHub Pages.
- No frameworks, libraries, build tools or external runtime dependencies.

---

## Repository structure

```text
cv/
├── index.html                 # Semantic document and application entry point
├── css/
│   └── style.css              # Screen, responsive and print styles
├── js/
│   ├── app.js                 # Initialisation, loading states and error UI
│   ├── data-loader.js         # Fetching, parsing and validation
│   └── renderer.js            # DOM rendering and metadata updates
├── data/
│   └── cv.json                # All CV content
├── assets/
│   └── profile.jpg            # Placeholder monogram (replace with a photo)
├── README.md
└── IMPLEMENTATION_PROMPT.md
```

`js/app.js` is loaded as an ES module. It imports the loader and renderer, so
there are no global application objects.

---

## Run locally

Browser `fetch()` is restricted on `file://` URLs. Serve the project over HTTP.

From the repository root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

If you prefer Ruby (available on macOS):

```bash
ruby -run -e httpd . -p 8000
```

No installation or build step is required. Stop the server with `Ctrl+C`.

To simulate the GitHub Pages project path locally, serve the parent directory and
open `/cv/`:

```bash
cd ..
python3 -m http.server 8000
# http://localhost:8000/cv/
```

After editing `data/cv.json`, hard-refresh the page if the browser has cached an
older response (`Cmd+Shift+R` on macOS, `Ctrl+Shift+R` on Windows/Linux). The
loader requests the JSON with `cache: "no-cache"`, but proxies and browsers can
still retain responses.

---

## Edit the CV

Only `data/cv.json` needs to change for normal content updates. The section
order is fixed in the renderer; the order of fields inside the JSON does not
matter.

### General rules

- Strings are trimmed before rendering. Empty strings are treated as absent.
- An empty or omitted section array hides that section entirely.
- Optional list fields such as `achievements` and `technologies` may be omitted
  or set to `[]`.
- External URLs must be absolute `http://` or `https://` URLs. The renderer
  ignores other schemes instead of creating unsafe links.
- `profileImage` may be a path relative to `index.html` (for example
  `assets/profile.jpg`) or an absolute `http(s)` URL. Leading-slash paths such
  as `/assets/profile.jpg` are intentionally rejected so the site keeps working
  under the `/cv/` project path.
- Dates are displayed as written unless they use an ISO form (`YYYY`,
  `YYYY-MM` or `YYYY-MM-DD`), which is formatted for readability. ISO dates are
  also exposed through the `datetime` attribute of a `<time>` element.
- Set `"current": true` on an experience entry to display “Present” and ignore
  its `endDate`.
- Use `profileImageAlt` to give the image meaningful alternative text.

### Required values

The following are required because they identify the document or an entry:

| Location | Required fields |
| --- | --- |
| Root `personal` object | `personal.fullName`, `personal.title` |
| Skill item | `category`, `items` |
| Experience entry | `company`, `position` |
| Project entry | `name` |
| Teaching entry | `institution`, `role` |
| Education entry | `institution`, `degree` |
| Publication entry | `title` |

Everything else is optional. A missing required value produces a readable
validation error instead of a silently incomplete page.

### Replacing the profile image

Keep the filename `assets/profile.jpg` and overwrite the file, or change
`personal.profileImage` in `cv.json`. A square image (for example 640×640)
works best; CSS crops it to a circle. If the image fails to load, the header
gracefully renders without it.

---

## JSON structure

A compact skeleton:

```json
{
  "personal": {
    "fullName": "Your Name",
    "title": "Senior Software Engineer",
    "location": "City, Country",
    "email": "you@example.com",
    "phone": "",
    "github": "https://github.com/example",
    "linkedin": "",
    "website": "",
    "profileImage": "assets/profile.jpg",
    "profileImageAlt": "A description of the photograph"
  },
  "summary": "A concise professional summary.",
  "skills": [
    { "category": "Programming Languages", "items": ["Language A", "Language B"] }
  ],
  "experience": [
    {
      "company": "Company",
      "position": "Position",
      "startDate": "2022-01",
      "endDate": "",
      "current": true,
      "location": "City, Country",
      "description": "A short description of the role.",
      "achievements": ["An achievement or responsibility."],
      "technologies": ["Technology A", "Technology B"]
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "What the project does and what you contributed.",
      "technologies": ["Technology A"],
      "githubUrl": "https://github.com/example/project",
      "projectUrl": ""
    }
  ],
  "teaching": [
    {
      "institution": "Institution or program",
      "role": "Teaching role",
      "startDate": "2021-09",
      "endDate": "2022-06",
      "current": false,
      "location": "City, Country",
      "description": "Course, audience and topics taught.",
      "courses": ["Course or topic"]
    }
  ],
  "education": [
    {
      "institution": "Institution",
      "degree": "Degree",
      "field": "Field of study",
      "startDate": "2014",
      "endDate": "2018",
      "location": "City, Country",
      "description": ""
    }
  ],
  "publications": [
    {
      "title": "Publication title",
      "description": "A short description.",
      "date": "2025-06",
      "publisher": "Publisher or platform",
      "url": "https://example.com/publication"
    }
  ]
}
```

### Top-level fields

| Field | Type | Required | Behaviour |
| --- | --- | --- | --- |
| `personal` | object | Yes | Identity and contact information. |
| `summary` | string | No | Renders the Summary section when non-empty. |
| `skills` | array | No | Array of skill category objects. |
| `experience` | array | No | Array of professional experience entries. |
| `projects` | array | No | Array of selected projects. |
| `teaching` | array | No | Array of teaching experience entries. |
| `education` | array | No | Array of education entries. |
| `publications` | array | No | Array of publication entries. |

### `personal`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `fullName` | string | Yes | Displayed as the page `h1` and used in the title. |
| `title` | string | Yes | Professional title shown under the name. |
| `location` | string | No | Plain text; not linked. |
| `email` | string | No | Becomes a `mailto:` link when it looks like an email address. |
| `phone` | string | No | Becomes a `tel:` link when it contains enough digits. |
| `github` | string | No | Absolute URL; shown as a GitHub contact link. |
| `linkedin` | string | No | Absolute URL; shown as a LinkedIn contact link. |
| `website` | string | No | Absolute URL; shown as a personal website link. |
| `profileImage` | string | No | Relative asset path or absolute `http(s)` URL. |
| `profileImageAlt` | string | No | Alternative text for the profile image. |

### `skills[]`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `category` | string | Yes | For example “Programming Languages”. |
| `items` | string[] | Yes | Individual skills. No proficiency percentages are used. |

Groups with no category or no items are skipped.

### `experience[]`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `company` | string | Yes | Company or organisation. |
| `position` | string | Yes | Position title. |
| `startDate` | string | No | ISO date or free text. |
| `endDate` | string | No | ISO date or free text; ignored when `current` is true. |
| `current` | boolean | No | Shows “Present” as the end of the period. |
| `location` | string | No | City, country or “Remote”. |
| `description` | string | No | Short role description. |
| `achievements` | string[] | No | Achievements and responsibilities rendered as a list. |
| `technologies` | string[] | No | Technologies used, rendered as a comma-separated line. |

### `projects[]`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | Yes | Project name. |
| `description` | string | No | Project description and contribution. |
| `technologies` | string[] | No | Technologies used. |
| `githubUrl` | string | No | Absolute URL to the repository. |
| `projectUrl` | string | No | Absolute URL to a live project or write-up. |

### `teaching[]`

The Teaching experience section is rendered between Selected projects and
Education.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `institution` | string | Yes | Institution, university or program. |
| `role` | string | Yes | Teaching role or position. |
| `startDate` | string | No | ISO date or free text. |
| `endDate` | string | No | ISO date or free text; ignored when `current` is true. |
| `current` | boolean | No | Shows “Present” as the end of the period. |
| `location` | string | No | Location of the teaching engagement. |
| `description` | string | No | Short description of the course, audience and approach. |
| `courses` | string[] | No | Courses or topics taught, rendered as a list. |

### `education[]`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `institution` | string | Yes | School, college or university. |
| `degree` | string | Yes | Degree or qualification. |
| `field` | string | No | Field of study; displayed as “Degree in Field”. |
| `startDate` | string | No | Start of the period. |
| `endDate` | string | No | End of the period. |
| `location` | string | No | Location of the institution. |
| `description` | string | No | Optional additional detail. |

### `publications[]`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | Yes | Publication title. |
| `description` | string | No | Short description. |
| `date` | string | No | ISO date or free text. |
| `publisher` | string | No | Publisher, journal or platform. |
| `url` | string | No | Absolute URL; renders a “Read publication” link. |

---

## Publish on GitHub Pages

The site has no build step. GitHub Pages can serve the repository root directly.

1. Commit and push the project to GitHub. The repository is configured for
   `https://github.com/armenbadal/cv.git`; use the default branch name of the
   repository (`main` or `master`).
2. Open the repository on GitHub and go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the default branch and the **/(root)** folder, then click **Save**.
5. Wait for the deployment to finish. The site will be available at
   `https://armenbadal.github.io/cv/`.

No GitHub Actions workflow, Jekyll plugin or build command is required. All
paths are relative:

- `./css/style.css` and `./js/app.js` are relative to `index.html`.
- `../data/cv.json` is resolved relative to `js/data-loader.js` using
  `import.meta.url`.
- `assets/profile.jpg` is resolved relative to the document.

This keeps the site working when it is hosted under a subpath such as `/cv/`.
If the repository or user name changes, update the static `canonical` and Open
Graph URLs in `index.html` as well.

---

## Print and save as PDF

1. Open the deployed site (or the local HTTP server).
2. Use the **Download / Print CV** button in the top-right corner.
3. Choose A4 paper and “Save as PDF” in the browser’s print dialog.
4. Enable background graphics if you want the profile image and subtle colour
   accents to be preserved.
5. Set margins to “Default” or “None” as preferred; the stylesheet already
   defines 14 mm × 15 mm A4 page margins.

The `@media print` rules:

- Hide the toolbar, loading state and skip link.
- Remove screen backgrounds and use high-contrast text.
- Keep individual experience, project, education and publication entries from
  splitting across pages where practical.
- Avoid orphaned section headings and list items.
- Show contextual URLs for project and publication links.
- Keep contact information and dates visible.

Content that is longer than one A4 page flows onto additional pages.

---

## Accessibility and SEO

- Semantic landmarks (`header`, `main`, `article`, `section`) and a heading
  hierarchy from `h1` to `h3`.
- “Skip to content” link and visible keyboard focus styles.
- Contact values are readable text; external links include context for screen
  readers and indicate that they open in a new tab.
- Formatted dates use the `<time>` element where possible.
- Responsive layout with a single-column mobile presentation and no horizontal
  scrolling at narrow widths.
- Colour contrast is designed to meet WCAG AA.
- The document includes a title, description, canonical URL, Open Graph and
  Twitter metadata.
- After loading, the runtime updates the title, description and Open Graph
  title/description from the JSON. Search and social crawlers that do not run
  JavaScript still see the static metadata in `index.html`, so update those
  static values when you personalise the site.

---

## Error handling

`data-loader.js` distinguishes between:

- **Network failure:** the request could not be made.
- **HTTP failure:** including a specific message for a missing `data/cv.json`.
- **Invalid JSON:** the file was fetched but could not be parsed.
- **Validation failure:** required values or expected structures are missing or
  have the wrong type.

On failure, the page hides the print button, displays a clear error panel with a
**Try again** button and logs the technical details to the browser console. The
error panel receives keyboard focus so the failure is not silent.

Empty optional sections are not errors: their sections are simply omitted.

---

## Customisation

Visual tokens are defined at the top of `css/style.css`:

```css
:root {
  --bg: #fcfcfa;
  --text: #1c2326;
  --muted: #5f6a6d;
  --accent: #135c4c;
  /* ... */
}
```

Changing those values updates the screen theme. Print colours are controlled
separately inside `@media print`.

To change the section order, edit the sequence in `renderCv()` in
`js/renderer.js`. To change section labels, edit the strings passed to
`renderSection()`.

If you introduce new JSON fields, add validation in `validateCvData()` and
render them explicitly in `renderer.js`. The renderer never inserts JSON content
with `innerHTML`; all content is created with DOM APIs and `textContent`.

---

## Browser support

The site targets current evergreen browsers that support:

- ES modules and `fetch`
- CSS Grid and flexbox
- `Intl.DateTimeFormat`

It does not support Internet Explorer. JavaScript is required because the CV is
rendered from JSON at runtime; a `<noscript>` message explains this.

---

## Limitations

- The profile image is a neutral monogram placeholder, not a photograph.
- The Teaching experience section contains a placeholder entry until real
  teaching details are supplied.
- Static SEO/social metadata is duplicated in `index.html` for crawlers and must
  be updated manually when identity details or the deployment URL change; the
  runtime updates are not read by every crawler.
- The Selected Projects section is hidden while the `projects` array is empty.
- The design intentionally has no dark mode, skill bars, animations or filtering
  controls.
- GitHub Pages may serve cached files after an update; hard-refresh or wait for
  the cache to expire.
