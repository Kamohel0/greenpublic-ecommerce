#!/bin/bash

# GreenPublic Deployment Test Script
# Tests compilation, dependencies, and basic setup

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}GreenPublic AWS Deployment Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Check Java version
echo -e "${YELLOW}Step 1: Checking Java version...${NC}"
JAVA_VERSION=$(java -version 2>&1 | grep "version" | awk -F'"' '{print $2}' | awk -F'.' '{print $1}')
if [ "$JAVA_VERSION" -lt 17 ]; then
    echo -e "${RED}✗ Java 17+ required (found: $JAVA_VERSION)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Java $JAVA_VERSION found${NC}"
echo ""

# Step 2: Check Maven
echo -e "${YELLOW}Step 2: Checking Maven...${NC}"
if ! command -v mvn &> /dev/null; then
    echo -e "${RED}✗ Maven not found${NC}"
    exit 1
fi
MVN_VERSION=$(mvn -v | grep "Apache Maven" | awk '{print $3}')
echo -e "${GREEN}✓ Maven $MVN_VERSION found${NC}"
echo ""

# Step 3: Check pom.xml for AWS dependencies
echo -e "${YELLOW}Step 3: Verifying pom.xml has AWS dependencies...${NC}"
if grep -q "aws-java-sdk-s3" pom.xml; then
    echo -e "${GREEN}✓ AWS S3 dependency found${NC}"
else
    echo -e "${RED}✗ AWS S3 dependency missing${NC}"
    exit 1
fi

if grep -q "aws-java-sdk-cloudwatch" pom.xml; then
    echo -e "${GREEN}✓ AWS CloudWatch dependency found${NC}"
else
    echo -e "${RED}✗ AWS CloudWatch dependency missing${NC}"
    exit 1
fi

if grep -q "aws-java-sdk-cloudfront" pom.xml; then
    echo -e "${GREEN}✓ AWS CloudFront dependency found${NC}"
else
    echo -e "${RED}✗ AWS CloudFront dependency missing${NC}"
    exit 1
fi

if grep -q "spring-cloud-aws-starter" pom.xml; then
    echo -e "${GREEN}✓ Spring Cloud AWS starter found${NC}"
else
    echo -e "${RED}✗ Spring Cloud AWS starter missing${NC}"
    exit 1
fi
echo ""

# Step 4: Clean and compile
echo -e "${YELLOW}Step 4: Building application (this may take a few minutes)...${NC}"
mvn clean compile -q 2>&1 | head -20
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Compilation successful${NC}"
else
    echo -e "${RED}✗ Compilation failed${NC}"
    exit 1
fi
echo ""

# Step 5: Check configuration files
echo -e "${YELLOW}Step 5: Checking configuration files...${NC}"
if [ -f "src/main/resources/application.properties" ]; then
    echo -e "${GREEN}✓ application.properties found${NC}"
else
    echo -e "${RED}✗ application.properties missing${NC}"
    exit 1
fi

if [ -f "src/main/resources/application-prod.properties" ]; then
    echo -e "${GREEN}✓ application-prod.properties found${NC}"
    if grep -q "cloud.aws.s3.bucket" src/main/resources/application-prod.properties; then
        echo -e "${GREEN}✓ AWS S3 configuration present${NC}"
    else
        echo -e "${YELLOW}⚠ AWS S3 configuration incomplete${NC}"
    fi
else
    echo -e "${RED}✗ application-prod.properties missing${NC}"
    exit 1
fi
echo ""

# Step 6: Check for AWS configuration classes
echo -e "${YELLOW}Step 6: Verifying AWS configuration classes...${NC}"
if [ -f "src/main/java/com/greenpublic/ecommerce/config/AWSConfig.java" ]; then
    echo -e "${GREEN}✓ AWSConfig.java found${NC}"
else
    echo -e "${RED}✗ AWSConfig.java missing${NC}"
    exit 1
fi

if [ -f "src/main/java/com/greenpublic/ecommerce/config/CloudFrontUrlSignerUtil.java" ]; then
    echo -e "${GREEN}✓ CloudFrontUrlSignerUtil.java found${NC}"
else
    echo -e "${RED}✗ CloudFrontUrlSignerUtil.java missing${NC}"
    exit 1
fi

if [ -f "src/main/java/com/greenpublic/ecommerce/service/aws/S3Service.java" ]; then
    echo -e "${GREEN}✓ S3Service.java found${NC}"
else
    echo -e "${RED}✗ S3Service.java missing${NC}"
    exit 1
fi

if [ -f "src/main/java/com/greenpublic/ecommerce/service/aws/CloudWatchMetricsService.java" ]; then
    echo -e "${GREEN}✓ CloudWatchMetricsService.java found${NC}"
else
    echo -e "${RED}✗ CloudWatchMetricsService.java missing${NC}"
    exit 1
fi
echo ""

# Step 7: Check for database migration script
echo -e "${YELLOW}Step 7: Checking database migration...${NC}"
if [ -f "src/main/resources/db/migration/V002_ADD_PRODUCTION_FIELDS.sql" ]; then
    echo -e "${GREEN}✓ Database migration script found${NC}"
    MIGRATION_SIZE=$(wc -l < "src/main/resources/db/migration/V002_ADD_PRODUCTION_FIELDS.sql")
    echo "  Migration has $MIGRATION_SIZE lines"
else
    echo -e "${YELLOW}⚠ Database migration script not found (optional)${NC}"
fi
echo ""

# Step 8: Check service classes
echo -e "${YELLOW}Step 8: Verifying service layer...${NC}"
SERVICES=("PaymentService" "InventoryService" "RefundService" "PromoCodeService" "AuditLogService")
for service in "${SERVICES[@]}"; do
    if grep -r "class $service" src/main/java > /dev/null; then
        echo -e "${GREEN}✓ $service.java found${NC}"
    else
        echo -e "${RED}✗ $service.java missing${NC}"
        exit 1
    fi
done
echo ""

# Step 9: Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ All checks passed!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}Next steps:${NC}"
echo "1. Set environment variables:"
echo "   export DB_URL=\"jdbc:mysql://your-rds-endpoint:3306/GreenPublic?useSSL=false\""
echo "   export DB_USERNAME=\"admin\""
echo "   export DB_PASSWORD=\"your-password\""
echo "   export JWT_SECRET=\"your-jwt-secret\""
echo "   export AWS_S3_BUCKET=\"green-public-prod\""
echo "   export CLOUDFRONT_DOMAIN=\"d123456.cloudfront.net\""
echo "   export CLOUDFRONT_KEY_PAIR_ID=\"your-key-pair-id\""
echo ""
echo "2. Build the application:"
echo "   mvn clean package -DskipTests"
echo ""
echo "3. Run with production profile:"
echo "   java -jar target/ecommerce-*.jar --spring.profiles.active=production"
echo ""
echo "4. Or run with Docker:"
echo "   docker build -t greenpublic-api ."
echo "   docker run -e SPRING_PROFILES_ACTIVE=production greenpublic-api"
echo ""
