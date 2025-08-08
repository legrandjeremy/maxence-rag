#!/bin/bash

# =============================================================================
# Setup Script for Maxence RAG Project
# =============================================================================
# This script helps you set up the environment for deployment
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_usage() {
    echo "Usage: $0 [environment]"
    echo ""
    echo "Environments: dev, staging, preprod, prod"
    echo ""
    echo "This script will:"
    echo "  1. Check for required dependencies"
    echo "  2. Create environment file from template"
    echo "  3. Create OpenTofu state bucket"
    echo "  4. Guide you through configuration"
}

check_dependencies() {
    log_info "Checking for required dependencies..."
    
    local deps=("aws" "tofu" "sam" "node" "npm")
    local missing_deps=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_error "Missing required dependencies:"
        for dep in "${missing_deps[@]}"; do
            log_error "  - $dep"
        done
        echo ""
        log_info "Please install the missing dependencies:"
        log_info "  - AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html"
        log_info "  - OpenTofu: https://opentofu.org/docs/intro/install/"
        log_info "  - SAM CLI: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html"
        log_info "  - Node.js: https://nodejs.org/"
        exit 1
    fi
    
    log_success "All dependencies are installed"
}

check_aws_config() {
    log_info "Checking AWS configuration..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS CLI is not configured or credentials are invalid"
        log_info "Please run: aws configure"
        exit 1
    fi
    
    local aws_account=$(aws sts get-caller-identity --query Account --output text)
    local aws_region=$(aws configure get region)
    
    log_success "AWS configured for account: $aws_account in region: $aws_region"
}

create_environment_file() {
    local env="$1"
    local env_file="env.$env"
    local template_file="env.$env.template"
    
    if [[ -f "$env_file" ]]; then
        log_warning "Environment file $env_file already exists"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Skipping environment file creation"
            return
        fi
    fi
    
    if [[ -f "$template_file" ]]; then
        log_info "Creating environment file from template..."
        cp "$template_file" "$env_file"
        log_success "Created $env_file from template"
    else
        log_info "Creating environment file from generic template..."
        cp "env.example" "$env_file"
        log_success "Created $env_file from generic template"
    fi
    
    log_warning "Please edit $env_file and fill in your specific values"
}

create_opentofu_state_bucket() {
    local env="$1"
    local bucket_name="${env}-tofu-state-maxence-rag"
    local region=$(aws configure get region || echo "eu-west-1")
    
    log_info "Checking if OpenTofu state bucket exists..."
    
    if aws s3 ls "s3://$bucket_name" &> /dev/null; then
        log_success "OpenTofu state bucket already exists: $bucket_name"
        return
    fi
    
    log_info "Creating OpenTofu state bucket: $bucket_name"
    
    if [[ "$region" == "us-east-1" ]]; then
        aws s3 mb "s3://$bucket_name"
    else
        aws s3 mb "s3://$bucket_name" --region "$region"
    fi
    
    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket "$bucket_name" \
        --versioning-configuration Status=Enabled
    
    # Enable encryption
    aws s3api put-bucket-encryption \
        --bucket "$bucket_name" \
        --server-side-encryption-configuration '{
            "Rules": [
                {
                    "ApplyServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "AES256"
                    }
                }
            ]
        }'
    
    log_success "OpenTofu state bucket created and configured: $bucket_name"
}

validate_environment() {
    local env="$1"
    case "$env" in
        dev|staging|preprod|prod)
            return 0
            ;;
        *)
            log_error "Invalid environment '$env'. Must be one of: dev, staging, preprod, prod"
            exit 1
            ;;
    esac
}

show_next_steps() {
    local env="$1"
    local env_file="env.$env"
    
    echo ""
    log_success "Setup completed for environment: $env"
    echo ""
    log_info "Next steps:"
    echo "  1. Edit $env_file and fill in your specific values"
    echo "     Required variables include:"
    echo "       - AUTH0_DOMAIN"
    echo "       - AUTH0_CLIENT_ID"
    echo "       - AUTH0_MANAGEMENT_CLIENT_ID"
    echo "       - AUTH0_MANAGEMENT_CLIENT_SECRET"
    echo "       - AUTH0_*_ROLE_ID variables"
    echo ""
    echo "  2. Deploy your application:"
    echo "       ./deploy.sh $env"
    echo ""
    echo "  3. For partial deployments:"
    echo "       ./deploy.sh $env --skip-infra      # Skip infrastructure"
    echo "       ./deploy.sh $env --skip-backend    # Skip backend"
    echo "       ./deploy.sh $env --skip-frontend   # Skip frontend"
    echo ""
    log_info "For more details, see DEPLOYMENT.md"
}

main() {
    local env="${1:-staging}"
    
    if [[ "$env" == "--help" ]] || [[ "$env" == "-h" ]]; then
        show_usage
        exit 0
    fi
    
    validate_environment "$env"
    
    log_info "=== Setting up Maxence RAG Project for environment: $env ==="
    echo ""
    
    # Checks
    check_dependencies
    check_aws_config
    
    # Setup
    create_environment_file "$env"
    create_opentofu_state_bucket "$env"
    
    # Make deploy script executable
    chmod +x deploy.sh
    
    show_next_steps "$env"
}

main "$@" 