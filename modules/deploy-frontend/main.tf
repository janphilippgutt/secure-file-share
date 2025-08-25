resource "random_id" "bucket_id" {
  byte_length = 4
}

module "s3_static_site" {
  source               = "git::https://github.com/janphilippgutt/terraform-aws-modules.git//modules/s3-static-site?ref=main"
  bucket_name          = "secure-file-share-static-site-demo${random_id.bucket_id}"
  environment          = "dev"
  enable_public_access = false
  use_oac              = true
  for_cloudfront       = true
}

module "cloudfront" {
  source             = "git::https://github.com/janphilippgutt/terraform-aws-modules.git//modules/cloudfront?ref=main"
  bucket_name        = module.s3_static_site.bucket_id
  bucket_arn         = module.s3_static_site.bucket_arn
  bucket_domain_name = module.s3_static_site.bucket_regional_domain_name
}
