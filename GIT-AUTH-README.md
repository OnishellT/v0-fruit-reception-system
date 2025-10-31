# Git Authentication Helper

A comprehensive zsh script for managing Git authentication across multiple providers and accounts.

## Features

- 🔐 **Browser-based OAuth authentication** (secure, no manual token management)
- 🔄 **Easy account switching** (switch between personal/work accounts instantly)
- 🌍 **Multi-provider support** (GitHub, GitLab, Bitbucket)
- ⚡ **Quick project setup** (initialize repo + authenticate in one command)
- 📊 **Status checking** (see all authenticated accounts at a glance)
- 🎨 **Colorful, user-friendly output**

## Installation

### Option 1: Use the provided script

```bash
# Make executable and use directly
chmod +x git-auth-helper.zsh
./git-auth-helper.zsh help
```

### Option 2: Install dependencies first

```bash
# Run the setup script to install GitHub CLI
./setup-git-auth.sh

# Or manually install gh (GitHub CLI)
# macOS
brew install gh

# Ubuntu/Debian
sudo apt install gh

# Arch
sudo pacman -S github-cli

# Then use the helper
./git-auth-helper.zsh auth github
```

### Option 3: Add to your PATH (optional)

```bash
# Create symlink in /usr/local/bin (requires sudo)
sudo ln -sf $(pwd)/git-auth-helper.zsh /usr/local/bin/git-auth

# Add to your ~/.zshrc for permanent access
echo 'alias git-auth="$(pwd)/git-auth-helper.zsh"' >> ~/.zshrc
source ~/.zshrc
```

## Quick Start

### Authenticate with GitHub

```bash
./git-auth-helper.zsh auth github
```

This will:
- Open your browser
- Complete OAuth authentication
- Configure Git with your GitHub credentials
- Store authentication for future use

### Quick Setup for New Project

```bash
./git-auth-helper.zsh setup
```

This will:
- Initialize git repository (if not already)
- Authenticate with GitHub
- Configure project with credentials

### List All Accounts

```bash
./git-auth-helper.zsh list
```

### Switch GitHub Account

```bash
./git-auth-helper.zsh switch
```

## Commands Reference

| Command | Description | Example |
|---------|-------------|---------|
| `auth github [--force]` | Authenticate with GitHub via browser | `./git-auth-helper.zsh auth github` |
| `auth gitlab` | Authenticate with GitLab | `./git-auth-helper.zsh auth gitlab` |
| `auth` | Authenticate with all providers | `./git-auth-helper.zsh auth` |
| `list` | List all authenticated accounts | `./git-auth-helper.zsh list` |
| `switch` | Switch GitHub account | `./git-auth-helper.zsh switch` |
| `configure` | Configure current project | `./git-auth-helper.zsh configure` |
| `setup` | Quick setup: init + authenticate | `./git-auth-helper.zsh setup` |
| `add-remote [provider]` | Add remote repository | `./git-auth-helper.zsh add-remote github` |
| `check` | Check authentication status | `./git-auth-helper.zsh check` |
| `help` | Show help message | `./git-auth-helper.zsh help` |

## Usage Examples

### Example 1: First Time Setup

```bash
# Initialize project and authenticate
./git-auth-helper.zsh setup

# Add remote repository
./git-auth-helper.zsh add-remote github
# Enter: username/repo-name

# Commit and push
git add .
git commit -m "Initial commit"
git push -u origin main
```

### Example 2: Switching Between Accounts

```bash
# Check current status
./git-auth-helper.zsh check

# Switch to different GitHub account
./git-auth-helper.zsl switch

# Configure project with new account
./git-auth-helper.zsh configure
```

### Example 3: Working with Multiple Providers

```bash
# Authenticate with GitHub
./git-auth-helper.zsh auth github

# Authenticate with GitLab
./git-auth-helper.zsh auth gitlab

# List all accounts
./git-auth-helper.zsh list

# Add GitLab remote
./git-auth-helper.zsh add-remote gitlab
```

## Provider Setup

### GitHub

**Prerequisites**: GitHub CLI (`gh`)

The script uses GitHub's official CLI which handles OAuth automatically:
- Visits: `https://github.com/login/device`
- No personal access tokens needed
- Secure browser-based flow

**Install gh**:
- macOS: `brew install gh`
- Ubuntu/Debian: `sudo apt install gh`
- Arch: `sudo pacman -S github-cli`
- Windows: `winget install --id GitHub.cli`

### GitLab

**Prerequisites**: GitLab CLI (`glab`) - optional

**Install glab**:
- macOS: `brew install glab`
- Manual: Download from https://gitlab.com/gitlab-org/cli

Without glab, you can still use GitLab via HTTPS with personal access tokens from:
https://gitlab.com/profile/personal_access_tokens

### Bitbucket

The script supports Bitbucket via HTTPS URLs. For OAuth, you would need to:
1. Create app password: https://bitbucket.org/account/settings/app-passwords/
2. Use HTTPS URLs: `https://username:app-password@bitbucket.org/username/repo.git`

The `add-remote` command can help set this up.

## Troubleshooting

### "gh: command not found"

Install GitHub CLI:
```bash
./setup-git-auth.sh
# or
brew install gh  # macOS
sudo apt install gh  # Ubuntu/Debian
```

### Authentication fails

1. Ensure you're connected to the internet
2. Check if browser opens correctly
3. Try with `--force` flag: `./git-auth-helper.zsh auth github --force`
4. Clear gh credentials: `gh auth logout && ./git-auth-helper.zsh auth github`

### Wrong account detected

```bash
./git-auth-helper.zsh switch
```

### Git not configured

```bash
# Check current config
git config --list --global

# Configure manually
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Advanced Usage

### Custom Git Configuration

The script automatically configures git with your GitHub account info, but you can override:

```bash
# Set per-project config
git config user.name "Work Account"
git config user.email "work@company.com"

# Set global config
git config --global user.name "Personal Name"
git config --global user.email "personal@email.com"
```

### Multiple SSH Keys (Alternative to OAuth)

If you prefer SSH over HTTPS:

```bash
# Generate SSH key for work account
ssh-keygen -t ed25519 -C "work@company.com" -f ~/.ssh/id_ed25519_work

# Generate SSH key for personal account
ssh-keygen -t ed25519 -C "personal@email.com" -f ~/.ssh/id_ed25519_personal

# Add to ssh-agent
ssh-add ~/.ssh/id_ed25519_work
ssh-add ~/.ssh/id_ed25519_personal

# Configure SSH config
cat >> ~/.ssh/config << EOF
Host github-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_work
    IdentitiesOnly yes

Host github-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal
    IdentitiesOnly yes
EOF

# Use different remotes for different projects
git remote add origin git@github-personal:username/repo.git
```

## Security Notes

- OAuth tokens are stored securely by the GitHub CLI
- No passwords are stored in plain text
- Browser-based OAuth is more secure than personal access tokens
- Tokens can be revoked at any time from GitHub/GitLab settings
- The script itself doesn't store credentials, it just configures Git

## Project Files

- `git-auth-helper.zsh` - Main authentication script
- `setup-git-auth.sh` - Dependency installer
- `GIT-AUTH-README.md` - This documentation

## License

MIT License - Feel free to modify and distribute.

## Contributing

Feel free to submit issues and enhancement requests!

---

**Author**: GitHub Copilot + Claude Code

**Last Updated**: 2025-10-31
