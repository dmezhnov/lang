{
  description = "Dev environment for the Lang VS Code extension";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";

  outputs = { self, nixpkgs }:
    let
      supportedSystems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];

      forEachSystem = f:
        builtins.listToAttrs (map (system: {
          name = system;
          value = f system;
        }) supportedSystems);
    in {
      devShells = forEachSystem (system:
        let
          pkgs = import nixpkgs { inherit system; };
        in {
          default = pkgs.mkShell {
            packages = [

            ];

            shellHook = ''
              # Ensure TLS-aware tools (including Trunk hermetic downloads) see the system CA bundle.
              export SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt
              export NIX_SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt
              export CURL_CA_BUNDLE=/etc/ssl/certs/ca-bundle.crt
              export REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-bundle.crt

              # Activate mise so that bun, node and other tools are available
              eval "$(${pkgs.mise}/bin/mise activate bash)"
            '';
          };
        });
    };
}
