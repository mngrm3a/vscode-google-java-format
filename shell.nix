{ pkgs ? import <nixpkgs> {} }:
with (pkgs);
let
  nixPackages = [ rnix-lsp nixpkgs-fmt ];
  jsPackages = with nodePackages; [ nodejs-slim-14_x yarn eslint ];
in
mkShell {
  buildInputs = nixPackages ++ jsPackages;
  shellHook = ''
    export PATH="$PWD/node_modules/.bin/:$PATH"
  '';
}
