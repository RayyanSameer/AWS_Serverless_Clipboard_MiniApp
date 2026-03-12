output "api_endpoint" {
  value = aws_apigatewayv2_api.clipshare.api_endpoint
}

output "cloudfront_url" {
  value = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}