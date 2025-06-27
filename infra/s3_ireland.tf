resource "aws_s3_bucket" "application_front_ireland" {
  provider           = aws.infra
  bucket             = "${var.ENVIRONMENT}-uci-dataride-v2-application-front-eu-west-1"
}

resource "aws_s3_bucket_policy" "default_ireland" {
  provider           = aws.infra
  bucket = aws_s3_bucket.application_front_ireland.id
  policy = data.aws_iam_policy_document.cloudfront_oac_access_ireland.json
}

data "aws_iam_policy_document" "cloudfront_oac_access_ireland" {
  provider           = aws.infra
  statement {
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions = [
      "s3:GetObject"
    ]

    resources = [
      aws_s3_bucket.application_front_ireland.arn,
      "${aws_s3_bucket.application_front_ireland.arn}/*"
    ]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.cf.arn]
    }
  }
}