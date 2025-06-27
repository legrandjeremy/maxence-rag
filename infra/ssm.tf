
resource "aws_ssm_parameter" "ssm_cloudfront_id" {
  provider    = aws.infra
  name        = "/${var.ENVIRONMENT}/uci-dataride-v2-front/cloudfront_id"
  type        = "String"
  description = "Cloudfront ID For mAIjin Defi Front for '${var.ENVIRONMENT}'"
  value       = aws_cloudfront_distribution.cf.id
}
