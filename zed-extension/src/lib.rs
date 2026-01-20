use zed_extension_api::{self as zed, Result};

struct LangExtension {
    cached_binary_path: Option<String>,
}

impl zed::Extension for LangExtension {
    fn new() -> Self {
        Self {
            cached_binary_path: None,
        }
    }

    fn language_server_command(
        &mut self,
        language_server_id: &zed::LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<zed::Command> {
        let path = self.language_server_binary(language_server_id, worktree)?;
        Ok(zed::Command {
            command: "node".to_string(),
            args: vec![
                path,
                "--stdio".to_string(),
            ],
            env: Default::default(),
        })
    }
}

impl LangExtension {
    fn language_server_binary(
        &mut self,
        _language_server_id: &zed::LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<String> {
        if let Some(path) = &self.cached_binary_path {
            if std::fs::metadata(path).map(|m| m.is_file()).unwrap_or(false) {
                return Ok(path.clone());
            }
        }

        let local_server_path = "language-server.js";
        eprintln!("Lang: Checking for local server at {}", local_server_path);
        if std::fs::metadata(local_server_path).map(|m| m.is_file()).unwrap_or(false) {
            eprintln!("Lang: Found local server");
            return Ok(local_server_path.to_string());
        }

        eprintln!("Lang: Local server not found, downloading from GitHub");
        let release = zed::latest_github_release(
            "dmezhnov/lang",
            zed::GithubReleaseOptions {
                require_assets: true,
                pre_release: false,
            },
        )?;

        let asset = release
            .assets
            .iter()
            .find(|asset| asset.name.ends_with(".vsix"))
            .ok_or_else(|| "no vsix asset found")?;

        let version_dir = format!("lang-{}", release.version);
        let binary_path = format!("{version_dir}/extension/out/language/main.js");

        if !std::fs::metadata(&binary_path).map(|m| m.is_file()).unwrap_or(false) {
            zed::set_language_server_installation_status(
                _language_server_id,
                &zed::LanguageServerInstallationStatus::Downloading,
            );

            zed::download_file(
                &asset.download_url,
                &version_dir,
                zed::DownloadedFileType::Zip,
            )
            .map_err(|e| format!("failed to download file: {e}"))?;

            zed::make_file_executable(&binary_path)?;

            let entries = std::fs::read_dir(".").map_err(|e| format!("failed to list content: {e}"))?;
            for entry in entries {
                let entry = entry.map_err(|e| format!("failed to load entry: {e}"))?;
                let entry_path = entry.path();
                if entry_path.is_dir() && entry_path.file_name() != Some(std::ffi::OsStr::new(&version_dir)) {
                    std::fs::remove_dir_all(&entry_path).ok();
                }
            }
        }

        self.cached_binary_path = Some(binary_path.clone());
        Ok(binary_path)
    }
}

zed::register_extension!(LangExtension);
