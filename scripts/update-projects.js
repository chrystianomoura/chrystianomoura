const fs = require("node:fs");

const USERNAME = "chrystianomoura";
const PROFILE_REPOSITORY = USERNAME;
const README_PATH = "README.md";
const PROJECT_LIMIT = 6;

const START_MARKER = "<!-- PROJECTS:START -->";
const END_MARKER = "<!-- PROJECTS:END -->";

async function fetchRepositories() {
  const response = await fetch(
    `https://api.github.com/users/${USERNAME}/repos?per_page=100&type=owner`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": `${USERNAME}-profile`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `GitHub API request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

function selectRecentProjects(repositories) {
  return repositories
    .filter((repository) => !repository.private)
    .filter((repository) => !repository.fork)
    .filter((repository) => !repository.archived)
    .filter((repository) => repository.name !== PROFILE_REPOSITORY)
    .sort(
      (a, b) =>
        new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime(),
    )
    .slice(0, PROJECT_LIMIT);
}

function formatProjectName(name) {
  const customNames = {
    pokedex: "Pokédex",
    NYVOLT: "NYVOLT",
    quiz: "Quiz",
    "pedra-papel-tesoura": "Pedra, Papel e Tesoura",
    "password-generator": "Password Generator",
    jaraka: "JARAKA",
    done: "Done.",
    syvron: "SYVRON",
    "nagato-electronics-ne84": "NE-84 Calculator",
  };

  if (customNames[name]) {
    return customNames[name];
  }

  return name
    .split(/[-_]/)
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function createProjectMarkdown(repository) {
  const name = formatProjectName(repository.name);

  const description =
    repository.description?.trim() || "Projeto disponível no GitHub.";

  const language = repository.language
    ? `\`${repository.language}\`\n\n`
    : "";

  const links = [`[Repositório →](${repository.html_url})`];

  if (repository.homepage?.trim()) {
    links.push(`[Projeto online →](${repository.homepage.trim()})`);
  }

  return [
    `### ${name}`,
    "",
    description,
    "",
    language.trimEnd(),
    language ? "" : null,
    links.join(" · "),
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function createProjectsSection(projects) {
  if (projects.length === 0) {
    return "Nenhum projeto público encontrado.";
  }

  return projects.map(createProjectMarkdown).join("\n\n---\n\n");
}

function updateReadme(projectsMarkdown) {
  const readme = fs.readFileSync(README_PATH, "utf8");

  const startIndex = readme.indexOf(START_MARKER);
  const endIndex = readme.indexOf(END_MARKER);

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    throw new Error(
      "Os marcadores PROJECTS:START e PROJECTS:END não foram encontrados corretamente no README.md.",
    );
  }

  const beforeProjects =
    readme.slice(0, startIndex + START_MARKER.length).trimEnd();

  const afterProjects = readme.slice(endIndex).trimStart();

  const updatedReadme = `${beforeProjects}

${projectsMarkdown}
${afterProjects}
`;

  fs.writeFileSync(README_PATH, updatedReadme);
}

async function main() {
  const repositories = await fetchRepositories();
  const projects = selectRecentProjects(repositories);
  const projectsMarkdown = createProjectsSection(projects);

  updateReadme(projectsMarkdown);

  console.log(
    `README atualizado com ${projects.length} projeto(s): ${projects
      .map((project) => project.name)
      .join(", ")}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
