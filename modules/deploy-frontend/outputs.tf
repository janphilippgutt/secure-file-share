output "s3_bucket_name" {
  value = module.s3_static_site.bucket_name
}

output "cloudfront_domain" {
  value = module.cloudfront.distribution_domain_name
}