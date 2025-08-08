resource "aws_cloudfront_origin_access_control" "oac" {
  provider = aws.infra_us_east_1
  name                              = "${var.ENVIRONMENT}-  luna"
  description                       = "${var.ENVIRONMENT}  Luna"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "cf" {
  provider = aws.infra
  origin {
    domain_name = aws_s3_bucket.application_front.bucket_regional_domain_name
    origin_id   = "application_front_eu_central_2"

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
      origin_id = "application_front_eu_central_2"  # Primary origin
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
    cloudfront_default_certificate = true
  }

  default_root_object = "index.html"
}
