{ pkgs ? import <nixpkgs> { } }:
with pkgs;
mkShell { buildInputs = [ nodejs-slim-14_x yarn ]; }
