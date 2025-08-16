#!/bin/bash

# =============================================================================
# AWS Deployment Script for Maxence RAG Project
# =============================================================================
# This script deploys infrastructure (OpenTofu), backend (SAM), and frontend (Quasar)
# Note: OpenTofu is a drop-in replacement for Terraform with full compatibility
# Usage: ./deploy.sh [environment] [--skip-infra] [--skip-backend] [--skip-frontend]
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
INFRA_DIR="$PROJECT_ROOT/infra"
BACKEND_DIR="$PROJECT_ROOT/back"
FRONTEND_DIR="$PROJECT_ROOT/front"

# Default values
ENVIRONMENT="staging"
SKIP_INFRA=false
SKIP_BACKEND=false
SKIP_FRONTEND=false

# =============================================================================
# Helper Functions
# =============================================================================

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

check_dependencies() {
    log_info "Checking dependencies..."
    
    local deps=("aws" "tofu" "sam" "node" "npm")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "$dep is not installed or not in PATH"
            exit 1
        fi
    done
    
    log_success "All dependencies are available"
}

validate_environment() {
    log_info "Validating environment: $ENVIRONMENT"
    
    case "$ENVIRONMENT" in
        dev|staging|preprod|prod)
            log_success "Environment '$ENVIRONMENT' is valid"
            ;;
        *)
            log_error "Invalid environment '$ENVIRONMENT'. Must be one of: dev, staging, preprod, prod"
            exit 1
            ;;
    esac
}

load_environment_variables() {
    log_info "Loading environment variables for $ENVIRONMENT..."
    
    # Load environment-specific configuration
    local env_file="$PROJECT_ROOT/env.$ENVIRONMENT"
    if [[ -f "$env_file" ]]; then
        log_info "Loading variables from $env_file"
        set -a  # automatically export all variables
        source "$env_file"
        set +a
    else
        log_warning "Environment file $env_file not found, using default/system variables"
    fi
    
    # =============================================================================
    # Infrastructure Variables (Required for OpenTofu)
    # =============================================================================
    export TF_VAR_ENVIRONMENT="${ENVIRONMENT}"
    
    # =============================================================================
    # Backend Variables (Required for SAM)
    # =============================================================================
    export SAM_ENVIRONMENT="${ENVIRONMENT}"
    export SAM_AUTH0_ISSUER_URL="${AUTH0_ISSUER_URL:-https://example.auth0.com/}"
    export SAM_AUTH0_AUDIENCE="${AUTH0_AUDIENCE:-player-management-api}"
    export SAM_AUTH0_MANAGEMENT_CLIENT_ID="${AUTH0_MANAGEMENT_CLIENT_ID:-}"
    export SAM_AUTH0_MANAGEMENT_CLIENT_SECRET="${AUTH0_MANAGEMENT_CLIENT_SECRET:-}"
    export SAM_AUTH0_ADMIN_ROLE_ID="${AUTH0_ADMIN_ROLE_ID:-}"
    export SAM_AUTH0_TEAM_MANAGER_ROLE_ID="${AUTH0_TEAM_MANAGER_ROLE_ID:-}"
    export SAM_AUTH0_USER_ROLE_ID="${AUTH0_USER_ROLE_ID:-}"
    export SAM_DYNAMODB_ENDPOINT="${DYNAMODB_ENDPOINT:-}"
    
    # =============================================================================
    # Frontend Variables (Required for Quasar build)
    # =============================================================================
    export API_URL="${API_URL:-}"
    export AUTH0_DOMAIN="${AUTH0_DOMAIN:-}"
    export AUTH0_CLIENT_ID="${AUTH0_CLIENT_ID:-}"
    
    # AWS Configuration
    export AWS_REGION="${AWS_REGION:-eu-west-1}"
    export AWS_DEFAULT_REGION="$AWS_REGION"
    
    # OpenTofu Backend Configuration
    export TF_STATE_BUCKET="${TF_STATE_BUCKET:-${ENVIRONMENT}-tofu-state-maxence-rag}"
    export TF_STATE_KEY="${TF_STATE_KEY:-${ENVIRONMENT}/tofu.tfstate}"
    export TF_STATE_REGION="${TF_STATE_REGION:-eu-west-1}"
    export TF_DYNAMODB_TABLE="${TF_DYNAMODB_TABLE:-x-github-deployments}"
    export STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-sk_test_51RwQBw0Xrngfa9BoHFO3cedbV8WbNr2iHA7SN3eRZcuSnF2NrzBrphTDY9JwBHnEyX0gIgqx7JBDqKAWFyPa8Klf00MBfGGTEe}"
    export STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-sk_test_51RwQBw0Xrngfa9BoHFO3cedbV8WbNr2iHA7SN3eRZcuSnF2NrzBrphTDY9JwBHnEyX0gIgqx7JBDqKAWFyPa8Klf00MBfGGTEe}"
    
    log_success "Environment variables loaded"
}

validate_required_variables() {
    log_info "Validating required environment variables..."
    
    local required_vars=()
    
    if [[ "$SKIP_INFRA" != true ]]; then
        required_vars+=(
            "TF_VAR_ENVIRONMENT"
            "TF_STATE_BUCKET"
        )
    fi
    
    if [[ "$SKIP_BACKEND" != true ]]; then
        required_vars+=(
            "SAM_AUTH0_ISSUER_URL"
            "SAM_AUTH0_AUDIENCE"
        )
    fi
    
    if [[ "$SKIP_FRONTEND" != true ]]; then
        required_vars+=(
            "AUTH0_DOMAIN"
            "AUTH0_CLIENT_ID"
        )
    fi
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            log_error "  - $var"
        done
        log_error "Please set these variables in .env.$ENVIRONMENT or environment"
        exit 1
    fi
    
    log_success "All required variables are set"
}

# =============================================================================
# Infrastructure Deployment (OpenTofu)
# =============================================================================

deploy_infrastructure() {
    log_info "Starting infrastructure deployment..."
    
    cd "$INFRA_DIR"
    
    # Initialize OpenTofu with backend configuration
    log_info "Initializing OpenTofu..."
    tofu init \
        -backend-config="bucket=$TF_STATE_BUCKET" \
        -backend-config="key=$TF_STATE_KEY" \
        -backend-config="region=$TF_STATE_REGION" \
        -backend-config="dynamodb_table=$TF_DYNAMODB_TABLE" \
        -reconfigure
    
    # Validate OpenTofu configuration
    log_info "Validating OpenTofu configuration..."
    tofu validate
    
    # Plan the deployment
    log_info "Planning OpenTofu deployment..."
    tofu plan \
        -var="ENVIRONMENT=$TF_VAR_ENVIRONMENT" \
        -out="$ENVIRONMENT.tfplan"
    
    # Apply the deployment
    log_info "Applying OpenTofu deployment..."
    tofu apply -auto-approve "$ENVIRONMENT.tfplan"
    
    # Clean up plan file
    rm -f "$ENVIRONMENT.tfplan"
    
    cd "$PROJECT_ROOT"
    log_success "Infrastructure deployment completed"
}

# =============================================================================
# Backend Deployment (SAM)
# =============================================================================

deploy_backend() {
    log_info "Starting backend deployment..."
    
    cd "$BACKEND_DIR"
    
    # Install dependencies
    log_info "Installing backend dependencies..."
    cd src && npm ci && cd ..
    
    # Build the SAM application
    log_info "Building SAM application..."
    sam build --parallel
    
    # Deploy the SAM application
    log_info "Deploying SAM application..."
    sam deploy \
        --stack-name "maxence-rag-$ENVIRONMENT" \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
        --s3-bucket $TF_STATE_BUCKET \
        --s3-prefix "maxence-rag-$ENVIRONMENT" \
        --no-confirm-changeset \
        --no-fail-on-empty-changeset \
        --parameter-overrides \
            Environment="$SAM_ENVIRONMENT" \
            Auth0ClientId="$AUTH0_CLIENT_ID" \
            Auth0IssuerUrl="$SAM_AUTH0_ISSUER_URL" \
            Auth0Audience="$SAM_AUTH0_AUDIENCE" \
            Auth0ManagementClientId="$SAM_AUTH0_MANAGEMENT_CLIENT_ID" \
            Auth0ManagementClientSecret="$SAM_AUTH0_MANAGEMENT_CLIENT_SECRET" \
            Auth0AdminRoleId="$SAM_AUTH0_ADMIN_ROLE_ID" \
            Auth0TeamManagerRoleId="$SAM_AUTH0_TEAM_MANAGER_ROLE_ID" \
            Auth0UserRoleId="$SAM_AUTH0_USER_ROLE_ID"
    
    # Get API Gateway URL from CloudFormation outputs
    log_info "Retrieving API Gateway URL..."
    API_GATEWAY_URL=$(aws cloudformation describe-stacks \
        --stack-name "maxence-rag-$ENVIRONMENT" \
        --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
        --output text)
    
    if [[ -n "$API_GATEWAY_URL" ]]; then
        export API_URL="$API_GATEWAY_URL"
        log_success "API Gateway URL: $API_URL"
    else
        log_warning "Could not retrieve API Gateway URL from CloudFormation outputs"
    fi
    
    cd "$PROJECT_ROOT"
    log_success "Backend deployment completed"
}

# =============================================================================
# Frontend Deployment
# =============================================================================

deploy_frontend() {
    log_info "Starting frontend deployment..."
    
    cd "$FRONTEND_DIR"
    
    # Install dependencies
    log_info "Installing frontend dependencies..."
    yarn install
    
    # Create environment file for build
    log_info "Creating environment configuration for build..."
    cat > .env << EOF
API_URL=$API_URL
AUTH0_DOMAIN=$AUTH0_DOMAIN
AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID
EOF
    
    # Generate welcome page with CloudFront domain and API URL
    log_info "Generating welcome page with CloudFront domain and API URL..."
    
    # Debug: List available SSM parameters
    log_info "Checking available SSM parameters for environment $ENVIRONMENT..."
    aws ssm get-parameters-by-path --path "/$ENVIRONMENT/" --query 'Parameters[].Name' --output text || true
    
    # Get CloudFront domain
    log_info "Retrieving CloudFront domain from SSM..."
    CLOUDFRONT_DOMAIN=$(aws ssm get-parameter \
        --name "/$ENVIRONMENT/luna-front/cloudfront_domain" \
        --query 'Parameter.Value' \
        --output text 2>&1)
    if [[ $? -ne 0 ]]; then
        log_warning "Failed to retrieve CloudFront domain: $CLOUDFRONT_DOMAIN"
        CLOUDFRONT_DOMAIN=""
    fi
    
    # Get API URL
    log_info "Retrieving API URL from SSM..."
    API_URL=$(aws ssm get-parameter \
        --name "/$ENVIRONMENT/luna-front/api_url" \
        --query 'Parameter.Value' \
        --output text 2>&1)
    if [[ $? -ne 0 ]]; then
        log_warning "Failed to retrieve API URL: $API_URL"
        API_URL=""
    fi

    echo "CLOUDFRONT_DOMAIN: '$CLOUDFRONT_DOMAIN'"
    echo "API_URL: '$API_URL'"
    
    if [[ -n "$CLOUDFRONT_DOMAIN" && -n "$API_URL" ]]; then
        # Replace placeholders with actual values
        sed -e "s|CLOUDFRONT_DOMAIN_PLACEHOLDER|https://$CLOUDFRONT_DOMAIN|g" \
            -e "s|API_BASE_URL_PLACEHOLDER|$API_URL|g" \
            public/welcome-template.html > public/welcome.html
        log_info "Generated welcome page with CloudFront domain: $CLOUDFRONT_DOMAIN"
        log_info "Generated welcome page with API URL: $API_URL"
    else
        log_warning "CloudFront domain or API URL not found, using placeholder"
        cp public/welcome-template.html public/welcome.html
    fi
    
    # Build the application
    log_info "Building frontend application..."
    quasar build
    
    # Get S3 bucket name from SSM Parameter Store
    log_info "Retrieving S3 bucket information..."
    S3_BUCKET="$ENVIRONMENT-uci-maxence-rag-application-front-eu-west-1"
    S3_BUCKET_EU_CENTRAL="$ENVIRONMENT-uci-maxence-rag-application-front-eu-central-2"
    
    if [[ -n "$S3_BUCKET" ]]; then
        # Sync to S3
        log_info "Uploading to S3 bucket: $S3_BUCKET"
        aws s3 sync dist/spa/ "s3://$S3_BUCKET" \
            --delete \
            --cache-control "public, max-age=31536000" \
            --exclude "*.html" \
            --exclude "*.json"
        
        # Upload HTML files with no-cache
        aws s3 sync dist/spa/ "s3://$S3_BUCKET" \
            --cache-control "no-cache, no-store, must-revalidate" \
            --include "*.html" \
            --include "*.json"

        aws s3 sync dist/spa/ "s3://$S3_BUCKET_EU_CENTRAL" \
            --delete \
            --cache-control "public, max-age=31536000" \
            --exclude "*.html" \
            --exclude "*.json"
        
        # Upload HTML files with no-cache
        aws s3 sync dist/spa/ "s3://$S3_BUCKET_EU_CENTRAL" \
            --cache-control "no-cache, no-store, must-revalidate" \
            --include "*.html" \
            --include "*.json"
        
        # Get CloudFront distribution ID
        log_info "Retrieving CloudFront distribution ID..."
        CLOUDFRONT_ID=$(aws ssm get-parameter \
            --name "/$ENVIRONMENT/luna-front/cloudfront_id" \
            --query 'Parameter.Value' \
            --output text 2>/dev/null || echo "")
        
        if [[ -n "$CLOUDFRONT_ID" ]]; then
            # Invalidate CloudFront cache
            log_info "Invalidating CloudFront cache: $CLOUDFRONT_ID"
            aws cloudfront create-invalidation \
                --distribution-id "$CLOUDFRONT_ID" \
                --paths "/*" > /dev/null
            log_success "CloudFront cache invalidation initiated"
        else
            log_warning "CloudFront distribution ID not found, skipping cache invalidation"
        fi
        
        log_success "Frontend uploaded to S3"
    else
        log_error "Could not find S3 bucket for frontend deployment"
        log_error "Please ensure the infrastructure has been deployed first"
        exit 1
    fi
    
    # Clean up
    rm -f .env
    
    cd "$PROJECT_ROOT"
    log_success "Frontend deployment completed"
}

# =============================================================================
# Main Execution
# =============================================================================

show_usage() {
    echo "Usage: $0 [environment] [options]"
    echo ""
    echo "Environments: dev, staging, preprod, prod"
    echo ""
    echo "Options:"
    echo "  --skip-infra      Skip infrastructure deployment"
    echo "  --skip-backend    Skip backend deployment"
    echo "  --skip-frontend   Skip frontend deployment"
    echo "  --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 staging                    # Deploy everything to staging"
    echo "  $0 prod --skip-infra         # Deploy only backend and frontend to prod"
    echo "  $0 dev --skip-frontend       # Deploy only infrastructure and backend to dev"
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-infra)
                SKIP_INFRA=true
                shift
                ;;
            --skip-backend)
                SKIP_BACKEND=true
                shift
                ;;
            --skip-frontend)
                SKIP_FRONTEND=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            -*)
                log_error "Unknown option $1"
                show_usage
                exit 1
                ;;
            *)
                if [[ -n "${ENVIRONMENT_SET:-}" ]]; then
                    log_error "Multiple environments specified"
                    show_usage
                    exit 1
                fi
                ENVIRONMENT="$1"
                ENVIRONMENT_SET=true
                shift
                ;;
        esac
    done
}

main() {
    log_info "=== AWS Deployment Script for Maxence RAG Project ==="
    log_info "Environment: $ENVIRONMENT"
    log_info "Skip Infrastructure: $SKIP_INFRA"
    log_info "Skip Backend: $SKIP_BACKEND"
    log_info "Skip Frontend: $SKIP_FRONTEND"
    echo ""
    
    # Validation
    check_dependencies
    validate_environment
    load_environment_variables
    validate_required_variables
    
    # Deployment phases
    if [[ "$SKIP_INFRA" != true ]]; then
        deploy_infrastructure
    else
        log_info "Skipping infrastructure deployment"
    fi
    
    if [[ "$SKIP_BACKEND" != true ]]; then
        deploy_backend
    else
        log_info "Skipping backend deployment"
    fi
    
    if [[ "$SKIP_FRONTEND" != true ]]; then
        deploy_frontend
    else
        log_info "Skipping frontend deployment"
    fi
    
    echo ""
    log_success "=== Deployment completed successfully! ==="
    
    if [[ -n "${API_URL:-}" ]]; then
        log_info "API URL: $API_URL"
    fi
    if [[ -n "${S3_BUCKET:-}" ]]; then
        log_info "Frontend S3 Bucket: $S3_BUCKET"
    fi
    if [[ -n "${CLOUDFRONT_ID:-}" ]]; then
        log_info "CloudFront Distribution: $CLOUDFRONT_ID"
    fi
}

# Parse command line arguments (skip the first argument which is the script name)
if [[ $# -gt 0 ]]; then
    # If first argument doesn't start with --, treat it as environment
    if [[ "$1" != --* ]]; then
        ENVIRONMENT="$1"
        shift
    fi
    parse_arguments "$@"
fi

# Execute main function
main 