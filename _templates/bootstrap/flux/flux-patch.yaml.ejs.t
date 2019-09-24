---
to: <%= blueprintRoot %>/<%= name %>/bootstrap/flux/flux-patch.yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flux
spec:
  template:
    spec:
      containers:
        - name: flux
          args:
            - --memcached-hostname=flux-memcached.<%= locals.namespace || 'flux-master' %>
            - --memcached-service=
            - --git-url=<%= gitUrl %>
            - --git-branch=<%= gitBranch %>
            - --git-path=<%= h.getGitPath([blueprintRoot, name, 'fluxes'].join('/')) %>
            - --git-poll-interval=1m
            - --sync-interval=1m
            - --registry-poll-interval=1m
            - --registry-rps=200
            - --registry-burst=125
            - --registry-trace=false