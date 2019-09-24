---
sh: >-
  <% if (locals.privateKeyFile) { %>
    kubectl create secret generic flux-git-deploy
      -n bootstrap
      --dry-run=true
      -o yaml
      --from-file=identity=<%= locals.privateKeyFile %>
      | kubeseal
        --controller-namespace bootstrap
        --format yaml
      > <%= bootstrapRoot %>/flux/flux-git-deploy.yaml
  <% } %>
---
