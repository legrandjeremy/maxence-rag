resource "aws_iam_role" "iam_role" {
  provider           = aws.infra
  name               = "${var.ENVIRONMENT}-uci-dataride-v2"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Sid       = "${var.ENVIRONMENT}"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_role_policy" {
  provider = aws.infra
  name     = "${var.ENVIRONMENT}-uci-dataride-v2"
  role     = aws_iam_role.iam_role.id

  policy = <<-EOF
  {
    "Version": "2012-10-17",
    "Statement": [
        {
          "Sid": "log",
          "Effect": "Allow",
          "Action": [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "logs:DescribeLogStreams",
              "logs:FilterLogEvents"
          ],
          "Resource": "arn:aws:logs:*:*:*"
        },
        {
          "Sid": "ec2",
          "Effect": "Allow",
          "Action": [
              "ec2:CreateNetworkInterface",
              "ec2:DescribeNetworkInterfaces",
              "ec2:DeleteNetworkInterface"
              
          ],
          "Resource": "*"
        }
    ]
  }
  EOF
}
