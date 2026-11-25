# Renovate Azure DevOps account migration reproduction

Run `node --test repro.test.mjs` with Node.js 22 or later. No dependencies, accounts, or network access are required.

## Current behavior

An active dependency PR belongs to `old-bot`. After migration to `new-bot`, author-filtered discovery misses the PR. The mock Azure service rejects creation of another active PR for the same source and target with `TF401179`.

## Expected behavior

With the legacy author explicitly allowlisted, a single exact active branch-pair lookup after the normal lookup misses finds the existing PR. A different target or a non-allowlisted author must not be adopted. Without opt-in, discovery stays author-filtered.

This is a synthetic, in-memory model, not an integration test or an Azure DevOps repository. It does not import Renovate or exercise Azure permissions, branch mutation, or automerge. Microsoft has stopped allowing new public Azure DevOps projects; see [the public project retirement notice](https://learn.microsoft.com/en-us/azure/devops/organizations/projects/public-projects-retirement?view=azure-devops).
