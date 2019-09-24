---
to: <%= blueprintRoot %>/<%= blueprintName %>/fluxes/<%= name %>/flux-patch.yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flux-<%= name %>
spec:
  selector:
    matchLabels:
      app: flux-<%= name %>
  template:
    metadata:
      labels:
        app: flux-<%= name %>
    spec:
      containers:
        - name: flux
          args:
            - --memcached-hostname=flux-memcached.<%= locals.fluxMasterNamespace || 'flux-master' %>
            - --memcached-service=
            - --git-url=<%= gitUrl %>
            - --git-branch=<%= gitBranch %>
            - --git-path=<%= h.getGitPath([blueprintRoot, blueprintName, 'workloads', name].join('/')) %>
            - --git-poll-interval=1m
            - --sync-interval=1m
            - --registry-poll-interval=1m
            - --registry-rps=200
            - --registry-burst=125
            - --registry-trace=false