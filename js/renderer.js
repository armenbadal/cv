const MONTH_FORMAT = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const FULL_DATE_FORMAT = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

const ISO_DATE_PATTERN = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Render the complete CV into a container.
 *
 * @param {HTMLElement} container
 * @param {object} data Validated CV data.
 */
export function renderCv(container, data) {
  if (!container) {
    throw new Error("The CV container was not found.");
  }

  const article = el("article", "cv");
  article.setAttribute("aria-labelledby", "cv-name");

  article.append(renderHeader(isPlainObject(data.personal) ? data.personal : {}));

  const summary = cleanText(data.summary);
  if (summary) {
    article.append(renderSection("summary", "Summary", [el("p", "cv-summary", summary)]));
  }

  const skills = renderSkills(data.skills);
  if (skills) {
    article.append(renderSection("skills", "Technical skills", [skills]));
  }

  const experience = renderExperience(data.experience);
  if (experience) {
    article.append(renderSection("experience", "Professional experience", experience));
  }

  const projects = renderProjects(data.projects);
  if (projects) {
    article.append(renderSection("projects", "Selected projects", projects));
  }

  const teaching = renderTeaching(data.teaching);
  if (teaching) {
    article.append(renderSection("teaching", "Teaching experience", teaching));
  }

  const education = renderEducation(data.education);
  if (education) {
    article.append(renderSection("education", "Education", education));
  }

  const publications = renderPublications(data.publications);
  if (publications) {
    article.append(renderSection("publications", "Publications", publications));
  }

  container.replaceChildren(article);
}

/**
 * Keep the document title and social metadata aligned with the CV content.
 *
 * @param {object} personal
 * @param {string} summary
 */
export function updateDocumentMetadata(personal = {}, summary = "") {
  const name = cleanText(personal.fullName);
  const title = cleanText(personal.title);
  const pageTitle = [name, title].filter(Boolean).join(" — ") || "Curriculum Vitae";

  const description =
    cleanText(summary) ||
    [name, title].filter(Boolean).join(" — ") ||
    "A single-page curriculum vitae.";

  const metaDescription = truncate(description, 160);

  document.title = pageTitle;

  setMetaContent("name", "description", metaDescription);
  setMetaContent("property", "og:title", pageTitle);
  setMetaContent("property", "og:description", metaDescription);
  setMetaContent("name", "twitter:title", pageTitle);
  setMetaContent("name", "twitter:description", metaDescription);

  if (name) {
    setMetaContent("name", "author", name);
  }
}

function renderHeader(personal) {
  const header = el("header", "cv-header");
  const info = el("div", "cv-header-info");
  const name = cleanText(personal.fullName) || "Curriculum Vitae";

  const heading = el("h1", "cv-name", name);
  heading.id = "cv-name";
  info.append(heading);

  const title = cleanText(personal.title);
  if (title) {
    info.append(el("p", "cv-title", title));
  }

  const contact = renderContact(personal);
  if (contact) {
    info.append(contact);
  }

  header.append(info);

  const photo = renderProfileImage(personal);
  if (photo) {
    header.append(photo);
  }

  return header;
}

function renderContact(personal) {
  const items = [];

  const location = cleanText(personal.location);
  if (location) {
    const item = el("li", "contact-item", location);
    item.prepend(el("span", "sr-only", "Location: "));
    items.push(item);
  }

  const email = cleanText(personal.email);
  if (email) {
    const item = el("li", "contact-item");

    if (EMAIL_PATTERN.test(email)) {
      const link = el("a", "contact-link", email);
      link.href = `mailto:${email}`;
      link.setAttribute("aria-label", `Email: ${email}`);
      item.append(link);
    } else {
      item.textContent = email;
    }

    items.push(item);
  }

  const phone = cleanText(personal.phone);
  if (phone) {
    const item = el("li", "contact-item");
    const dialablePhone = phone.replace(/[^\d+]/g, "");

    if (dialablePhone.replace(/\D/g, "").length >= 5) {
      const link = el("a", "contact-link", phone);
      link.href = `tel:${dialablePhone}`;
      link.setAttribute("aria-label", `Phone: ${phone}`);
      item.append(link);
    } else {
      item.textContent = phone;
    }

    items.push(item);
  }

  const profiles = [
    ["github", "GitHub profile"],
    ["linkedin", "LinkedIn profile"],
    ["website", "Personal website"],
  ];

  for (const [field, accessibleLabel] of profiles) {
    const rawUrl = cleanText(personal[field]);
    const href = toExternalUrl(rawUrl);

    if (!href) {
      continue;
    }

    const visibleLabel = formatUrlLabel(href);
    const link = createExternalLink(href, visibleLabel, `${accessibleLabel}: ${visibleLabel}`, {
      printUrl: false,
    });

    if (link) {
      const item = el("li", "contact-item");
      item.append(link);
      items.push(item);
    }
  }

  if (items.length === 0) {
    return null;
  }

  const list = el("ul", "cv-contact");
  list.append(...items);
  return list;
}

function renderProfileImage(personal) {
  const source = cleanText(personal.profileImage);
  const imageUrl = toSafeImageUrl(source);

  if (!imageUrl) {
    return null;
  }

  const image = document.createElement("img");
  image.className = "cv-photo";
  image.src = imageUrl;
  image.alt =
    cleanText(personal.profileImageAlt) ||
    `Portrait of ${cleanText(personal.fullName) || "the CV owner"}`;
  image.width = 112;
  image.height = 112;
  image.decoding = "async";
  image.loading = "eager";

  image.addEventListener("error", () => image.remove(), { once: true });

  return image;
}

function renderSection(id, title, bodyNodes) {
  const section = el("section", "cv-section");
  section.id = `section-${id}`;

  const heading = el("h2", "cv-section-title", title);
  heading.id = `section-${id}-heading`;
  section.setAttribute("aria-labelledby", heading.id);

  const body = el("div", "cv-section-body");
  body.append(...bodyNodes);

  section.append(heading, body);
  return section;
}

function renderSkills(skills) {
  if (!Array.isArray(skills)) {
    return null;
  }

  const list = el("dl", "skill-list");

  for (const skill of skills) {
    if (!isPlainObject(skill)) {
      continue;
    }

    const category = cleanText(skill.category);
    const items = stringArray(skill.items);

    if (!category || items.length === 0) {
      continue;
    }

    const group = el("div", "skill-group");
    group.append(el("dt", "skill-category", category));
    group.append(el("dd", "skill-items", items.join(", ")));
    list.append(group);
  }

  return list.childElementCount > 0 ? list : null;
}

function renderExperience(experience) {
  if (!Array.isArray(experience)) {
    return null;
  }

  const entries = experience.map(renderExperienceEntry).filter(Boolean);
  return entries.length > 0 ? entries : null;
}

function renderExperienceEntry(entry) {
  if (!isPlainObject(entry)) {
    return null;
  }

  const company = cleanText(entry.company);
  const position = cleanText(entry.position);
  const title = position || company;

  if (!title) {
    return null;
  }

  const article = el("article", "entry experience-entry");
  const head = el("div", "entry-head");
  const identity = el("div", "entry-identity");

  identity.append(el("h3", "entry-title", title));

  const organization = [];

  if (position && company) {
    organization.push(el("span", "entry-company", company));
  }

  const location = cleanText(entry.location);
  if (location) {
    organization.push(el("span", "entry-location", location));
  }

  const organizationLine = createMetaLine(organization, "entry-org");
  if (organizationLine) {
    identity.append(organizationLine);
  }

  head.append(identity);

  const period = createDateRange(entry.startDate, entry.endDate, entry.current === true);
  if (period) {
    head.append(period);
  }

  article.append(head);

  const description = cleanText(entry.description);
  if (description) {
    article.append(el("p", "entry-description", description));
  }

  const achievements = stringArray(entry.achievements);
  if (achievements.length > 0) {
    const list = el("ul", "entry-list");
    list.setAttribute("aria-label", "Achievements and responsibilities");
    list.append(...achievements.map((achievement) => el("li", null, achievement)));
    article.append(list);
  }

  const technologies = stringArray(entry.technologies);
  if (technologies.length > 0) {
    article.append(createTechnologyLine(technologies));
  }

  return article;
}

function renderProjects(projects) {
  if (!Array.isArray(projects)) {
    return null;
  }

  const entries = projects.map(renderProjectEntry).filter(Boolean);
  return entries.length > 0 ? entries : null;
}

function renderProjectEntry(entry) {
  if (!isPlainObject(entry)) {
    return null;
  }

  const name = cleanText(entry.name);

  if (!name) {
    return null;
  }

  const article = el("article", "entry project-entry");
  const head = el("div", "entry-head");
  const identity = el("div", "entry-identity");

  identity.append(el("h3", "entry-title", name));

  head.append(identity);

  const links = el("p", "entry-links");

  const githubLink = createExternalLink(entry.githubUrl, "GitHub", `GitHub repository for ${name}`);
  if (githubLink) {
    links.append(githubLink);
  }

  const projectLink = createExternalLink(entry.projectUrl, "Website", `Website for ${name}`);
  if (projectLink) {
    links.append(projectLink);
  }

  if (links.childElementCount > 0) {
    head.append(links);
  }

  article.append(head);

  const description = cleanText(entry.description);
  if (description) {
    article.append(el("p", "entry-description", description));
  }

  const technologies = stringArray(entry.technologies);
  if (technologies.length > 0) {
    article.append(createTechnologyLine(technologies));
  }

  return article;
}

function renderTeaching(teaching) {
  if (!Array.isArray(teaching)) {
    return null;
  }

  const entries = teaching.map(renderTeachingEntry).filter(Boolean);
  return entries.length > 0 ? entries : null;
}

function renderTeachingEntry(entry) {
  if (!isPlainObject(entry)) {
    return null;
  }

  const institution = cleanText(entry.institution);
  const role = cleanText(entry.role);
  const title = role || institution;

  if (!title) {
    return null;
  }

  const article = el("article", "entry teaching-entry");
  const head = el("div", "entry-head");
  const identity = el("div", "entry-identity");

  identity.append(el("h3", "entry-title", title));

  const organization = [];

  if (role && institution) {
    organization.push(el("span", "entry-company", institution));
  }

  const location = cleanText(entry.location);
  if (location) {
    organization.push(el("span", "entry-location", location));
  }

  const organizationLine = createMetaLine(organization, "entry-org");
  if (organizationLine) {
    identity.append(organizationLine);
  }

  head.append(identity);

  const period = createDateRange(entry.startDate, entry.endDate, entry.current === true);
  if (period) {
    head.append(period);
  }

  article.append(head);

  const description = cleanText(entry.description);
  if (description) {
    article.append(el("p", "entry-description", description));
  }

  const courses = stringArray(entry.courses);
  if (courses.length > 0) {
    const list = el("ul", "entry-list");
    list.setAttribute("aria-label", "Courses and topics");
    list.append(...courses.map((course) => el("li", null, course)));
    article.append(list);
  }

  return article;
}

function renderEducation(education) {
  if (!Array.isArray(education)) {
    return null;
  }

  const entries = education.map(renderEducationEntry).filter(Boolean);
  return entries.length > 0 ? entries : null;
}

function renderEducationEntry(entry) {
  if (!isPlainObject(entry)) {
    return null;
  }

  const institution = cleanText(entry.institution);

  if (!institution) {
    return null;
  }

  const article = el("article", "entry education-entry");
  const head = el("div", "entry-head");
  const identity = el("div", "entry-identity");

  identity.append(el("h3", "entry-title", institution));

  const degree = cleanText(entry.degree);
  const field = cleanText(entry.field);
  const location = cleanText(entry.location);
  const qualification = degree && field ? `${degree} in ${field}` : degree || field;

  const details = [];

  if (qualification) {
    details.push(el("span", "entry-qualification", qualification));
  }

  if (location) {
    details.push(el("span", "entry-location", location));
  }

  const detailLine = createMetaLine(details, "entry-org");
  if (detailLine) {
    identity.append(detailLine);
  }

  head.append(identity);

  const period = createDateRange(entry.startDate, entry.endDate, false);
  if (period) {
    head.append(period);
  }

  article.append(head);

  const description = cleanText(entry.description);
  if (description) {
    article.append(el("p", "entry-description", description));
  }

  return article;
}

function renderPublications(publications) {
  if (!Array.isArray(publications)) {
    return null;
  }

  const entries = publications.map(renderPublicationEntry).filter(Boolean);
  return entries.length > 0 ? entries : null;
}

function renderPublicationEntry(entry) {
  if (!isPlainObject(entry)) {
    return null;
  }

  const title = cleanText(entry.title);

  if (!title) {
    return null;
  }

  const article = el("article", "entry publication-entry");
  const head = el("div", "entry-head");
  const identity = el("div", "entry-identity");

  identity.append(el("h3", "entry-title", title));

  const date = createDateNode(entry.date);
  const publisher = cleanText(entry.publisher);

  if (date || publisher) {
    const meta = el("p", "entry-meta");

    if (date) {
      meta.append(date);
    }

    if (date && publisher) {
      meta.append(text(" · "));
    }

    if (publisher) {
      meta.append(text(publisher));
    }

    identity.append(meta);
  }

  head.append(identity);

  const url = cleanText(entry.url);
  const link = createExternalLink(url, "Read publication", `Read ${title}`);

  if (link) {
    const links = el("p", "entry-links");
    links.append(link);
    head.append(links);
  }

  article.append(head);

  const description = cleanText(entry.description);
  if (description) {
    article.append(el("p", "entry-description", description));
  }

  return article;
}

function createDateRange(startDate, endDate, isCurrent) {
  const start = createDateNode(startDate);
  const end = createDateNode(endDate);

  if (isCurrent) {
    if (!start) {
      return null;
    }

    const currentPeriod = el("p", "entry-period");
    currentPeriod.append(start, text(" – "), text("Present"));
    return currentPeriod;
  }

  if (!start && !end) {
    return null;
  }

  const period = el("p", "entry-period");

  if (start) {
    period.append(start);
  }

  if (start && end) {
    period.append(text(" – "));
  }

  if (end) {
    period.append(end);
  }

  return period;
}

function createDateNode(value) {
  const dateText = cleanText(value);

  if (!dateText) {
    return null;
  }

  if (!ISO_DATE_PATTERN.test(dateText)) {
    return text(dateText);
  }

  const time = el("time", null, formatDate(dateText));
  time.dateTime = dateText;
  return time;
}

function formatDate(value) {
  const match = value.match(ISO_DATE_PATTERN);

  if (!match) {
    return value;
  }

  const year = Number(match[1]);
  const month = match[2] ? Number(match[2]) : null;
  const day = match[3] ? Number(match[3]) : null;

  if (month === null) {
    return String(year);
  }

  if (month < 1 || month > 12) {
    return value;
  }

  const date = new Date(Date.UTC(year, month - 1, day ?? 1));

  if (day !== null && date.getUTCDate() !== day) {
    return value;
  }

  return day === null ? MONTH_FORMAT.format(date) : FULL_DATE_FORMAT.format(date);
}

function createTechnologyLine(technologies) {
  const line = el("p", "entry-tech");
  line.append(el("span", "tech-label", "Technologies: "));
  line.append(text(technologies.join(", ")));
  return line;
}

function createMetaLine(nodes, className) {
  if (nodes.length === 0) {
    return null;
  }

  const line = el("p", className);

  nodes.forEach((node, index) => {
    if (index > 0) {
      line.append(text(" · "));
    }

    line.append(node);
  });

  return line;
}

function createExternalLink(rawUrl, label, accessibleContext, { printUrl = true } = {}) {
  const href = toExternalUrl(rawUrl);

  if (!href) {
    return null;
  }

  const link = el("a", "external-link", label);
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", `${accessibleContext} (opens in a new tab)`);

  if (printUrl) {
    link.classList.add("print-url");
  }

  return link;
}

function toExternalUrl(value) {
  const raw = cleanText(value);

  if (!raw) {
    return null;
  }

  try {
    const url = new URL(raw);

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.href;
    }
  } catch {
    // Relative or malformed URLs are not valid external links.
  }

  return null;
}

function toSafeImageUrl(value) {
  const raw = cleanText(value);

  if (!raw || raw.startsWith("/")) {
    return null;
  }

  try {
    const url = new URL(raw, document.baseURI);

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.href;
    }
  } catch {
    // Ignore paths that cannot be resolved.
  }

  return null;
}

function formatUrlLabel(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
    return `${host}${path}`;
  } catch {
    return value;
  }
}

function setMetaContent(attribute, key, content) {
  const selector = `meta[${attribute}="${key}"]`;
  let meta = document.head.querySelector(selector);

  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, key);
    document.head.append(meta);
  }

  meta.setAttribute("content", content);
}

function truncate(value, limit) {
  if (value.length <= limit) {
    return value;
  }

  const available = value.slice(0, limit - 1).trimEnd();
  const lastSpace = available.lastIndexOf(" ");
  const shortened = lastSpace > 0 ? available.slice(0, lastSpace) : available;

  return /[.!?]$/.test(shortened) ? shortened : `${shortened}…`;
}

function el(tagName, className, textContent) {
  const node = document.createElement(tagName);

  if (className) {
    node.className = className;
  }

  if (textContent !== undefined && textContent !== null) {
    node.textContent = String(textContent);
  }

  return node;
}

function text(value) {
  return document.createTextNode(value);
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function stringArray(value) {
  return Array.isArray(value) ? value.map(cleanText).filter(Boolean) : [];
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
