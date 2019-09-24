---
inject: true
to: <%= blueprintRoot %>/<%= name %>/bootstrap/kustomization.yaml
after: "  - sealed-secrets/"
skip_if: "  - flux/"
---
  - flux/