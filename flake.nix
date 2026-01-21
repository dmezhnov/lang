{
  description = "Dev environment for the Lang VS Code extension";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs =
    {
      self,
      nixpkgs,
      rust-overlay,
    }:
    let
      supportedSystems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];

      forEachSystem =
        f:
        builtins.listToAttrs (
          map (system: {
            name = system;
            value = f system;
          }) supportedSystems
        );
    in
    {
      devShells = forEachSystem (
        system:
        let
          overlays = [ (import rust-overlay) ];
          pkgs = import nixpkgs {
            inherit system overlays;
            config.allowUnfree = true;
          };

          # Declarative toolchain with WASM target
          rustToolchain = pkgs.rust-bin.stable."1.77.0".default.override {
            extensions = [
              "rust-src"
              "rust-std"
            ];
            targets = [ "wasm32-wasi" ];
          };
        in
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.trunk-io
              pkgs.libxcrypt
              rustToolchain
              pkgs.graphite-cli
            ];

            shellHook = ''
              # shell
              # Ensure TLS-aware tools (including Trunk hermetic downloads) see the system CA bundle.
              export SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt
              export NIX_SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt
              export CURL_CA_BUNDLE=/etc/ssl/certs/ca-bundle.crt
              export REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-bundle.crt

              # Make libcrypt.so.1 (from libxcrypt) available for hermetic Python tools used by Trunk.
              export LD_LIBRARY_PATH=${pkgs.libxcrypt}/lib:$LD_LIBRARY_PATH

              # Activate mise so that bun, node and other tools are available
              eval "$(${pkgs.mise}/bin/mise activate bash)"
            '';
          };
        }
      );
    };
}
