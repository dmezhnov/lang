{ config, pkgs, ... }:

let
  cursor = pkgs.appimageTools.wrapType2 {
    pname = "cursor";
    version = "2.1.19";

    src = ./pkgs/cursor.AppImage;

    extraPkgs =
      pkgs: with pkgs; [
        gtk3
        xorg.libxcb
        libxkbcommon
        nss
      ];
  };

  pythonAlias = pkgs.writeShellScriptBin "python" ''
    exec ${pkgs.python3}/bin/python3 "$@"
  '';

  unstablePkgs = import <nixpkgs-unstable> {
    system = pkgs.system;
    config = config.nixpkgs.config;
  };
in
{
  imports = [
    ./hardware-configuration.nix
  ];

  boot.loader = {
    systemd-boot.enable = true;
    efi.canTouchEfiVariables = true;
  };

  boot.extraModulePackages = with config.boot.kernelPackages; [
    amneziawg
  ];

  boot.kernelModules = [
    "amneziawg"
    "fuse"
  ];

  networking = {
    hostName = "nixos";
    networkmanager.enable = true;
    nameservers = [
      "8.8.8.8"
      "8.8.4.4"
    ];
  };

  time.timeZone = "Asia/Almaty";

  i18n = {
    defaultLocale = "en_US.UTF-8";
    extraLocaleSettings = {
      LC_ADDRESS = "kk_KZ.UTF-8";
      LC_IDENTIFICATION = "kk_KZ.UTF-8";
      LC_MEASUREMENT = "kk_KZ.UTF-8";
      LC_MONETARY = "kk_KZ.UTF-8";
      LC_NAME = "kk_KZ.UTF-8";
      LC_NUMERIC = "kk_KZ.UTF-8";
      LC_PAPER = "kk_KZ.UTF-8";
      LC_TELEPHONE = "kk_KZ.UTF-8";
      LC_TIME = "ru_RU.UTF-8";
    };
  };

  services.xserver.enable = true;
  services.displayManager.sddm.enable = true;
  services.desktopManager.plasma6.enable = true;

  services.xserver.xkb = {
    layout = "us,ru";
    variant = "";
    options = "grp:alt_shift_toggle";
  };

  services.printing.enable = true;
  services.pulseaudio.enable = false;

  security.rtkit.enable = true;
  services.pipewire = {
    enable = true;
    alsa.enable = true;
    alsa.support32Bit = true;
    pulse.enable = true;
  };

  virtualisation.docker = {
    enable = true;
    autoPrune = {
      enable = true;
      dates = "weekly";
      flags = [ "--all" ];
    };
  };

  users.users.dmezhnov = {
    isNormalUser = true;
    description = "dmezhnov";
    extraGroups = [
      "networkmanager"
      "wheel"
      "docker"
    ];
  };

  users.users.root = {
    isNormalUser = false;
    password = "";
  };

  nixpkgs.config.allowUnfree = true;

  environment.systemPackages =
    (with pkgs; [
      amneziawg-tools
      telegram-desktop
      google-chrome
      mise
      git
      neovim
      unstablePkgs.msedit
      pkgs.ghostty
      wine
      pkgs.starship
      gnupg
      python3
      gcc
      gnumake
      pkg-config
      pkgs.docker-compose
      pkgs.nixfmt-rfc-style
    ])
    ++ [
      cursor
      pythonAlias
    ];

  programs.bash = {
    interactiveShellInit = ''
      eval "$(${pkgs.mise}/bin/mise activate bash)"
    '';
  };

  programs.git = {
    enable = true;
    config = {
      user.name = "dmezhnov";
      user.email = "dmezhnov@greet-go.com";
    };
  };

  services.openssh = {
    enable = true;
    settings.PasswordAuthentication = false;
  };

  security.sudo.wheelNeedsPassword = false;

  systemd.services."awg-ch" = {
    description = "AmneziaWG VPN ch";
    wants = [ "network-online.target" ];
    after = [ "network-online.target" ];
    wantedBy = [ "multi-user.target" ];

    serviceConfig = {
      Type = "oneshot";
      RemainAfterExit = true;
      ExecStart = "${pkgs.amneziawg-tools}/bin/awg-quick up /etc/amnezia/ch.conf";
      ExecStop = "${pkgs.amneziawg-tools}/bin/awg-quick down /etc/amnezia/ch.conf";
    };
  };

  programs.nix-ld.enable = true;

  networking.firewall = {
    enable = true;

    extraCommands = ''
      # allow loopback
      iptables -A OUTPUT -o lo -j ACCEPT
      ip6tables -A OUTPUT -o lo -j ACCEPT

      # allow VPN tunnel interface
      iptables -A OUTPUT -o ch -j ACCEPT
      ip6tables -A OUTPUT -o ch -j ACCEPT

      # allow VPN handshake to Amnezia endpoint (update IP/port if they change)
      iptables -A OUTPUT -p udp -d 141.255.164.210 --dport 41621 -j ACCEPT

      # optional: allow access to local LAN (comment out if not needed)
      # iptables -A OUTPUT -d 192.168.0.0/16 -j ACCEPT
      # iptables -A OUTPUT -d 10.0.0.0/8 -j ACCEPT
      # iptables -A OUTPUT -d 172.16.0.0/12 -j ACCEPT

      # finally, drop everything else
      iptables -A OUTPUT -j DROP
      ip6tables -A OUTPUT -j DROP
    '';
  };

  system.stateVersion = "25.05";
}
