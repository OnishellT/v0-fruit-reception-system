#!/usr/bin/env zsh

# Git Authentication Helper Script
# Supports GitHub, GitLab, and Bitbucket with browser-based OAuth
# Allows easy account switching and management

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration directory
CONFIG_DIR="$HOME/.git-auth-helper"
mkdir -p "$CONFIG_DIR"

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install required tools if not present
install_dependencies() {
    print_info "Checking dependencies..."

    # GitHub CLI
    if ! command_exists gh; then
        print_warning "GitHub CLI (gh) not found"
        echo "Please install it:"
        echo "  - macOS: brew install gh"
        echo "  - Ubuntu/Debian: sudo apt install gh"
        echo "  - Arch: sudo pacman -S github-cli"
        echo "  - Or download from: https://cli.github.com/"
        return 1
    fi

    # GitLab CLI (optional)
    if ! command_exists glab && [[ "$1" == "--with-glab" ]]; then
        print_warning "GitLab CLI (glab) not found"
        echo "Install from: https://gitlab.com/gitlab-org/cli"
    fi

    # Git
    if ! command_exists git; then
        print_error "Git is required but not installed"
        return 1
    fi

    print_success "All dependencies satisfied"
    return 0
}

# Authenticate with GitHub
auth_github() {
    print_info "Authenticating with GitHub..."

    # Check if already authenticated
    if gh auth status &>/dev/null; then
        local current_user
        current_user=$(gh api user --jq .login 2>/dev/null)
        print_info "Currently authenticated as: $current_user"

        if [[ "$1" != "--force" ]]; then
            read -q "reauth?Already authenticated. Re-authenticate? (y/N): "
            echo
            if [[ $reauth != "y" && $reauth != "Y" ]]; then
                return 0
            fi
        fi
    fi

    # Authenticate with GitHub via browser
    gh auth login --with-token

    if [[ $? -eq 0 ]]; then
        print_success "GitHub authentication successful"

        # Store auth info
        local username
        username=$(gh api user --jq .login 2>/dev/null)
        echo "$username" > "$CONFIG_DIR/github.current"

        # Configure git
        local email
        email=$(gh api user --jq .email 2>/dev/null)
        if [[ -n "$email" ]]; then
            git config --global user.email "$email"
        fi
        git config --global user.name "$username"

        print_success "Git configured for user: $username"
    else
        print_error "GitHub authentication failed"
        return 1
    fi
}

# Authenticate with GitLab
auth_gitlab() {
    print_info "Authenticating with GitLab..."

    if command_exists glab; then
        glab auth login --with-token

        if [[ $? -eq 0 ]]; then
            print_success "GitLab authentication successful"
        else
            print_error "GitLab authentication failed"
            return 1
        fi
    else
        print_warning "GitLab CLI (glab) not installed"
        echo "You can still use GitLab via HTTPS with personal access tokens"
        echo "Visit: https://gitlab.com/profile/personal_access_tokens"
    fi
}

# List all authenticated accounts
list_accounts() {
    echo -e "\n${CYAN}=== Authenticated Accounts ===${NC}\n"

    # GitHub accounts
    if command_exists gh && gh auth status &>/dev/null; then
        echo -e "${BLUE}GitHub:${NC}"
        local gh_status
        gh_status=$(gh auth status 2>/dev/null | grep -E "^\s*.*@.*\s*\(current\)" || gh auth status)
        echo "$gh_status" | sed 's/^/  /'
    fi

    # GitLab accounts (if glab is installed)
    if command_exists glab; then
        echo -e "\n${BLUE}GitLab:${NC}"
        glab auth status 2>/dev/null | sed 's/^/  /' || echo "  Not authenticated"
    fi

    # Show current git config
    echo -e "\n${BLUE}Current Git Configuration:${NC}"
    echo "  User: $(git config user.name 2>/dev/null || echo 'Not set')"
    echo "  Email: $(git config user.email 2>/dev/null || echo 'Not set')"

    # Show stored GitHub accounts
    if [[ -f "$CONFIG_DIR/github.current" ]]; then
        echo -e "\n${BLUE}Stored GitHub Accounts:${NC}"
        cat "$CONFIG_DIR/github.current" | sed 's/^/  /'
    fi
}

# Switch between GitHub accounts
switch_github_account() {
    print_info "Switching GitHub account..."

    # First, ensure we're logged out
    gh auth logout &>/dev/null || true

    # Re-authenticate
    gh auth login --with-token

    if [[ $? -eq 0 ]]; then
        local username
        username=$(gh api user --jq .login 2>/dev/null)
        echo "$username" > "$CONFIG_DIR/github.current"

        # Update git config
        local email
        email=$(gh api user --jq .email 2>/dev/null)
        if [[ -n "$email" ]]; then
            git config --global user.email "$email"
        fi
        git config --global user.name "$username"

        print_success "Switched to GitHub account: $username"
    else
        print_error "Failed to switch GitHub account"
        return 1
    fi
}

# Configure a project with current credentials
configure_project() {
    print_info "Configuring project with current credentials..."

    # Check if we're in a git repository
    if ! git rev-parse --git-dir &>/dev/null; then
        print_warning "Not in a git repository. Run 'git init' first."
        return 1
    fi

    # Configure repository with current user info
    local username
    local email

    username=$(git config user.name 2>/dev/null)
    email=$(git config user.email 2>/dev/null)

    if [[ -z "$username" || -z "$email" ]]; then
        print_error "Git user.name or user.email not configured"
        print_info "Please authenticate first: $0 auth github"
        return 1
    fi

    print_success "Project configured:"
    echo "  Repository: $(git remote get-url origin 2>/dev/null || echo 'No remote configured')"
    echo "  User: $username"
    echo "  Email: $email"

    # Offer to set up remote if not present
    if ! git remote get-url origin &>/dev/null; then
        echo
        read -q "setup_remote?Set up remote repository now? (y/N): "
        echo
        if [[ $setup_remote == "y" || $setup_remote == "Y" ]]; then
            echo -n "Enter repository URL (e.g., https://github.com/user/repo.git): "
            read repo_url
            git remote add origin "$repo_url"
            print_success "Remote configured: $repo_url"
        fi
    fi
}

# Quick setup for a new project
quick_setup() {
    print_info "Quick setup for new project..."

    # Ensure we're in a git repository
    if ! git rev-parse --git-dir &>/dev/null; then
        echo -n "Initialize git repository? (y/N): "
        read init_git
        if [[ $init_git == "y" || $init_git == "Y" ]]; then
            git init
            print_success "Git repository initialized"
        else
            return 1
        fi
    fi

    # Authenticate with GitHub
    auth_github

    if [[ $? -eq 0 ]]; then
        configure_project
    fi
}

# Helper to add remote for existing repository
add_remote() {
    local provider="$1"

    case "$provider" in
        github)
            echo -n "GitHub username/organization: "
            read username
            echo -n "Repository name: "
            read reponame
            git remote add origin "https://github.com/$username/$reponame.git"
            print_success "GitHub remote added: https://github.com/$username/$reponame.git"
            ;;
        gitlab)
            echo -n "GitLab username/group: "
            read username
            echo -n "Repository name: "
            read reponame
            git remote add origin "https://gitlab.com/$username/$reponame.git"
            print_success "GitLab remote added: https://gitlab.com/$username/$reponame.git"
            ;;
        bitbucket)
            echo -n "Bitbucket username/workspace: "
            read username
            echo -n "Repository name: "
            read reponame
            git remote add origin "https://bitbucket.org/$username/$reponame.git"
            print_success "Bitbucket remote added: https://bitbucket.org/$username/$reponame.git"
            ;;
        *)
            echo -n "Repository URL: "
            read repo_url
            git remote add origin "$repo_url"
            print_success "Remote added: $repo_url"
            ;;
    esac
}

# Show help
show_help() {
    cat << EOF
${CYAN}Git Authentication Helper${NC}

${YELLOW}USAGE${NC}
    $0 [COMMAND] [OPTIONS]

${YELLOW}COMMANDS${NC}
    auth github [--force]          Authenticate with GitHub via browser
    auth gitlab                    Authenticate with GitLab via browser
    auth                           Authenticate with all providers
    list                           List all authenticated accounts
    switch                         Switch GitHub account (logout + login)
    configure                      Configure current project with credentials
    setup                          Quick setup: init repo + authenticate
    add-remote [github|gitlab|bitbucket]  Add remote for repository
    check                          Check authentication status
    help                           Show this help message

${YELLOW}OPTIONS${NC}
    --with-glab                    Also check/install GitLab CLI
    --force                        Force re-authentication

${YELLOW}EXAMPLES${NC}
    $0 auth github                 Authenticate with GitHub
    $0 setup                       Quick setup for new project
    $0 list                        List all authenticated accounts
    $0 configure                   Configure current project
    $0 add-remote github           Add GitHub remote

${YELLOW}TIPS${NC}
    • Use 'switch' to change between GitHub accounts
    • 'setup' is perfect for new projects
    • Credentials are stored securely via OAuth
    • Works with GitHub, GitLab, and Bitbucket

EOF
}

# Check current authentication status
check_auth() {
    echo -e "\n${CYAN}=== Authentication Status ===${NC}\n"

    # Check GitHub
    if command_exists gh; then
        if gh auth status &>/dev/null; then
            print_success "GitHub: Authenticated"
            gh auth status | sed 's/^/  /'
        else
            print_error "GitHub: Not authenticated"
        fi
    fi

    # Check GitLab
    if command_exists glab; then
        if glab auth status &>/dev/null; then
            print_success "GitLab: Authenticated"
            glab auth status | sed 's/^/  /'
        else
            print_error "GitLab: Not authenticated"
        fi
    fi

    # Check Git configuration
    echo -e "\n${CYAN}Git Configuration:${NC}"
    echo "  User: $(git config user.name 2>/dev/null || echo "${RED}Not set${NC}")"
    echo "  Email: $(git config user.email 2>/dev/null || echo "${RED}Not set${NC}")"
    echo "  Current branch: $(git branch --show-current 2>/dev/null || echo 'Not in repo')"
}

# Main script logic
main() {
    # Check for --with-glab flag
    if [[ "$*" == *"--with-glab"* ]]; then
        install_dependencies --with-glab
    else
        install_dependencies
    fi

    case "$1" in
        auth)
            case "$2" in
                github)
                    auth_github "${@:3}"
                    ;;
                gitlab)
                    auth_gitlab
                    ;;
                "")
                    auth_github
                    auth_gitlab
                    ;;
                *)
                    print_error "Unknown provider: $2"
                    show_help
                    exit 1
                    ;;
            esac
            ;;
        list)
            list_accounts
            ;;
        switch)
            switch_github_account
            ;;
        configure)
            configure_project
            ;;
        setup)
            quick_setup
            ;;
        add-remote)
            add_remote "$2"
            ;;
        check)
            check_auth
            ;;
        help|--help|-h)
            show_help
            ;;
        "")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
