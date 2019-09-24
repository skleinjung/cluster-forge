---
to: <%= blueprintRoot %>/<%= name %>/bootstrap/flux/kustomization.yaml
---
namespace: <%= locals.namespace || 'flux-master' %>
resources:
  - namespace.yaml
  - git-deploy-key.yaml
bases:
  - <%= h.getKustomizationPath(kustomizationRoot, '/bootstrap/flux') %>
patchesStrategicMerge:
  - flux-patch.yaml
