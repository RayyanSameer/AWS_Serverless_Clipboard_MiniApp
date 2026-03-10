resource "aws_s3_bucket" "frontend" {
  bucket = "clipshare-frontend-rayyan"

  tags = {
    Project = "clipshare"
  }
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.js"
  }

  error_document {
    key = "error.js"
  }
}