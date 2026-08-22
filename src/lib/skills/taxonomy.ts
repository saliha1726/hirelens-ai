/**
 * Skill taxonomy: canonical skill names with alias maps and categories.
 *
 * Used by both resume parsing (recognition) and job-requirement parsing so the
 * same normalization applies on both sides of every match — "Reactjs" in a
 * resume matches "React.js" in a job description.
 */

export interface SkillDef {
  canonical: string;
  category: string;
  aliases?: string[];
}

export const SKILL_TAXONOMY: SkillDef[] = [
  // ── Languages ──
  { canonical: "JavaScript", category: "Language", aliases: ["js", "es6", "ecmascript", "javascript(es6)"] },
  { canonical: "TypeScript", category: "Language", aliases: ["ts"] },
  { canonical: "Python", category: "Language" },
  { canonical: "Java", category: "Language" },
  { canonical: "C#", category: "Language", aliases: ["csharp", "c sharp", ".net c#"] },
  { canonical: "C++", category: "Language", aliases: ["cpp"] },
  { canonical: "C", category: "Language" },
  { canonical: "Go", category: "Language", aliases: ["golang"] },
  { canonical: "Rust", category: "Language" },
  { canonical: "Ruby", category: "Language" },
  { canonical: "PHP", category: "Language" },
  { canonical: "Swift", category: "Language" },
  { canonical: "Kotlin", category: "Language" },
  { canonical: "Scala", category: "Language" },
  { canonical: "R", category: "Language" },
  { canonical: "SQL", category: "Language" },
  { canonical: "Bash", category: "Language", aliases: ["shell scripting", "shell", "bash scripting"] },
  { canonical: "HTML", category: "Language" },
  { canonical: "CSS", category: "Language" },
  { canonical: "Solidity", category: "Language" },
  { canonical: "MATLAB", category: "Language" },
  { canonical: "VBA", category: "Language" },

  // ── Frontend frameworks & UI ──
  { canonical: "React", category: "Frontend", aliases: ["react.js", "reactjs"] },
  { canonical: "Next.js", category: "Frontend", aliases: ["nextjs", "next js"] },
  { canonical: "Vue.js", category: "Frontend", aliases: ["vue", "vuejs"] },
  { canonical: "Angular", category: "Frontend", aliases: ["angularjs", "angular 2+"] },
  { canonical: "Svelte", category: "Frontend" },
  { canonical: "Redux", category: "Frontend" },
  { canonical: "Tailwind CSS", category: "Frontend", aliases: ["tailwind", "tailwindcss"] },
  { canonical: "Bootstrap", category: "Frontend" },
  { canonical: "jQuery", category: "Frontend" },
  { canonical: "Sass", category: "Frontend", aliases: ["scss"] },
  { canonical: "Webpack", category: "Frontend" },
  { canonical: "Vite", category: "Frontend" },
  { canonical: "Storybook", category: "Frontend" },
  { canonical: "Framer Motion", category: "Frontend" },

  // ── Backend & frameworks ──
  { canonical: "Node.js", category: "Backend", aliases: ["nodejs", "node js"] },
  { canonical: "Express.js", category: "Backend", aliases: ["express", "expressjs"] },
  { canonical: "NestJS", category: "Backend", aliases: ["nest.js"] },
  { canonical: "Django", category: "Backend" },
  { canonical: "Flask", category: "Backend" },
  { canonical: "FastAPI", category: "Backend" },
  { canonical: "Spring Boot", category: "Backend", aliases: ["springboot", "spring framework", "spring"] },
  { canonical: ".NET", category: "Backend", aliases: ["dotnet", "asp.net", "asp.net core"] },
  { canonical: "Laravel", category: "Backend" },
  { canonical: "Rails", category: "Backend", aliases: ["ruby on rails", "ror"] },
  { canonical: "GraphQL", category: "Backend" },
  { canonical: "REST APIs", category: "Backend", aliases: ["rest api", "restful api", "restful services", "restful apis"] },
  { canonical: "Microservices", category: "Architecture", aliases: ["microservices architecture"] },
  { canonical: "gRPC", category: "Backend" },
  { canonical: "WebSockets", category: "Backend" },
  { canonical: "Kafka", category: "Data Engineering", aliases: ["apache kafka"] },
  { canonical: "RabbitMQ", category: "Data Engineering" },

  // ── Databases ──
  { canonical: "PostgreSQL", category: "Database", aliases: ["postgres"] },
  { canonical: "MySQL", category: "Database" },
  { canonical: "MongoDB", category: "Database", aliases: ["mongo"] },
  { canonical: "Redis", category: "Database" },
  { canonical: "SQLite", category: "Database" },
  { canonical: "Microsoft SQL Server", category: "Database", aliases: ["sql server", "mssql", "ms sql"] },
  { canonical: "Oracle Database", category: "Database", aliases: ["oracle db", "oracle sql", "pl/sql"] },
  { canonical: "DynamoDB", category: "Database" },
  { canonical: "Elasticsearch", category: "Database", aliases: ["opensearch"] },
  { canonical: "Snowflake", category: "Database" },
  { canonical: "BigQuery", category: "Database" },
  { canonical: "Cassandra", category: "Database" },
  { canonical: "Supabase", category: "Database" },
  { canonical: "Firebase", category: "Database" },
  { canonical: "Prisma", category: "Database" },

  // ── Cloud & DevOps ──
  { canonical: "AWS", category: "Cloud", aliases: ["amazon web services", "aws cloud"] },
  { canonical: "Azure", category: "Cloud", aliases: ["microsoft azure"] },
  { canonical: "Google Cloud Platform", category: "Cloud", aliases: ["gcp", "google cloud"] },
  { canonical: "Docker", category: "DevOps", aliases: ["containerization"] },
  { canonical: "Kubernetes", category: "DevOps", aliases: ["k8s"] },
  { canonical: "Terraform", category: "DevOps", aliases: ["infrastructure as code", "iac"] },
  { canonical: "CI/CD", category: "DevOps", aliases: ["ci cd", "continuous integration", "continuous delivery", "cicd pipelines", "ci/cd pipelines"] },
  { canonical: "Jenkins", category: "DevOps" },
  { canonical: "GitHub Actions", category: "DevOps", aliases: ["github action workflows"] },
  { canonical: "GitLab CI", category: "DevOps" },
  { canonical: "Ansible", category: "DevOps" },
  { canonical: "Helm", category: "DevOps" },
  { canonical: "Linux", category: "DevOps" },
  { canonical: "Nginx", category: "DevOps" },
  { canonical: "Prometheus", category: "DevOps" },
  { canonical: "Grafana", category: "DevOps" },
  { canonical: "Datadog", category: "DevOps" },
  { canonical: "Serverless", category: "Cloud", aliases: ["serverless architecture", "lambda functions"] },
  { canonical: "AWS Lambda", category: "Cloud", aliases: ["aws lambdas", "lambda"] },

  // ── Data science & AI/ML ──
  { canonical: "Machine Learning", category: "AI/ML", aliases: ["ml"] },
  { canonical: "Deep Learning", category: "AI/ML" },
  { canonical: "TensorFlow", category: "AI/ML" },
  { canonical: "PyTorch", category: "AI/ML", aliases: ["torch"] },
  { canonical: "scikit-learn", category: "AI/ML", aliases: ["sklearn", "scikit learn"] },
  { canonical: "NLP", category: "AI/ML", aliases: ["natural language processing"] },
  { canonical: "Computer Vision", category: "AI/ML", aliases: ["cv", "image recognition"] },
  { canonical: "LLMs", category: "AI/ML", aliases: ["large language models", "llm", "generative ai", "genai"] },
  { canonical: "LangChain", category: "AI/ML", aliases: ["langgraph"] },
  { canonical: "Pandas", category: "Data Analysis" },
  { canonical: "NumPy", category: "Data Analysis", aliases: ["numpy"] },
  { canonical: "Data Analysis", category: "Data Analysis", aliases: ["data analytics", "analytics"] },
  { canonical: "Data Visualization", category: "Data Analysis", aliases: ["data visualisation", "dashboards"] },
  { canonical: "Power BI", category: "Data Analysis", aliases: ["powerbi"] },
  { canonical: "Tableau", category: "Data Analysis" },
  { canonical: "Excel", category: "Data Analysis", aliases: ["advanced excel", "ms excel", "microsoft excel"] },
  { canonical: "Statistics", category: "Data Analysis", aliases: ["statistical analysis", "statistical modeling"] },
  { canonical: "A/B Testing", category: "Data Analysis", aliases: ["ab testing", "split testing", "experimentation"] },
  { canonical: "ETL", category: "Data Engineering", aliases: ["etl pipelines", "elt"] },
  { canonical: "Apache Spark", category: "Data Engineering", aliases: ["spark", "pyspark"] },
  { canonical: "Airflow", category: "Data Engineering", aliases: ["apache airflow"] },
  { canonical: "dbt", category: "Data Engineering", aliases: ["data build tool"] },
  { canonical: "Data Modeling", category: "Data Engineering", aliases: ["data modelling"] },
  { canonical: "Hadoop", category: "Data Engineering" },
  { canonical: "Databricks", category: "Data Engineering" },
  { canonical: "Data Warehousing", category: "Data Engineering", aliases: ["data warehouse", "dwh"] },

  // ── QA & Security ──
  { canonical: "Automated Testing", category: "QA", aliases: ["unit testing", "test automation", "automated tests", "integration testing", "jest", "pytest", "cypress", "selenium"] },
  { canonical: "Manual Testing", category: "QA", aliases: ["qa testing", "quality assurance", "test cases"] },
  { canonical: "Penetration Testing", category: "Security", aliases: ["pen testing", "pentesting"] },
  { canonical: "Application Security", category: "Security", aliases: ["appsec", "owasp"] },
  { canonical: "Network Security", category: "Security", aliases: ["firewalls", "ids/ips"] },
  { canonical: "SIEM", category: "Security", aliases: ["splunk", "security information and event management"] },
  { canonical: "Cryptography", category: "Security" },
  { canonical: "IAM", category: "Security", aliases: ["identity and access management", "okta", "auth0"] },
  { canonical: "SOC Operations", category: "Security", aliases: ["soc analyst", "security operations center"] },
  { canonical: "Compliance", category: "Security", aliases: ["soc 2", "gdpr", "hipaa compliance", "iso 27001", "pci dss"] },
  { canonical: "Threat Modeling", category: "Security", aliases: ["threat intelligence"] },

  // ── Product, Design & Marketing ──
  { canonical: "Product Management", category: "Product", aliases: ["product owner", "roadmapping", "product strategy"] },
  { canonical: "Agile", category: "Ways of Working", aliases: ["agile methodology", "agile methodologies"] },
  { canonical: "Scrum", category: "Ways of Working", aliases: ["scrum master", "scrum ceremonies"] },
  { canonical: "Kanban", category: "Ways of Working" },
  { canonical: "JIRA", category: "Tools", aliases: ["atlassian jira"] },
  { canonical: "Confluence", category: "Tools" },
  { canonical: "UI Design", category: "Design", aliases: ["user interface design", "ui/ux design", "ui ux"] },
  { canonical: "UX Research", category: "Design", aliases: ["user research", "usability testing"] },
  { canonical: "Figma", category: "Design" },
  { canonical: "Adobe Photoshop", category: "Design", aliases: ["photoshop"] },
  { canonical: "Adobe Illustrator", category: "Design", aliases: ["illustrator"] },
  { canonical: "Wireframing", category: "Design", aliases: ["prototyping", "wireframes"] },
  { canonical: "Digital Marketing", category: "Marketing" },
  { canonical: "SEO", category: "Marketing", aliases: ["search engine optimization"] },
  { canonical: "Content Marketing", category: "Marketing" },
  { canonical: "Google Analytics", category: "Marketing", aliases: ["ga4"] },
  { canonical: "Social Media Marketing", category: "Marketing", aliases: ["social media management"] },
  { canonical: "Email Marketing", category: "Marketing", aliases: ["mailchimp", "campaign management"] },
  { canonical: "Copywriting", category: "Marketing" },
  { canonical: "Brand Management", category: "Marketing", aliases: ["branding"] },
  { canonical: "Market Research", category: "Marketing" },

  // ── Business, Finance & Ops ──
  { canonical: "Financial Modeling", category: "Finance", aliases: ["financial analysis", "financial forecasting"] },
  { canonical: "Financial Reporting", category: "Finance", aliases: ["ifrs", "gaap reporting"] },
  { canonical: "Accounting", category: "Finance", aliases: ["bookkeeping", "accounts payable", "accounts receivable"] },
  { canonical: "Budgeting", category: "Finance", aliases: ["budget management", "forecasting"] },
  { canonical: "Risk Management", category: "Finance" },
  { canonical: "Audit", category: "Finance", aliases: ["internal audit", "auditing"] },
  { canonical: "Tax Preparation", category: "Finance", aliases: ["taxation", "tax compliance"] },
  { canonical: "QuickBooks", category: "Finance" },
  { canonical: "SAP", category: "Enterprise Systems", aliases: ["sap erp", "sap fico"] },
  { canonical: "Salesforce", category: "Enterprise Systems", aliases: ["crm", "salesforce crm"] },
  { canonical: "HubSpot", category: "Enterprise Systems" },
  { canonical: "Supply Chain Management", category: "Operations", aliases: ["supply chain", "logistics", "procurement"] },
  { canonical: "Project Management", category: "Operations", aliases: ["pmp certified project management", "program management"] },
  { canonical: "Stakeholder Management", category: "Soft Skills", aliases: ["stakeholder engagement"] },
  { canonical: "Business Analysis", category: "Business", aliases: ["business analyst", "requirements gathering"] },
  { canonical: "Customer Success", category: "Business", aliases: ["account management", "customer support", "client relations"] },
  { canonical: "Sales", category: "Business", aliases: ["b2b sales", "inside sales", "sales enablement", "lead generation"] },
  { canonical: "Negotiation", category: "Soft Skills" },
  { canonical: "Recruiting", category: "HR", aliases: ["talent acquisition", "full-cycle recruiting", "sourcing candidates"] },
  { canonical: "HR Management", category: "HR", aliases: ["human resources", "hris", "employee relations"] },
  { canonical: "Payroll Administration", category: "HR", aliases: ["payroll"] },
  { canonical: "Technical Writing", category: "Communication", aliases: ["documentation"] },
  { canonical: "Public Speaking", category: "Communication", aliases: ["presentation skills"] },

  // ── Healthcare & Education domains ──
  { canonical: "Patient Care", category: "Healthcare" },
  { canonical: "Electronic Health Records", category: "Healthcare", aliases: ["ehr", "emr systems", "epic ehr", "cerner"] },
  { canonical: "Clinical Research", category: "Healthcare", aliases: ["clinical trials", "gcp compliance"] },
  { canonical: "Medical Coding", category: "Healthcare", aliases: ["icd-10", "cpt coding"] },
  { canonical: "Phlebotomy", category: "Healthcare" },
  { canonical: "Care Coordination", category: "Healthcare", aliases: ["case management"] },
  { canonical: "Curriculum Development", category: "Education", aliases: ["curriculum design", "lesson planning"] },
  { canonical: "Classroom Management", category: "Education" },
  { canonical: "E-Learning", category: "Education", aliases: ["lms administration", "moodle", "canvas lms"] },

  // ── Soft skills ──
  { canonical: "Leadership", category: "Soft Skills", aliases: ["team leadership", "people management", "led a team", "mentoring"] },
  { canonical: "Communication", category: "Soft Skills", aliases: ["written communication", "verbal communication", "cross-functional collaboration", "collaboration"] },
  { canonical: "Problem Solving", category: "Soft Skills", aliases: ["analytical thinking", "critical thinking"] },
  { canonical: "Time Management", category: "Soft Skills" },
  { canonical: "Adaptability", category: "Soft Skills" },
];

/** alias/canonical (lowercased) → SkillDef */
const LOOKUP: Map<string, SkillDef> = (() => {
  const map = new Map<string, SkillDef>();
  for (const def of SKILL_TAXONOMY) {
    map.set(def.canonical.toLowerCase(), def);
    for (const alias of def.aliases ?? []) map.set(alias.toLowerCase(), def);
    // also register lowercase-with-space variants of canonical containing . or #
    if (/[.#]/.test(def.canonical)) {
      map.set(def.canonical.toLowerCase().replace(/[.#]/g, ""), def);
    }
  }
  return map;
})();

export function lookupSkill(text: string): SkillDef | undefined {
  return LOOKUP.get(text.trim().toLowerCase());
}

/** Normalize an arbitrary skill mention to its canonical name when known. */
export function canonicalSkillName(raw: string): string {
  const hit = LOOKUP.get(raw.trim().toLowerCase());
  return hit ? hit.canonical : raw.trim();
}

/**
 * Scan free text for every taxonomy skill present (canonical or alias,
 * word-boundary aware). Returns unique canonical names in order of appearance.
 */
export function extractKnownSkills(text: string): string[] {
  const found = new Set<string>();
  const lower = text.toLowerCase();
  // Sort keys longest-first so "machine learning" wins over bare "ml"-style overlaps.
  const keys = [...LOOKUP.keys()].sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (found.has(LOOKUP.get(key)!.canonical.toLowerCase())) continue;
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, "i");
    if (re.test(lower)) found.add(LOOKUP.get(key)!.canonical.toLowerCase());
  }
  return [...found];
}

export function skillCategory(name: string): string | undefined {
  return LOOKUP.get(name.toLowerCase())?.category;
}
