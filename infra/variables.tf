# =============================================================================
# Environment Variables
# =============================================================================

variable "ENVIRONMENT" {
  description = "Environment name (dev, staging, preprod, prod)"
  type        = string
  
  validation {
    condition     = contains(["dev", "staging", "preprod", "prod"], var.ENVIRONMENT)
    error_message = "Environment must be one of: dev, staging, preprod, prod."
  }
}

# =============================================================================
# CloudFront Configuration
# =============================================================================

variable "CLOUDFRONT_DOMAIN" {
  description = "Custom domain name for CloudFront distribution (e.g., app.example.com). Leave empty to use CloudFront default domain."
  type        = string
  default     = ""
  
  validation {
    condition = var.CLOUDFRONT_DOMAIN == "" || can(regex("^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$", var.CLOUDFRONT_DOMAIN))
    error_message = "CLOUDFRONT_DOMAIN must be a valid domain name or empty string."
  }
}

# =============================================================================
# Optional Variables
# =============================================================================

variable "enable_waf" {
  description = "Enable AWS WAF for CloudFront distribution"
  type        = bool
  default     = true
}

variable "certificate_validation_timeout" {
  description = "Timeout for ACM certificate validation"
  type        = string
  default     = "5m"
}