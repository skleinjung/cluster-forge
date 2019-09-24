---
to: <%= blueprintRoot %>/<%= blueprintName %>/fluxes/<%= name %>/namespace.yaml
---
apiVersion: v1
kind: Namespace
metadata:
  name: <%= name %>
