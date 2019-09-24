---
sh: "kubectl create secret generic git-deploy-key -n <%= locals.namespace || 'flux-master' %> --dry-run=true -o yaml --from-file=identity=<%= privateKeyFile %> | kubeseal --format yaml > <%= blueprintRoot %>/<%= name %>/bootstrap/flux/git-deploy-key.yaml"
---
