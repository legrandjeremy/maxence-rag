
resource "aws_ssm_parameter" "ssm_cloudfront_id" {
  provider    = aws.infra
  name        = "/${var.ENVIRONMENT}/luna-front/cloudfront_id"
  type        = "String"
  description = "Cloudfront ID For Luna Front for '${var.ENVIRONMENT}'"
  value       = aws_cloudfront_distribution.cf.id
}


resource "aws_ssm_parameter" "ssm_cloudfront_id_us_east_1" {
  provider    = aws.infra_us_east_1
  name        = "/${var.ENVIRONMENT}/luna-front/cloudfront_id"
  type        = "String"
  description = "Cloudfront ID For Luna Front for '${var.ENVIRONMENT}'"
  value       = aws_cloudfront_distribution.cf.id
}

resource "aws_ssm_parameter" "ssm_cloudfront_domain" {
  provider    = aws.infra
  name        = "/${var.ENVIRONMENT}/luna-front/cloudfront_domain"
  type        = "String"
  description = "Cloudfront Domain URL For Luna Front for '${var.ENVIRONMENT}'"
  value       = aws_cloudfront_distribution.cf.domain_name
}

resource "aws_ssm_parameter" "ssm_cloudfront_domain_us_east_1" {
  provider    = aws.infra_us_east_1
  name        = "/${var.ENVIRONMENT}/luna-front/cloudfront_domain"
  type        = "String"
  description = "Cloudfront Domain URL For Luna Front for '${var.ENVIRONMENT}'"
  value       = aws_cloudfront_distribution.cf.domain_name
}
