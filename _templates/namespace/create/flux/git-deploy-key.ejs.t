---
sh: "kubectl create secret generic git-deploy-key -n <%= name %> --dry-run=true -o yaml --from-file=identity=<%= privateKeyFile %> | kubeseal --format yaml > <%= blueprintRoot %>/<%= blueprintName %>/fluxes/<%= name %>/git-deploy-key.yaml"
---
