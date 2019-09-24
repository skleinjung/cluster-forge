---
to: <%= blueprintRoot %>/<%= name %>/bootstrap/flux/namespace.yaml
---
apiVersion: v1
kind: Namespace
metadata:
  name: <%= locals.namespace || 'flux-master' %>
  annotations:
    linkerd.io/inject: disabled
  labels:
    istio-injection: disabled
    appmesh.k8s.aws/sidecarInjectorWebhook: disabled
