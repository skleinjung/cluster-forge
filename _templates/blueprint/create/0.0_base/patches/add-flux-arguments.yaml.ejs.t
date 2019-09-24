---
to: <%= bootstrapDir %>/patches/add-flux-arguments.yaml
---
- op: add
  path: /spec/template/spec/containers/0/args/-
  value: --git-url=<%= gitUrl %>
- op: add
  path: /spec/template/spec/containers/0/args/-
  value: --git-branch=<%= gitBranch %>
- op: add
  path: /spec/template/spec/containers/0/args/-
  value: --git-path=<%= h.getGitPath([blueprintRoot, name, 'fluxes'].join('/')) %>
- op: add
  path: /spec/template/spec/containers/0/args/-
  value: --git-poll-interval=<%= locals.syncInterval || '5m' %>
- op: add
  path: /spec/template/spec/containers/0/args/-
  value: --sync-interval=<%= locals.syncInterval || '5m' %>
- op: add
  path: /spec/template/spec/containers/0/args/-
  value: --registry-poll-interval=<%= locals.syncInterval || '5m' %>