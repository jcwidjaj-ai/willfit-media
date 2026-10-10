#!/bin/zsh
set -e
willfit_root="${0:A:h}"
willfit_node="/Users/josephinewidjaja/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
if [[ ! -x "$willfit_node" ]]; then
  willfit_node="$(command -v node || true)"
fi
if [[ -z "$willfit_node" || ! -x "$willfit_node" ]]; then
  print 'Please install Node.js 24 from https://nodejs.org, then open this file again.'
  read '?Press Enter to close.'
  exit 1
fi
cd "$willfit_root"
"$willfit_node" scripts/start-preview.mjs
open 'http://127.0.0.1:4173/'
