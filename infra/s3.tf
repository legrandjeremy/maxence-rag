resource "aws_s3_bucket" "application_front" {
  provider           = aws.infra_eu_central_2
  bucket             = "${var.ENVIRONMENT}-uci-dataride-v2-application-front-eu-central-2"
}

resource "aws_s3_bucket_policy" "default" {
  provider           = aws.infra_eu_central_2
  bucket = aws_s3_bucket.application_front.id
  policy = data.aws_iam_policy_document.cloudfront_oac_access.json
}

data "aws_iam_policy_document" "cloudfront_oac_access" {
  provider           = aws.infra_eu_central_2
  statement {
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions = [
      "s3:GetObject"
    ]

    resources = [
      aws_s3_bucket.application_front.arn,
      "${aws_s3_bucket.application_front.arn}/*"
    ]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.cf.arn]
    }
  }
}