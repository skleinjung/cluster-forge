---
inject: true
before: "patchesJson6902"
skip_if: "flux-git-deploy.yaml"
to: "<% if (locals.privateKeyFile) { %><%= bootstrapDir %>/flux/kustomization.yaml<% } else { %>null<% } %>"
---
resources:
  - flux-git-deploy.yaml