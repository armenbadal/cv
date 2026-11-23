const CV_DATA_URL = new URL("../data/cv.json", import.meta.url);

/**
 * An error that carries a message suitable for showing to the visitor.
 */
export class CvDataError extends Error {
  constructor(message, { kind = "unknown", cause = null } = {}) {
    super(message);
    this.name = "CvDataError";
    this.kind = kind;
    this.cause = cause;
  }
}

/**
 * Load and validate the CV data.
 *
 * @param {string | URL} [url] Location of the CV JSON file.
 * @returns {Promise<object>} The parsed CV data.
 * @throws {CvDataError} When the request, parsing, or validation fails.
 */
export async function loadCvData(url = CV_DATA_URL) {
  let response;

  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-cache",
    });
  } catch (cause) {
    throw new CvDataError(
      "The CV data could not be downloaded. Check your internet connection and make sure the site is served over HTTP.",
      { kind: "network", cause }
    );
  }

  if (!response.ok) {
    const message =
      response.status === 404
        ? "The CV data file was not found. Make sure data/cv.json exists and the site is served over HTTP."
        : `The CV data could not be loaded (HTTP ${response.status}).`;

    throw new CvDataError(message, { kind: "http" });
  }

  let data;

  try {
    data = await response.json();
  } catch (cause) {
    throw new CvDataError(
      "The CV data is not valid JSON. Check data/cv.json for syntax errors.",
      { kind: "parse", cause }
    );
  }

  const issues = validateCvData(data);

  if (issues.length > 0) {
    throw new CvDataError(
      `The CV data is incomplete or malformed. ${issues.join(" ")}`,
      { kind: "validation" }
    );
  }

  return data;
}

/**
 * Validate the basic structure of the CV data.
 *
 * Only the fields needed to identify the CV and its entries are required.
 * Optional sections may be omitted or left as empty arrays.
 *
 * @param {unknown} data
 * @returns {string[]} A list of human-readable validation issues.
 */
export function validateCvData(data) {
  /** @type {string[]} */
  const issues = [];

  if (!isPlainObject(data)) {
    return ["The root of cv.json must be a JSON object."];
  }

  if (!isPlainObject(data.personal)) {
    issues.push('"personal" must be an object.');
  } else {
    requireText(data.personal, "personal.fullName", issues);
    requireText(data.personal, "personal.title", issues);

    for (const field of [
      "location",
      "email",
      "phone",
      "github",
      "linkedin",
      "website",
      "profileImage",
      "profileImageAlt",
    ]) {
      checkOptionalString(data.personal, `personal.${field}`, issues);
    }
  }

  checkOptionalString(data, "summary", issues);

  validateCollection(data, "skills", issues, (entry, path) => {
    requireText(entry, `${path}.category`, issues);
    checkStringArray(entry, `${path}.items`, issues, { required: true });
  });

  validateCollection(data, "experience", issues, (entry, path) => {
    requireText(entry, `${path}.company`, issues);
    requireText(entry, `${path}.position`, issues);

    for (const field of ["startDate", "endDate", "location", "description"]) {
      checkOptionalString(entry, `${path}.${field}`, issues);
    }

    if (entry.current !== undefined && typeof entry.current !== "boolean") {
      issues.push(`"${path}.current" must be a boolean.`);
    }

    checkStringArray(entry, `${path}.achievements`, issues);
    checkStringArray(entry, `${path}.technologies`, issues);
  });

  validateCollection(data, "projects", issues, (entry, path) => {
    requireText(entry, `${path}.name`, issues);

    for (const field of ["description", "githubUrl", "projectUrl"]) {
      checkOptionalString(entry, `${path}.${field}`, issues);
    }

    checkStringArray(entry, `${path}.technologies`, issues);
  });

  validateCollection(data, "teaching", issues, (entry, path) => {
    requireText(entry, `${path}.institution`, issues);
    requireText(entry, `${path}.role`, issues);

    for (const field of ["startDate", "endDate", "location", "description"]) {
      checkOptionalString(entry, `${path}.${field}`, issues);
    }

    if (entry.current !== undefined && typeof entry.current !== "boolean") {
      issues.push(`"${path}.current" must be a boolean.`);
    }

    checkStringArray(entry, `${path}.courses`, issues);
  });

  validateCollection(data, "education", issues, (entry, path) => {
    requireText(entry, `${path}.institution`, issues);
    requireText(entry, `${path}.degree`, issues);

    for (const field of ["field", "startDate", "endDate", "location", "description"]) {
      checkOptionalString(entry, `${path}.${field}`, issues);
    }
  });

  validateCollection(data, "publications", issues, (entry, path) => {
    requireText(entry, `${path}.title`, issues);

    for (const field of ["description", "date", "publisher", "url"]) {
      checkOptionalString(entry, `${path}.${field}`, issues);
    }
  });

  return issues;
}

function validateCollection(data, key, issues, validateEntry) {
  if (data[key] === undefined) {
    return;
  }

  if (!Array.isArray(data[key])) {
    issues.push(`"${key}" must be an array.`);
    return;
  }

  data[key].forEach((entry, index) => {
    const path = `${key}[${index}]`;

    if (!isPlainObject(entry)) {
      issues.push(`"${path}" must be an object.`);
      return;
    }

    validateEntry(entry, path);
  });
}

function requireText(object, path, issues) {
  const value = object[path.split(".").pop()];

  if (typeof value !== "string" || value.trim() === "") {
    issues.push(`"${path}" is required and must be a non-empty string.`);
  }
}

function checkOptionalString(object, path, issues) {
  const value = object[path.split(".").pop()];

  if (value !== undefined && typeof value !== "string") {
    issues.push(`"${path}" must be a string.`);
  }
}

function checkStringArray(object, path, issues, { required = false } = {}) {
  const value = object[path.split(".").pop()];

  if (value === undefined) {
    if (required) {
      issues.push(`"${path}" is required and must be an array of strings.`);
    }
    return;
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    issues.push(`"${path}" must be an array of strings.`);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
