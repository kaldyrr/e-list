export type RobotsRule = {
  allow: boolean;
  path: string;
};

export type RobotsPolicy = {
  sitemaps: string[];
  crawlDelayMs?: number;
  rules: RobotsRule[];
};

const USER_AGENT = "E-ListComplianceCheck/0.1 (+https://github.com/kaldyrr/e-list)";

export async function fetchRobotsPolicy(robotsUrl: string): Promise<RobotsPolicy> {
  const response = await fetchWithTimeout(robotsUrl, 15_000);

  if (!response.ok) {
    throw new Error(`robots fetch failed: ${response.status}`);
  }

  return parseRobots(await response.text());
}

export function parseRobots(content: string): RobotsPolicy {
  const lines = content.split(/\r?\n/);
  const sitemaps: string[] = [];
  const rules: RobotsRule[] = [];
  let crawlDelayMs: number | undefined;
  let activeGroupApplies = false;
  let currentAgents: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.split("#")[0]?.trim();

    if (!line) {
      activeGroupApplies = false;
      currentAgents = [];
      continue;
    }

    const separatorIndex = line.indexOf(":");

    if (separatorIndex === -1) {
      continue;
    }

    const field = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();

    if (field === "sitemap" && value) {
      sitemaps.push(value);
      continue;
    }

    if (field === "user-agent") {
      currentAgents.push(value.toLowerCase());
      activeGroupApplies = currentAgents.some((agent) => agent === "*" || USER_AGENT.toLowerCase().includes(agent));
      continue;
    }

    if (!activeGroupApplies) {
      continue;
    }

    if ((field === "allow" || field === "disallow") && value) {
      rules.push({
        allow: field === "allow",
        path: value,
      });
    }

    if (field === "crawl-delay") {
      const seconds = Number(value);

      if (Number.isFinite(seconds) && seconds >= 0) {
        crawlDelayMs = seconds * 1000;
      }
    }
  }

  return { crawlDelayMs, rules, sitemaps };
}

export function isPathAllowed(path: string, policy: RobotsPolicy) {
  const matchingRules = policy.rules
    .filter((rule) => pathMatchesRule(path, rule.path))
    .sort((a, b) => b.path.length - a.path.length);

  return matchingRules[0]?.allow ?? true;
}

function pathMatchesRule(path: string, rulePath: string) {
  if (rulePath === "/") {
    return true;
  }

  const escaped = rulePath
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replaceAll("*", ".*")
    .replaceAll("\\$", "$");
  const expression = new RegExp(`^${escaped}`);

  return expression.test(path);
}

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}
