---
to: <%= bootstrapDir %>/kustomization.yaml
---
namespace: bootstrap
resources:
  - namespace.yaml
bases:
  - <%= h.getKustomizationPath(kustomizationRoot, '/bootstrap') %>
patchesJson6902:
  - target:
      group: apps
      version: v1
      kind: Deployment
      namespace: bootstrap
      name: flux
    path: patches/add-flux-arguments.yaml