#!/bin/bash

# Git Auth Helper Setup Script
# Installs GitHub CLI (gh) and GitLab CLI (glab)

set -e

echo "🔧 Setting up Git Authentication Helper..."
echo

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
else
    echo "⚠️  Unsupported operating system: $OSTYPE"
    exit 1
fi

# Install GitHub CLI (gh)
if ! command -v gh >/dev/null 2>&1; then
    echo "📦 Installing GitHub CLI (gh)..."

    if [[ "$OS" == "macos" ]]; then
        if command -v brew >/dev/null 2>&1; then
            brew install gh
        else
            echo "⚠️  Homebrew not found. Please install GitHub CLI manually:"
            echo "    Visit: https://cli.github.com/"
            echo "    Or install Homebrew first: https://brew.sh/"
        fi
    elif [[ "$OS" == "linux" ]]; then
        if command -v apt >/dev/null 2>&1; then
            # Ubuntu/Debian
            sudo apt update
            sudo apt install -y gh
        elif command -v dnf >/dev/null 2>&1; then
            # Fedora
            sudo dnf install -y gh
        elif command -v pacman >/dev/null 2>&1; then
            # Arch Linux
            sudo pacman -S --noconfirm github-cli
        elif command -v zypper >/dev/null 2>&1; then
            # openSUSE
            sudo zypper install -y gh
        else
            echo "⚠️  Unsupported package manager. Please install GitHub CLI manually:"
            echo "    Visit: https://cli.github.com/"
        fi
    fi
else
    echo "✅ GitHub CLI (gh) already installed"
fi

# Install GitLab CLI (glab) - optional
if ! command -v glab >/dev/null 2>&1; then
    echo
    read -p "📦 Install GitLab CLI (glab)? (y/N): " install_glab
    if [[ $install_glab =~ ^[Yy]$ ]]; then
        echo "📦 Installing GitLab CLI (glab)..."

        if [[ "$OS" == "macos" ]]; then
            if command -v brew >/dev/null 2>&1; then
                brew install glab
            else
                echo "Please install manually: https://gitlab.com/gitlab-org/cli"
            fi
        elif [[ "$OS" == "linux" ]]; then
            # Download latest release
            LATEST_VERSION=$(curl -s https://api.github.com/repos/profclems/glab/releases/latest | grep -o '"tag_name": "v[^"]*' | cut -d'"' -f4)
            curl -L "https://github.com/profclems/glab/releases/download/${LATEST_VERSION}/glab_${LATEST_VERSION}_Linux_x86_64.tar.gz" -o /tmp/glab.tar.gz
            tar -xzf /tmp/glab.tar.gz -C /tmp
            sudo mv /tmp/bin/glab /usr/local/bin/
            rm -rf /tmp/glab.tar.gz /tmp/bin
        fi
    fi
else
    echo "✅ GitLab CLI (glab) already installed"
fi

echo
echo "✨ Setup complete!"
echo
echo "📖 Usage:"
echo "  ./git-auth-helper.zsh auth github    # Authenticate with GitHub"
echo "  ./git-auth-helper.zsh setup          # Quick setup for new project"
echo "  ./git-auth-helper.zsh list           # List authenticated accounts"
echo "  ./git-auth-helper.zsh help           # Show all commands"
echo
echo "🔐 Authentication:"
echo "  • Browser-based OAuth (secure, no tokens to manage)"
echo "  • Supports multiple accounts"
echo "  • Easy account switching"
