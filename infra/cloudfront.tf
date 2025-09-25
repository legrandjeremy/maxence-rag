
# =============================================================================
# ACM Certificate (must be in us-east-1 for CloudFront)
# =============================================================================

# Create ACM certificate for custom domain
resource "aws_acm_certificate" "domain_cert" {
  provider          = aws.infra_us_east_1
  count             = var.CLOUDFRONT_DOMAIN != "" && var.CLOUDFRONT_DOMAIN != null ? 1 : 0
  domain_name       = var.CLOUDFRONT_DOMAIN
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.CLOUDFRONT_DOMAIN}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.ENVIRONMENT}-luna-certificate"
    Environment = var.ENVIRONMENT
    Project     = "luna-medium"
  }
}

# =============================================================================
# Route53 Hosted Zone (if using custom domain)
# =============================================================================

# Data source to find existing hosted zone
data "aws_route53_zone" "domain_zone" {
  provider     = aws.infra_us_east_1
  count        = var.CLOUDFRONT_DOMAIN != "" && var.CLOUDFRONT_DOMAIN != null ? 1 : 0
  name         = "luna-medium.ai"
  private_zone = false
}

# Certificate validation using Route53
resource "aws_acm_certificate_validation" "domain_cert_validation" {
  provider        = aws.infra_us_east_1
  count           = var.CLOUDFRONT_DOMAIN != "" && var.CLOUDFRONT_DOMAIN != null ? 1 : 0
  certificate_arn = aws_acm_certificate.domain_cert[0].arn
  validation_record_fqdns = [
    for record in aws_route53_record.domain_cert_validation : record.fqdn
  ]

  timeouts {
    create = var.certificate_validation_timeout
  }
}

# Route53 records for certificate validation
resource "aws_route53_record" "domain_cert_validation" {
  provider = aws.infra_us_east_1
  for_each = var.CLOUDFRONT_DOMAIN != "" && var.CLOUDFRONT_DOMAIN != null ? {
    for dvo in aws_acm_certificate.domain_cert[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.domain_zone[0].zone_id
}

# =============================================================================
# CloudFront Origin Access Control
# =============================================================================

resource "aws_cloudfront_origin_access_control" "oac" {
  provider                          = aws.infra_us_east_1
  name                              = "${var.ENVIRONMENT}-luna-oac"
  description                       = "${var.ENVIRONMENT} Luna Origin Access Control"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# =============================================================================
# CloudFront Distribution
# =============================================================================

resource "aws_cloudfront_distribution" "cf" {
  provider = aws.infra
  
  # Origins
  origin {
    domain_name = aws_s3_bucket.application_front.bucket_regional_domain_name
    origin_id   = "application_front_eu_west_3"

    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  origin {
    domain_name = aws_s3_bucket.application_front_ireland.bucket_regional_domain_name
    origin_id   = "application_front_eu_west_1"

    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  # Origin Group for failover
  origin_group {
    origin_id = "application_front"

    failover_criteria {
      status_codes = [500, 502, 503, 504]  # Failover on these HTTP status codes
    }

    member {
      origin_id = "application_front_eu_west_3"  # Primary origin
    }

    member {
      origin_id = "application_front_eu_west_1"  # Fallback origin
    }
  }

  # Custom domain aliases (if domain is provided)
  aliases = var.CLOUDFRONT_DOMAIN != "" && var.CLOUDFRONT_DOMAIN != null ? [var.CLOUDFRONT_DOMAIN] : []

  enabled             = true
  is_ipv6_enabled     = true
  http_version        = "http2and3"
  comment             = "${var.ENVIRONMENT} Luna Medium Application"
  default_root_object = "index.html"

  # Default cache behavior
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "application_front"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    min_ttl                = 0
    default_ttl            = 31536000  # 1 year for static assets
    max_ttl                = 31536000
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  custom_error_response {
    error_caching_min_ttl = 10
    error_code = 400
    response_code = 500
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_caching_min_ttl = 10
    error_code = 403
    response_code = 500
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_caching_min_ttl = 10
    error_code = 404
    response_code = 500
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_caching_min_ttl = 10
    error_code = 405
    response_code = 500
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_caching_min_ttl = 10
    error_code = 414
    response_code = 500
    response_page_path = "/index.html"
  }
  
  custom_error_response {
    error_caching_min_ttl = 10
    error_code = 416
    response_code = 500
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_caching_min_ttl = 10
    error_code = 500
    response_code = 500
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_caching_min_ttl = 10
    error_code = 501
    response_code = 500
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_caching_min_ttl = 10
    error_code = 502
    response_code = 500
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_caching_min_ttl = 10
    error_code = 503
    response_code = 500
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_caching_min_ttl = 10
    error_code = 504
    response_code = 500
    response_page_path = "/index.html"
  }

  # Geographic restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
      locations        = []
    }
  }

  # SSL Certificate configuration
  viewer_certificate {
    # Use ACM certificate if custom domain is provided, otherwise use CloudFront default
    acm_certificate_arn            = var.CLOUDFRONT_DOMAIN != "" && var.CLOUDFRONT_DOMAIN != null ? aws_acm_certificate_validation.domain_cert_validation[0].certificate_arn : null
    cloudfront_default_certificate = var.CLOUDFRONT_DOMAIN == "" || var.CLOUDFRONT_DOMAIN == null
    ssl_support_method             = var.CLOUDFRONT_DOMAIN != "" && var.CLOUDFRONT_DOMAIN != null ? "sni-only" : null
    minimum_protocol_version       = var.CLOUDFRONT_DOMAIN != "" && var.CLOUDFRONT_DOMAIN != null ? "TLSv1.2_2021" : null
  }

  # Tags
  tags = {
    Name        = "${var.ENVIRONMENT}-luna-cloudfront"
    Environment = var.ENVIRONMENT
    Project     = "luna-medium"
  }
}

# =============================================================================
# Route53 Record for Custom Domain (if provided)
# =============================================================================

resource "aws_route53_record" "cloudfront_alias" {
  provider = aws.infra_us_east_1
  count    = var.CLOUDFRONT_DOMAIN != "" && var.CLOUDFRONT_DOMAIN != null ? 1 : 0
  
  zone_id = data.aws_route53_zone.domain_zone[0].zone_id
  name    = var.CLOUDFRONT_DOMAIN
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cf.domain_name
    zone_id                = aws_cloudfront_distribution.cf.hosted_zone_id
    evaluate_target_health = false
  }
}

# AAAA record for IPv6
resource "aws_route53_record" "cloudfront_alias_ipv6" {
  provider = aws.infra_us_east_1
  count    = var.CLOUDFRONT_DOMAIN != "" && var.CLOUDFRONT_DOMAIN != null ? 1 : 0
  
  zone_id = data.aws_route53_zone.domain_zone[0].zone_id
  name    = var.CLOUDFRONT_DOMAIN
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.cf.domain_name
    zone_id                = aws_cloudfront_distribution.cf.hosted_zone_id
    evaluate_target_health = false
  }
}

# =============================================================================
# Outputs
# =============================================================================

output "cloudfront_distribution_id" {
  description = "CloudFront Distribution ID"
  value       = aws_cloudfront_distribution.cf.id
}

output "cloudfront_distribution_domain_name" {
  description = "CloudFront Distribution Domain Name"
  value       = aws_cloudfront_distribution.cf.domain_name
}

output "cloudfront_custom_domain" {
  description = "Custom domain name (if configured)"
  value       = var.CLOUDFRONT_DOMAIN != "" && var.CLOUDFRONT_DOMAIN != null ? var.CLOUDFRONT_DOMAIN : null
}

output "cloudfront_certificate_arn" {
  description = "ACM Certificate ARN (if custom domain is used)"
  value       = var.CLOUDFRONT_DOMAIN != "" && var.CLOUDFRONT_DOMAIN != null ? aws_acm_certificate_validation.domain_cert_validation[0].certificate_arn : null
}

output "cloudfront_hosted_zone_id" {
  description = "CloudFront Distribution Hosted Zone ID"
  value       = aws_cloudfront_distribution.cf.hosted_zone_id
}

