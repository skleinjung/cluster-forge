---
to:  <%= bootstrapDir %>/README.md
---
# <%= name %> - Bootstrap
This directory contains the bootstrap kustomization for the `<%= name %>` blueprint, including:

- The SealedSecrets controller for managing encryption of secrets in git repositories
- The master Flux instance responsible for creating and updating all of the namespace-specific
  Fluxes for clusters running this blueprint.
