# Git Authentication Alternatives

This document lists various approaches to Git authentication, from our custom helper to popular tools from GitHub and other sources.

## Our Custom Solution

**File**: `git-auth-helper.zsh`
- ✅ Browser-based OAuth
- ✅ Multi-provider support
- ✅ Easy account switching
- ✅ No external dependencies (beyond GitHub CLI)
- ❌ Zsh-specific (may not work in bash without modifications)

**Quick Start**:
```bash
./git-auth-helper.zsh auth github
```

---

## Official GitHub Tools

### 1. GitHub CLI (`gh`) - ⭐ Most Popular

**What it is**: Official GitHub CLI with built-in OAuth authentication.

**Installation**:
```bash
# macOS
brew install gh

# Ubuntu/Debian
sudo apt install gh

# Fedora
sudo dnf install gh

# Arch Linux
sudo pacman -S github-cli

# Windows (winget)
winget install --id GitHub.cli

# Windows (choco)
choco install gh
```

**Usage**:
```bash
# Authenticate (opens browser)
gh auth login

# Check status
gh auth status

# Login to specific account
gh auth login --with-token

# Logout
gh auth logout
```

**Pros**:
- ✅ Official GitHub tool
- ✅ Native browser OAuth
- ✅ Works on all platforms
- ✅ Built-in support for GitHub features (PRs, issues, etc.)

**Cons**:
- ❌ GitHub-specific (doesn't handle GitLab/Bitbucket)
- ❌ Limited account switching (need to logout/login)

---

### 2. Git Credential Manager (GCM) - ⭐ Secure & Cross-Platform

**What it is**: Microsoft's cross-platform Git credential helper with OAuth support.

**Installation**:

**Windows**:
```powershell
# Using winget
winget install Microsoft.GitCredentialManager

# Using choco
choco install git-credential-manager-core

# Using installer (download from releases)
# https://github.com/git-ecosystem/git-credential-manager/releases
```

**macOS**:
```bash
# Using Homebrew (recommended)
brew install --cask git-credential-manager

# Using installer (download from releases)
# https://github.com/git-ecosystem/git-credential-manager/releases
```

**Linux**:
```bash
# Ubuntu/Debian (22.04+)
sudo apt install git-credential-manager

# Fedora
sudo dnf install git-credential-manager

# Arch
yay -S git-credential-manager

# Manual installation
curl -L https://github.com/git-ecosystem/git-credential-manager/releases/latest/download/gcm-linux_amd64.tar.gz -o gcm.tar.gz
tar -xzf gcm.tar.gz
sudo mv gcm ./usr/local/bin/
```

**Configuration**:
```bash
# Configure Git to use GCM
git config --global credential.helper manager-core

# Or for Linux (deprecated but still works)
git config --global credential.helper manager

# Initialize (opens browser for OAuth)
git-credential-manager-core configure

# Check status
git-credential-manager-core --version
```

**Usage**:
```bash
# First time, configure (opens browser)
git-credential-manager-core configure

# Then normal git operations will trigger OAuth
git clone https://github.com/username/repo.git
# → Opens browser for authentication

# Check what accounts are configured
git-credential-manager-core configure
```

**Pros**:
- ✅ Official Git tool (by Git)
- ✅ Supports GitHub, GitLab, Bitbucket
- ✅ Cross-platform (Windows, macOS, Linux)
- ✅ Biometric authentication on supported platforms
- ✅ Multiple accounts supported
- ✅ Secure token storage

**Cons**:
- ❌ Slightly more complex setup on Linux
- ❌ .NET runtime required (on some platforms)

---

## GitLab Tools

### 3. GitLab CLI (`glab`) - ⭐ Official GitLab Tool

**What it is**: Official GitLab CLI with authentication support.

**Installation**:
```bash
# macOS
brew install glab

# Linux (using package manager)
# Visit: https://gitlab.com/gitlab-org/cli/-/releases for your distro

# Or use the installation script
curl -fsSL https://gitlab.com/gitlab-org/cli/-/raw/main/scripts/install.sh | bash

# Windows (winget)
winget install GitLab.gitlab-cli

# Windows (choco)
choco install glab
```

**Usage**:
```bash
# Authenticate
glab auth login

# Login with specific instance
glab auth login --gitlab-host=https://gitlab.com

# Check status
glab auth status
```

**Pros**:
- ✅ Official GitLab tool
- ✅ Works with self-hosted GitLab instances
- ✅ Supports GitLab features (MRs, issues, etc.)

**Cons**:
- ❌ GitLab-specific
- ❌ Newer project (smaller community)

---

## JavaScript/Node.js Solutions

### 4. `git-credential-helper` (npm)

**Installation**:
```bash
npm install -g git-credential-helper
```

**Usage**:
```bash
# Configure
git config --global credential.helper helper
```

---

## Python Solutions

### 5. `keyring` + Git Config

**What it is**: Use system keyring to store Git credentials securely.

**Installation**:
```bash
pip install keyring
```

**Configuration**:
```bash
# Set credential helper
git config --global credential.helper store

# Store password in keyring
python3 -c "
import keyring
keyring.set_password('git', 'https://github.com', 'your-token-here')
"
```

---

## Pure Bash/Zsh Solutions

### 6. SSH Key Management

**What it is**: Use SSH keys for authentication (no OAuth needed).

**Setup**:
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your@email.com"

# Add to ssh-agent
ssh-add ~/.ssh/id_ed25519

# Add public key to Git provider
# GitHub: https://github.com/settings/keys
# GitLab: https://gitlab.com/-/profile/keys
# Bitbucket: https://bitbucket.org/account/settings/ssh-keys/

# Clone using SSH
git clone git@github.com:username/repo.git
```

**Multiple SSH Keys** (for different accounts):
```bash
# Create SSH config file
cat > ~/.ssh/config << 'EOF'
# Personal GitHub
Host github-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal
    IdentitiesOnly yes

# Work GitHub
Host github-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_work
    IdentitiesOnly yes
EOF

# Use in different directories
# In work repos:
git remote set-url origin git@github-work:company/repo.git

# In personal repos:
git remote set-url origin git@github-personal:username/repo.git
```

**Pros**:
- ✅ No OAuth needed
- ✅ Very secure
- ✅ No browser required
- ✅ Works offline after initial setup

**Cons**:
- ❌ Manual key management
- ❌ SSH URL format (different from HTTPS)
- ❌ Less convenient for some workflows

---

## Desktop Applications

### 7. GitKraken

**What it is**: Popular Git GUI with built-in authentication management.

**Installation**: https://www.gitkraken.com/

**Features**:
- ✅ Visual Git interface
- ✅ Automatic OAuth for GitHub, GitLab, Bitbucket
- ✅ Multiple account management
- ✅ Conflict resolution tools

**Pros**:
- ✅ User-friendly GUI
- ✅ All providers supported
- ✅ Visual history and diffs

**Cons**:
- ❌ Proprietary software
- ❌ Paid for some features
- ❌ Resource heavy

---

### 8. GitHub Desktop

**What it is**: Official GitHub desktop application.

**Installation**: https://desktop.github.com/

**Pros**:
- ✅ Official GitHub tool
- ✅ Integrated with GitHub
- ✅ Easy to use

**Cons**:
- ❌ GitHub-only
- ❌ Desktop application

---

## Comparison Table

| Tool | Provider Support | OAuth | Account Switching | Platforms | Ease of Use |
|------|------------------|-------|-------------------|-----------|-------------|
| **Our Helper** | GitHub, GitLab, Bitbucket | ✅ Browser | ✅ Easy | Unix-like | ⭐⭐⭐⭐ |
| **GitHub CLI (`gh`)** | GitHub | ✅ Browser | ⚠️ Manual | All | ⭐⭐⭐⭐⭐ |
| **GCM** | GitHub, GitLab, Bitbucket | ✅ Browser | ✅ Automatic | All | ⭐⭐⭐⭐ |
| **GitLab CLI (`glab`)** | GitLab | ✅ Browser | ✅ Good | All | ⭐⭐⭐⭐ |
| **SSH Keys** | All | ❌ | ⚠️ Manual | All | ⭐⭐⭐ |
| **GitKraken** | All | ✅ Browser | ✅ Visual | All | ⭐⭐⭐⭐ |

---

## Recommendations

### For GitHub-Only Projects
**Use**: `gh` (GitHub CLI)
```bash
brew install gh
gh auth login
```

### For Multi-Provider (GitHub + GitLab + Bitbucket)
**Use**: Git Credential Manager (GCM)
```bash
# Install GCM (see installation above)
git config --global credential.helper manager-core
```

### For Zsh Users (Our Helper)
**Use**: Our custom script
```bash
./git-auth-helper.zsh setup
```

### For Visual Learners
**Use**: GitKraken or GitHub Desktop
```bash
# Download from website
open https://www.gitkraken.com/
```

### For SSH Preference
**Use**: SSH Keys + Multiple Configs
```bash
# See SSH section above
```

---

## Quick Comparison: OAuth vs SSH

### OAuth (HTTPS)
```
git clone https://github.com/user/repo.git
# → Opens browser
# → Login
# → Grant access
# → Clones repo
```

**Pros**:
- ✅ Same URL format for all users
- ✅ Can use with any Git client
- ✅ Easy to share
- ✅ No key management

**Cons**:
- ❌ Requires browser/OAuth flow
- ❌ May need re-authentication periodically
- ❌ Not ideal for automated scripts

### SSH
```
git clone git@github.com:user/repo.git
# → Uses SSH key
# → No browser needed
```

**Pros**:
- ✅ No authentication prompts
- ✅ Works in CI/CD
- ✅ More secure (keys can be hardware-backed)
- ✅ No expiration

**Cons**:
- ❌ Different URL format
- ❌ Key management required
- ❌ Firewall issues (port 22)
- ❌ Less convenient for multi-account

---

## Additional Resources

- **GitHub OAuth**: https://docs.github.com/en/developers/apps/building-oauth-apps
- **GitLab OAuth**: https://docs.gitlab.com/ee/api/oauth2.html
- **GCM Docs**: https://github.com/git-ecosystem/git-credential-manager/blob/main/docs/configuration.md
- **SSH Guide**: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

---

**Last Updated**: 2025-10-31
