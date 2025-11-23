# Mise Flake

## PREINSTALL

```pseudocode
if (ENV_IS_MISE_INSTALED != true) then
    if (OS = nixos AND SHELL != flake) then
        run =   "
                    ENV_IS_MISE_INSTALED = true
                    nix develop -c  "
                                        SHELL = flake
                                        mise install
                                    "
                "
    else
        // Выполняем тут код, который сейчас выполняется в preinstall
    end
else
    // Выполняем тут код, который сейчас выполняется в preinstall
end
```

## POSTINSTALL

```pseudocode
if (ENV_IS_MISE_INSTALED != true) then
    // Выполняем тут код, который сейчас выполняется в postinstall
end

ENV_IS_MISE_INSTALED = true
```
