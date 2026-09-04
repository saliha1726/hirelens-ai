/**
 * Demo data seeding.
 *
 * Sample resumes & job descriptions are run through the REAL parsing +
 * scoring pipeline, so demo numbers are always consistent with what a real
 * upload would produce. No AI calls here — insights appear only for live
 * screenings when MIMO_API_KEY is configured.
 */
import type { Candidate, JobRequirements, WorkspaceData } from "@/lib/types";
import { parseResume } from "@/lib/parsing/resume-parser";
import { parseJobDescription } from "@/lib/parsing/jd-parser";
import { computeMatch } from "@/lib/scoring/engine";

export const SAMPLE_JOBS_RAW = [
  {
    title: "Senior Frontend Engineer",
    text: `Senior Frontend Engineer at Northwind Commerce

Northwind Commerce builds e-commerce storefront tooling used by 4,000+ online retailers.

Responsibilities
- Own the design system and component library powering our merchant dashboard
- Ship performant, accessible React interfaces with measurable Core Web Vitals
- Partner with product and design on discovery, prototyping and rollout
- Mentor engineers through code review and pairing

Requirements
- 5+ years of professional frontend experience
- Deep expertise in React and TypeScript in production SaaS environments
- Strong CSS fundamentals; Tailwind CSS experience preferred
- Experience with testing practices: unit and end-to-end automated testing
- Bachelor's degree in Computer Science or related field

Nice to have
- Next.js experience in a high-traffic product
- GraphQL and REST API integration background
- Familiarity with accessibility standards (WCAG)
- Prior e-commerce or marketplace domain experience`,
  },
  {
    title: "Data Scientist",
    text: `Data Scientist - Growth Team at Helios Analytics

Helios helps subscription businesses forecast churn and lifetime value.

What you will do
- Build and productionize machine learning models for churn prediction
- Design A/B testing frameworks and analyze experiment results
- Partner with engineering to ship models behind REST APIs

Minimum qualifications
- 3+ years of hands-on data science experience
- Expert-level Python including pandas and scikit-learn
- Solid statistics foundation and SQL fluency
- Master's degree in Statistics, Computer Science, or a quantitative field
- Experience communicating results to non-technical stakeholders

Preferred qualifications
- Deep learning exposure with PyTorch or TensorFlow
- Experience with Tableau or Power BI dashboards
- AWS cloud experience (SageMaker a plus)`,
  },
  {
    title: "DevOps Engineer",
    text: `DevOps Engineer at Vector Cloud Services

We run mission-critical Kubernetes infrastructure for fintech customers.

The role
- Build and maintain CI/CD pipelines across 40+ microservices
- Manage Terraform-managed infrastructure on AWS
- Own observability: Prometheus, Grafana, alerting strategy
- Participate in an on-call rotation and drive incident reviews

Required qualifications
- 4+ years in DevOps/SRE roles
- Strong Kubernetes and Docker experience in production
- Infrastructure as Code with Terraform
- Scripting proficiency in Bash and Python
- Linux systems administration depth

Bonus points
- Certified Kubernetes Administrator (CKA)
- AWS Certified Solutions Architect
- Kafka operational experience
- Compliance experience (SOC 2)`,
  },
];

const SAMPLE_RESUMES_RAW = [
  {
    fileName: "amara_okafor_resume.txt",
    text: `Amara Okafor
amara.okafor@example.com | +1 (415) 555-0192 | San Francisco, CA

Professional Summary
Frontend engineer with 7 years building customer-facing SaaS products, specialized in React, TypeScript, and design systems at scale.

Technical Skills
React, TypeScript, JavaScript, Redux, Tailwind CSS, Next.js, GraphQL, Jest, Cypress, Storybook, Figma, HTML, CSS, Node.js, Webpack

Work Experience

Senior Frontend Engineer at Brightcart
Mar 2021 - Present
- Led the rebuild of the merchant analytics dashboard used by 12,000 stores, cutting load time by 46%
- Created a 60-component design system in React and Tailwind CSS adopted across 5 teams
- Introduced end-to-end automated testing with Cypress, reducing regression bugs by 35%
- Mentored 4 mid-level engineers through weekly pairing sessions

Frontend Engineer at Loopwork SaaS
Jun 2018 - Feb 2021
- Shipped GraphQL-powered customer portal features for a B2B SaaS platform with 200k users
- Migrated legacy jQuery codebase to modern React with Redux state management
- Improved Lighthouse performance scores from 54 to 92

Junior Web Developer at Pixel Forge Studio
Jul 2016 - May 2018
- Built responsive marketing sites and internal tools with JavaScript and CSS

Education
B.S. in Computer Science from University of California, Davis - 2016

Certifications
AWS Certified Cloud Practitioner - 2022`,
  },
  {
    fileName: "diego_ramirez_cv.txt",
    text: `Diego Ramirez
diego.ramirez@example.com | Austin, TX

Summary
Full-stack developer with 4 years of experience shipping web applications for startups.

Skills
JavaScript, TypeScript, React, Node.js, Express.js, PostgreSQL, MongoDB, HTML, CSS, Git, Agile, REST APIs

Experience

Full Stack Developer at MarketPulse Ecommerce
Jan 2022 - Present
- Built storefront features with React and Node.js serving 30k daily shoppers
- Designed PostgreSQL schemas and REST APIs for order management
- Automated deployments with GitHub Actions CI/CD

Software Developer at TechNova Labs
Aug 2020 - Dec 2021
- Developed internal admin tools in React reducing ops workload by 20%
- Wrote unit tests covering checkout flows

Education
B.A. in Information Systems from Texas State University - 2020`,
  },
  {
    fileName: "priya_sharma_resume.txt",
    text: `Priya Sharma
priya.sharma@example.com | +1 (206) 555-0147 | Seattle, WA

Profile
Data scientist with 6 years of experience turning messy data into products. Focused on churn modeling, experimentation, and ML systems.

Skills
Python, pandas, scikit-learn, PyTorch, SQL, Statistics, A/B Testing, Machine Learning, Data Visualization, Tableau, Airflow, AWS, NLP

Work Experience

Senior Data Scientist at Streamlyne Media
Feb 2021 - Present
- Built churn-prediction models (scikit-learn gradient boosting) saving $2.1M annual revenue
- Redesigned the A/B testing framework; now powers 40+ concurrent experiments
- Productionized models behind REST APIs with the platform team (Flask, Docker)

Data Scientist at Corvus Retail Analytics
Jul 2018 - Jan 2021
- Developed customer segmentation and LTV models using Python and SQL
- Built Tableau dashboards used weekly by merchandising leadership

Data Analyst at Corvus Retail Analytics
May 2017 - Jun 2018
- Owned reporting pipelines in SQL and Excel

Education
M.S. in Statistics from University of Washington - 2017
B.S. in Mathematics from University of Pune - 2015`,
  },
  {
    fileName: "tom_brennan_devops.txt",
    text: `Tom Brennan
tombrennan@example.com | Denver, CO | github.com/tbrennan-dev

Summary
DevOps engineer with 8 years running Kubernetes platforms for regulated industries.

Technical Skills
Kubernetes, Docker, Terraform, AWS, CI/CD, Jenkins, GitLab CI, Prometheus, Grafana, Python, Bash, Linux, Kafka, Ansible, Helm

Experience

Staff DevOps Engineer at PayGuard Fintech
Apr 2020 - Present
- Operate multi-region Kubernetes (EKS) platform under SOC 2 compliance for payment processing workloads
- Cut average deploy time from 40 min to 6 min by rearchitecting Jenkins pipelines into GitLab CI
- Codified all infrastructure with Terraform modules; audit findings down 80%

DevOps Engineer at Nimbus Hosting
Sep 2016 - Mar 2020
- Managed Docker fleets and Prometheus/Grafana observability for 200+ services
- Built self-service CI/CD templates used by 15 product teams
- On-call lead; drove MTTR from 90 to 25 minutes

Systems Administrator at Rocky Mountain ISP
Jun 2015 - Aug 2016
- Linux server administration and network operations

Certifications
Certified Kubernetes Administrator (CKA) - 2021
AWS Certified Solutions Architect - Associate - 2020
HashiCorp Certified Terraform Associate - 2022

Education
B.S. in Information Technology from Colorado State University - 2015`,
  },
  {
    fileName: "lena_kowalski_frontend.txt",
    text: `Lena Kowalski
lena.kowalski@example.com | Chicago, IL

Objective
Frontend developer eager to grow in a product-focused team.

Skills
HTML, CSS, JavaScript, React, Bootstrap, Figma, Communication, Problem Solving

Experience

Web Developer Intern at CivicWorks Nonprofit
Jun 2024 - Dec 2024
- Rebuilt donation pages in React improving conversion by 9%
- Assisted with accessibility audits

Freelance Web Developer
Jan 2023 - May 2024
- Delivered 10+ small business websites with WordPress and custom JavaScript

Education
B.A. in Graphic Design from DePaul University - 2023`,
  },
  {
    fileName: "marcus_lee_ds.txt",
    text: `Marcus Lee
marcus.lee@example.com | New York, NY

Summary
Analytics engineer moving into data science; 3 years of experience with experimentation and BI.

Skills
SQL, Python, Excel, Power BI, Data Analysis, Data Warehousing, Snowflake, dbt, Statistics

Experience

Analytics Engineer at Beacon Insurance
Oct 2022 - Present
- Built dbt models over claims data in Snowflake powering company-wide Power BI dashboards
- Supported pricing experiments with statistical analysis

Business Intelligence Analyst at Beacon Insurance
Jul 2021 - Sep 2022
- Automated executive reporting in SQL and Excel, saving 15 analyst-hours weekly

Education
B.S. in Economics from Baruch College - 2021

Certifications
Microsoft Certified Power BI Data Analyst - 2023`,
  },
  {
    fileName: "sofia_martinez_fullstack.txt",
    text: `Sofia Martinez
sofia.martinez@example.com | Barcelona, Spain

Senior Summary
Product-minded full-stack engineer with 9 years across e-commerce and SaaS. Comfortable owning features end-to-end from Postgres schema to pixel.

Skills
TypeScript, React, Next.js, Node.js, NestJS, GraphQL, PostgreSQL, Redis, Docker, Kubernetes, AWS, Automated Testing, Jest, Playwright, Tailwind CSS, Leadership, Agile

Experience

Lead Frontend Engineer at ShopSphere Marketplace
Jan 2020 - Present
- Lead a squad of 6 engineers on checkout and payments UX for a top-5 European marketplace
- Architected a Next.js storefront handling 2M monthly sessions; Core Web Vitals all green
- Drove adoption of typed GraphQL contracts between web and platform teams

Senior Full-Stack Engineer at BookItNow SaaS
Mar 2016 - Dec 2019
- Built booking engine features with Node.js, NestJS, PostgreSQL and Redis caching
- Introduced Playwright end-to-end automated testing across critical flows

Software Engineer at Digitalis Agency
Sep 2014 - Feb 2016
- Delivered client web apps in JavaScript and Angular

Education
M.Sc. in Software Engineering from Universitat Politecnica de Catalunya - 2014

Certifications
Certified ScrumMaster - 2018`,
  },
  {
    fileName: "james_okoye_data.txt",
    text: `James Okoye
james.okoye@example.com | Toronto, Canada

Career Summary
Machine learning engineer with 5 years deploying deep learning systems in healthcare settings.

Skills
Python, TensorFlow, PyTorch, Deep Learning, Computer Vision, NLP, Pandas, SQL, Docker, AWS, Flask, Healthcare

Experience

ML Engineer at MedScan AI
May 2021 - Present
- Deployed computer-vision triage models processing 50k medical images monthly
- Built HIPAA-compliant inference pipeline with Docker and AWS (SageMaker)

Junior ML Engineer at Northline Health Tech
Jun 2019 - Apr 2021
- Trained NLP models for clinical-note classification with TensorFlow
- Co-authored two peer-reviewed papers on clinical prediction

Data Intern at Toronto General Research Institute
May 2018 - Aug 2018
- Supported clinical research data cleaning in Python

Education
Ph.D. in Biomedical Engineering from University of Toronto - 2019
B.Sc. in Electrical Engineering from University of Lagos - 2013`,
  },
];

export function buildDemoWorkspace(): WorkspaceData {
  const jobs: JobRequirements[] = SAMPLE_JOBS_RAW.map((j) => ({
    ...parseJobDescription(j.text),
    title: j.title,
  }));

  const candidates: Candidate[] = [];
  const baseTime = Date.now() - 1000 * 60 * 60 * 26;

  SAMPLE_RESUMES_RAW.forEach((r, ri) => {
    const resumeText = r.text;
    const parsed = parseResume(resumeText);
    const screenings = jobs.slice(0, 3).map((job, ji) => ({
      id: `demo-s-${ri}-${ji}`,
      jobId: job.id,
      jobTitle: job.title,
      match: computeMatch(parsed, job, resumeText),
      createdAt: new Date(baseTime + ri * 36e5 + ji * 6e5).toISOString(),
    }));
    candidates.push({
      id: `demo-c-${ri}`,
      fileName: r.fileName,
      resume: parsed,
      screenings,
      notes:
        ri === 0
          ? [
              {
                id: `demo-n-${ri}`,
                text: "Strong portfolio walkthrough in screening call. Check availability for onsite.",
                createdAt: new Date(baseTime + ri * 36e5).toISOString(),
              },
            ]
          : [],
      status: ri === 0 ? "shortlisted" : ri === 3 ? "interview" : "new",
      createdAt: new Date(baseTime + ri * 36e5).toISOString(),
    });
  });

  return {
    version: 1,
    jobs,
    candidates,
    activity: candidates.map((c, i) => ({
      id: `demo-a-${i}`,
      kind: "screen" as const,
      message: `Screened ${c.fileName} against "${SAMPLE_JOBS_RAW[i % 3].title}" (demo seed)`,
      at: c.createdAt,
    })),
  };
}
