output "api_endpoint" {
  value = aws_apigatewayv2_api.clipshare.api_endpoint
}

output "cloudfront_url" {
  value = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}
output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.frontend.id
}
