---
to: <%= blueprintRoot %>/<%= blueprintName %>/fluxes/<%= name %>/kustomization.yaml
---
namespace: <%= name %>
resources:
  - namespace.yaml
  - git-deploy-key.yaml
bases:
  - <%= h.getKustomizationPath(kustomizationRoot, '/bootstrap/flux') %>
patchesStrategicMerge:
  - flux-patch.yaml
