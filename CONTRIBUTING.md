# Contributing to Tacit Protocol

Thank you for your interest in contributing to the Tacit Protocol. This is an early-stage project and every contribution has outsized impact.

## How to Contribute

### Protocol Feedback

The most valuable contributions right now are protocol design reviews. Read the [Protocol Spec](docs/PROTOCOL_SPEC.md) and open issues for:

- Design flaws or edge cases
- Security concerns
- Suggestions for improvement
- Missing features or primitives

### Code Contributions

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Write tests for new functionality
5. Run the test suite (`npm test` in `packages/sdk-ts/`)
6. Submit a pull request

### What We Need Most

| Area | Priority | Description |
|------|----------|-------------|
| **Protocol review** | Critical | Feedback on the v0.1 spec |
| **TypeScript SDK** | High | Implement transport layer (DIDComm v2) |
| **Relay node** | High | Build a basic relay node implementation |
| **Python SDK** | Medium | Port the TypeScript SDK to Python |
| **Examples** | Medium | Build example apps on different verticals |
| **Documentation** | Medium | Improve docs, add tutorials |
| **DID integration** | Medium | Implement additional DID methods |
| **Security audit** | High | Review the security model and crypto |

### Code Style

- TypeScript for all JavaScript/TypeScript code
- Strict mode enabled
- Meaningful variable and function names
- Comments for non-obvious logic only
- No unnecessary abstractions

### Commit Messages

Use conventional commits:

```
feat: add intent broadcasting to relay transport
fix: correct authenticity score decay calculation
docs: add quick-start tutorial
test: add match scorer edge case tests
```

## Tacit Enhancement Proposals (TEPs)

For significant protocol changes, submit a Tacit Enhancement Proposal:

1. Open an issue with the `tep` label
2. Title: `TEP-NNN: Short description`
3. Include: motivation, specification, backwards compatibility, security considerations

## Code of Conduct

Be respectful. Be constructive. We're building something that connects people — let's start by being good to each other.

## Questions?

Open an issue or join our Discord.
