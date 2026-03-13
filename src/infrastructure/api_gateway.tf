#Here i define the API so that we can have both GET and POST requests




#The API
resource "aws_apigatewayv2_api" "clipshare" {
  name          = "clipshare-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST"]
    allow_headers = ["Content-Type"]
  }
}

# Auto-deploy thingy
resource "aws_apigatewayv2_stage" "clipshare" {
  api_id      = aws_apigatewayv2_api.clipshare.id
  name        = "$default"
  auto_deploy = true
}

# Lambda  send
resource "aws_apigatewayv2_integration" "send" {
  api_id                 = aws_apigatewayv2_api.clipshare.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.send.invoke_arn
  payload_format_version = "2.0"
}

# Lambda  get
resource "aws_apigatewayv2_integration" "get" {
  api_id                 = aws_apigatewayv2_api.clipshare.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get.invoke_arn
  payload_format_version = "2.0"
}

# POST /send route
resource "aws_apigatewayv2_route" "send" {
  api_id    = aws_apigatewayv2_api.clipshare.id
  route_key = "POST /send"
  target    = "integrations/${aws_apigatewayv2_integration.send.id}"
}

# GET /get route
resource "aws_apigatewayv2_route" "get" {
  api_id    = aws_apigatewayv2_api.clipshare.id
  route_key = "GET /get"
  target    = "integrations/${aws_apigatewayv2_integration.get.id}"
}

# Permission send
resource "aws_lambda_permission" "send" {
  statement_id  = "AllowAPIGatewaySend"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.send.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.clipshare.execution_arn}/*/*"
}

# Permission get
resource "aws_lambda_permission" "get" {
  statement_id  = "AllowAPIGatewayGet"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.clipshare.execution_arn}/*/*"
}

#uwu

#Thotte safety mechanisim

resource "aws_apigatewayv2_stage" "clipshare" {
  api_id      = aws_apigatewayv2_api.clipshare.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_rate_limit  = 10   # max 10 requests per second
    throttling_burst_limit = 20   # max burst of 20
  }
}