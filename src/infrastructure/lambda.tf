# Shared IAM trust policy
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

# Shared IAM role for both Lambdas
resource "aws_iam_role" "lambda_role" {
  name               = "clipshare_lambda_role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

# DynamoDB permissions for the role
resource "aws_iam_role_policy" "lambda_dynamodb_policy" {
  name = "clipshare_dynamodb_access"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem"
        ]
        Resource = aws_dynamodb_table.session_table.arn
      }
    ]
  })
}

# Package send.py
data "archive_file" "send_lambda" {
  type        = "zip"
  source_file = "${path.module}/../backend/send.py"
  output_path = "${path.module}/../backend/send.zip"
}

data "archive_file" "get_lambda" {
  type        = "zip"
  source_file = "${path.module}/../backend/get.py"
  output_path = "${path.module}/../backend/get.zip"
}



# Send Lambda
resource "aws_lambda_function" "send" {
  filename         = data.archive_file.send_lambda.output_path
  function_name    = "clipshare_send"
  role             = aws_iam_role.lambda_role.arn
  handler          = "send.handler"
  runtime          = "python3.12"


  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.session_table.name
    }
  }

  tags = {
    Project = "clipshare"
  }
}

# Get Lambda
resource "aws_lambda_function" "get" {
  filename         = data.archive_file.get_lambda.output_path
  function_name    = "clipshare_get"
  role             = aws_iam_role.lambda_role.arn
  handler          = "get.handler"
  runtime          = "python3.12"
  

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.session_table.name
    }
  }

  tags = {
    Project = "clipshare"
  }
}