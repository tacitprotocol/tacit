# create-tacit-agent

Scaffold a new [Tacit Protocol](https://tacitprotocol.com) agent in one command.

## Usage

```bash
npx create-tacit-agent my-agent
cd my-agent
npm start
```

That's it. Your agent will:

1. Generate a cryptographic identity (W3C DID)
2. Publish an intent to the network
3. Listen for compatible matches
4. Broker introductions with double opt-in

## What You Get

```
my-agent/
  src/
    agent.ts      # Your agent — edit this to customize
  package.json
  tsconfig.json
  .gitignore
  README.md
```

## Customize

Edit `src/agent.ts` to set your agent's domain, intent, and preferences:

```typescript
const agent = await TacitAgent.create({
  domain: 'professional',  // or 'commerce', 'dating', 'local-services', 'learning'
  preferences: {
    languages: ['en'],
    introductionStyle: 'professional',
  },
});
```

## Links

- [Tacit Protocol](https://tacitprotocol.com)
- [SDK Docs](https://www.npmjs.com/package/@tacitprotocol/sdk)
- [GitHub](https://github.com/tacitprotocol/tacit)

## License

MIT
