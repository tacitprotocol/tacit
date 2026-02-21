#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

// ─── Colors (no deps) ───────────────────────────────────────────

const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;

// ─── CLI ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const projectName = args[0];

if (!projectName || projectName === '--help' || projectName === '-h') {
  console.log(`
${bold('create-tacit-agent')} — scaffold a new Tacit Protocol agent

${bold('Usage:')}
  npx create-tacit-agent ${cyan('<project-name>')}

${bold('Example:')}
  npx create-tacit-agent my-agent
  cd my-agent
  npm start
`);
  process.exit(projectName ? 0 : 1);
}

// Validate project name
if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) {
  console.error(red(`Invalid project name: "${projectName}". Use only letters, numbers, hyphens, and underscores.`));
  process.exit(1);
}

const projectDir = resolve(process.cwd(), projectName);

if (existsSync(projectDir)) {
  console.error(red(`Directory "${projectName}" already exists.`));
  process.exit(1);
}

// ─── Banner ──────────────────────────────────────────────────────

console.log(`
${bold('Tacit Protocol')} ${dim('v0.1')}
${dim('The trust layer for the internet')}
`);

console.log(`Creating ${cyan(projectName)}...`);
console.log();

// ─── Scaffold ────────────────────────────────────────────────────

mkdirSync(join(projectDir, 'src'), { recursive: true });

// package.json
writeFileSync(
  join(projectDir, 'package.json'),
  JSON.stringify(
    {
      name: projectName,
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts: {
        start: 'npx tsx src/agent.ts',
        dev: 'npx tsx --watch src/agent.ts',
      },
      dependencies: {
        '@tacitprotocol/sdk': '^0.1.0',
      },
      devDependencies: {
        typescript: '^5.4.0',
        tsx: '^4.7.0',
        '@types/node': '^20.11.0',
      },
    },
    null,
    2
  ) + '\n'
);

// tsconfig.json
writeFileSync(
  join(projectDir, 'tsconfig.json'),
  JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        lib: ['ES2022', 'DOM'],
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        outDir: './dist',
        rootDir: './src',
      },
      include: ['src/**/*'],
    },
    null,
    2
  ) + '\n'
);

// Generate a placeholder agent seed (not real keys — just for demo)
const agentSeed = randomBytes(16).toString('hex');

// src/agent.ts — the main agent file
writeFileSync(
  join(projectDir, 'src', 'agent.ts'),
  `/**
 * ${projectName} — Tacit Protocol Agent
 *
 * Your AI agent that verifies identity, prevents fraud,
 * and brokers trusted introductions with cryptographic proof.
 */

import {
  TacitAgent,
  IntentBuilder,
  MatchScorer,
} from '@tacitprotocol/sdk';

async function main() {
  console.log('Initializing Tacit agent...');

  // Create your agent with a fresh cryptographic identity
  const agent = await TacitAgent.create({
    domain: 'professional',
    preferences: {
      languages: ['en'],
      introductionStyle: 'professional',
    },
  });

  console.log(\`Agent created: \${agent.did}\`);
  console.log(\`Authenticity score: \${agent.card.authenticity.score}/100\`);

  // Build and publish an intent
  const intent = new IntentBuilder(agent.did)
    .type('introduction')
    .domain('professional')
    .seeking({
      what: 'collaboration',
      skills: ['ai', 'distributed-systems'],
    })
    .context({
      offering: 'Your expertise here',
      urgency: 'moderate',
    })
    .minAuthenticity(50)
    .build();

  console.log(\`Intent published: \${intent.id}\`);

  // Listen for matches
  agent.on('match', async (event) => {
    console.log(\`Match found! Score: \${(event as any).match?.score?.overall}/100\`);
  });

  // Listen for introduction proposals
  agent.on('intro:proposed', async (event) => {
    console.log('Introduction proposed — review and approve in your agent dashboard');
  });

  console.log();
  console.log('Agent is running. Listening for matches...');
  console.log('Press Ctrl+C to stop.');

  // Connect to the relay network
  await agent.connect();
}

main().catch(console.error);
`
);

// .gitignore
writeFileSync(
  join(projectDir, '.gitignore'),
  `node_modules/
dist/
.env
*.local
`
);

// README
writeFileSync(
  join(projectDir, 'README.md'),
  `# ${projectName}

A [Tacit Protocol](https://tacitprotocol.com) agent — verify identity, prevent fraud, and broker trusted introductions.

## Getting Started

\`\`\`bash
npm install
npm start
\`\`\`

Your agent will:
1. Generate a cryptographic identity (W3C DID)
2. Publish an intent to the network
3. Listen for compatible matches
4. Broker introductions with double opt-in

## Customize

Edit \`src/agent.ts\` to configure your agent's domain, intent, and preferences.

## Learn More

- [Tacit Protocol Docs](https://github.com/tacitprotocol/tacit)
- [SDK Reference](https://www.npmjs.com/package/@tacitprotocol/sdk)
- [Protocol Spec](https://github.com/tacitprotocol/tacit/blob/main/docs/PROTOCOL_SPEC.md)
`
);

// ─── Install Dependencies ────────────────────────────────────────

console.log(`${dim('Installing dependencies...')}`);
console.log();

try {
  execSync('npm install', { cwd: projectDir, stdio: 'inherit' });
} catch {
  console.log();
  console.log(dim('npm install failed — you can run it manually:'));
  console.log(`  cd ${projectName} && npm install`);
}

// ─── Done ────────────────────────────────────────────────────────

console.log();
console.log(green('Done!') + ` Your Tacit agent is ready.`);
console.log();
console.log(`  ${bold('cd')} ${cyan(projectName)}`);
console.log(`  ${bold('npm start')}`);
console.log();
console.log(dim('Your agent will create a cryptographic identity and start listening for matches.'));
console.log(dim('Edit src/agent.ts to customize your intent and preferences.'));
console.log();
