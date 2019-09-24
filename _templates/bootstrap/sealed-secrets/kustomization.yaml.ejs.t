---
to: <%= blueprintRoot %>/<%= name %>/bootstrap/sealed-secrets/kustomization.yaml
---
namespace: kube-system
bases:
  - <%= h.getKustomizationPath(kustomizationRoot, '/bootstrap/sealed-secrets') %>
