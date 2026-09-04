Security audit — initial scan

Problem

Perform a focused security audit for injection, auth bypass, secrets in code, and unsafe dependencies. The goal is to surface high-risk findings and propose fixes so reviewers can prioritize remediation.

Findings & recommendations

1. Dynamic code execution (new Function) in mock-server and handler execution
   - Files: packages\mock-server\src\utils\execute-seed.ts, packages\mock-server\src\utils\execute-handler.ts
   - Risk: executing untrusted code can enable remote code execution and data exfiltration.
   - Recommendation: run evaluated code in an isolated sandboxed process, replace with a safe interpreter, or enforce strict allowlists and input validation.

2. Test fixtures and placeholders with PEM headers
   - Examples: tests and UI placeholders referencing `-----BEGIN PRIVATE KEY-----` and x-scalar-secret-private-key.
   - Risk: low if placeholders only; ensure no real keys are committed.
   - Recommendation: maintain placeholders but add CI secret scanning to prevent accidental commits of real secrets.

3. child_process usage and shell exec patterns
   - Ensure any exec/spawn calls only operate on trusted inputs. Avoid shell interpolation and prefer array args.

4. No obvious committed cloud provider API keys (AWS/GCP) discovered by this scan.

Follow-ups

- Replace new Function usage with a safer model or sandbox.
- Add secret scanning to CI and pre-commit hooks.
- Add a security ownership doc and remediation plan for mock-server and any dynamic execution surfaces.

Notes

This is an initial automated/manual scan and report. Follow-up PRs should implement the recommended fixes and include tests/changesets where applicable.
