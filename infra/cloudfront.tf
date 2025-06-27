resource "aws_cloudfront_origin_access_control" "oac" {
  provider = aws.infra_us_east_1
  name                              = "${var.ENVIRONMENT}-dataride"
  description                       = "${var.ENVIRONMENT}  DataRide"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

data "aws_route53_zone" "route53" {
  provider = aws.infra_orga_uci
  name         = "tech.uci.ch"
  private_zone = false
}

resource "aws_acm_certificate" "acm" {
  provider = aws.infra_us_east_1
  domain_name       = var.CLOUDFRONT_PUBLIC_DOMAIN
  validation_method = "DNS"
}

resource "aws_route53_record" "route53_records" {
  provider = aws.infra_orga_uci
  for_each = {
    for dvo in aws_acm_certificate.acm.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.route53.zone_id
}

resource "aws_cloudfront_distribution" "cf" {
  provider = aws.infra
  origin {
    domain_name = aws_s3_bucket.application_front.bucket_regional_domain_name
    origin_id   = "application_front_eu_central_1"

    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  origin {
    domain_name = aws_s3_bucket.application_front_ireland.bucket_regional_domain_name
    origin_id   = "application_front_eu_west_1"

    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  origin_group {
    origin_id = "application_front"

    failover_criteria {
      status_codes = [500, 502, 503, 504]  # Failover on these HTTP status codes
    }

    member {
      origin_id = "application_front_eu_central_1"  # Primary origin
    }

    member {
      origin_id = "application_front_eu_west_1"  # Fallback origin
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  http_version        = "http2and3"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "application_front"
    forwarded_values {
      cookies {
        forward = "none"
      }
      query_string = false
    }
    min_ttl                = 31536000
    default_ttl            = 31536000
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

  restrictions {
    geo_restriction {
      restriction_type = "none"
      locations = []
    }
  }

  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.acm.arn
    ssl_support_method = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  default_root_object = "index.html"

  aliases = [var.CLOUDFRONT_PUBLIC_DOMAIN]

  depends_on = [aws_acm_certificate.acm]
}

resource "aws_route53_record" "cf_cloudfront_cname" {
  provider = aws.infra_orga_uci
  zone_id = data.aws_route53_zone.route53.zone_id
  name    = var.CLOUDFRONT_PUBLIC_DOMAIN
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.cf.domain_name
    zone_id                = aws_cloudfront_distribution.cf.hosted_zone_id
    evaluate_target_health = false
  }
}