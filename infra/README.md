# Luna Medium Infrastructure

This directory contains the OpenTofu/Terraform infrastructure code for the Luna Medium application.

## Overview

The infrastructure includes:
- **S3 Buckets**: Static website hosting with multi-region setup
- **CloudFront**: Global CDN with custom domain and SSL support
- **ACM Certificate**: SSL/TLS certificate for custom domain
- **Route53**: DNS management for custom domain
- **WAF**: Web Application Firewall for enhanced security
- **SSM Parameters**: Configuration storage

## Custom Domain Configuration

### Prerequisites

1. **Domain Registration**: You must own the domain you want to use
2. **Route53 Hosted Zone**: The domain must have a hosted zone in Route53
3. **DNS Access**: You need to be able to update DNS records for certificate validation

### Setup Instructions

#### 1. Configure Environment Variables

Add the custom domain to your environment file (e.g., `env.staging`):

```bash
# Custom domain configuration
export CLOUDFRONT_DOMAIN="app.yourdomain.com"
export TF_VAR_CLOUDFRONT_DOMAIN="app.yourdomain.com"
```

#### 2. Deploy Infrastructure

```bash
# Deploy with custom domain
./deploy.sh staging

# Or deploy only infrastructure
./deploy.sh staging --skip-backend --skip-frontend
```

#### 3. Certificate Creation and Validation

The deployment will:
1. Create a new ACM certificate for your domain (including wildcard `*.yourdomain.com`)
2. Add DNS validation records to Route53 automatically
3. Wait for certificate validation (up to 5 minutes)
4. Configure CloudFront to use the validated certificate

#### 4. DNS Propagation

After deployment:
- The Route53 A and AAAA records will point to CloudFront
- DNS propagation may take up to 24 hours globally
- You can check status with: `dig app.yourdomain.com`

### Without Custom Domain

If you don't set `CLOUDFRONT_DOMAIN`, the infrastructure will:
- Use CloudFront's default domain (e.g., `d123456789.cloudfront.net`)
- Skip ACM certificate creation entirely
- Skip Route53 DNS configuration
- Disable WAF (as it's only beneficial with custom domains)

## Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENVIRONMENT` | Environment name | - | Yes |
| `CLOUDFRONT_DOMAIN` | Custom domain for CloudFront | `""` | No |
| `enable_waf` | Enable AWS WAF | `true` | No |
| `certificate_validation_timeout` | ACM validation timeout | `"5m"` | No |

## Outputs

After deployment, the following outputs are available:

| Output | Description |
|--------|-------------|
| `cloudfront_distribution_id` | CloudFront Distribution ID |
| `cloudfront_distribution_domain_name` | CloudFront default domain |
| `cloudfront_custom_domain` | Custom domain (if configured) |
| `cloudfront_certificate_arn` | ACM Certificate ARN |
| `cloudfront_hosted_zone_id` | CloudFront Hosted Zone ID |
| `waf_web_acl_arn` | WAF Web ACL ARN (if enabled) |

## Security Features

### AWS WAF (Web Application Firewall)

When using a custom domain, WAF is automatically enabled with:

- **Rate Limiting**: 10,000 requests per 5 minutes per IP
- **AWS Managed Rules**:
  - Core Rule Set (OWASP Top 10 protection)
  - Known Bad Inputs Rule Set
- **CloudWatch Metrics**: Full monitoring and alerting

### SSL/TLS Configuration

- **Minimum Protocol**: TLS 1.2
- **Cipher Suites**: Modern, secure ciphers only
- **HSTS**: Enforced HTTPS redirection
- **Certificate**: Automatically managed by ACM

## Caching Strategy

### Static Assets
- **Cache Duration**: 1 year (31,536,000 seconds)
- **Compression**: Enabled
- **Files**: CSS, JS, images, fonts

### HTML Files
- **Cache Duration**: No cache
- **Headers**: `no-cache, no-store, must-revalidate`
- **Files**: `*.html`, `*.json`

### API Calls
- **Cache Duration**: No cache
- **Method Support**: All HTTP methods
- **Headers**: Forward all headers
- **Path Pattern**: `/api/*`

## Multi-Region Setup

The infrastructure uses multiple AWS regions for redundancy:

- **Primary**: EU Central 2 (Frankfurt)
- **Fallback**: EU West 1 (Ireland)
- **CloudFront**: Global edge locations
- **Certificate**: US East 1 (required for CloudFront)

## Monitoring

### CloudWatch Metrics

Available metrics include:
- **CloudFront**: Requests, data transfer, error rates
- **WAF**: Blocked requests, rule matches
- **Certificate**: Validation status

### Alarms

Consider setting up CloudWatch alarms for:
- High error rates (4xx, 5xx)
- Unusual traffic patterns
- WAF blocked requests
- Certificate expiration

## Troubleshooting

### Common Issues

#### Certificate Validation Fails
```bash
# Check Route53 hosted zone
aws route53 list-hosted-zones --query 'HostedZones[?Name==`yourdomain.com.`]'

# Check validation records
aws route53 list-resource-record-sets --hosted-zone-id Z123456789
```

#### Domain Not Resolving
```bash
# Check DNS propagation
dig app.yourdomain.com
nslookup app.yourdomain.com

# Check CloudFront distribution
aws cloudfront get-distribution --id E123456789
```

#### WAF Blocking Legitimate Traffic
```bash
# Check WAF logs
aws wafv2 get-sampled-requests --web-acl-arn arn:aws:wafv2:us-east-1:123456789:global/webacl/name/id --rule-metric-name RuleName --scope CLOUDFRONT --time-window StartTime=2023-01-01T00:00:00Z,EndTime=2023-01-02T00:00:00Z --max-items 100
```

## Cost Optimization

### Recommendations

1. **CloudFront**: Use appropriate cache behaviors
2. **WAF**: Monitor and adjust rules to avoid unnecessary processing
3. **S3**: Enable intelligent tiering for older objects
4. **Route53**: Use alias records (free) instead of CNAME records

### Estimated Monthly Costs

- **CloudFront**: $1-10 (depending on traffic)
- **WAF**: $1-5 (base cost + request processing)
- **Route53**: $0.50 per hosted zone + $0.40 per million queries
- **ACM Certificate**: Free
- **S3**: $0.01-1 (depending on storage and requests)

## Deployment Examples

### Production with Custom Domain
```bash
export CLOUDFRONT_DOMAIN="app.luna-medium.com"
./deploy.sh prod
```

### Staging without Custom Domain
```bash
unset CLOUDFRONT_DOMAIN
./deploy.sh staging
```

### Development with WAF Disabled
```bash
export CLOUDFRONT_DOMAIN="dev.luna-medium.com"
export TF_VAR_enable_waf=false
./deploy.sh dev
```
