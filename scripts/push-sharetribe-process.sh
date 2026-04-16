#!/bin/bash
# Push transaction process to Sharetribe
#
# Prerequisites:
# 1. Run: flex-cli login
#    (Enter your Flex Console API key when prompted.
#     Get it from: https://flex-console.sharetribe.com → click your email → Manage API keys)
#
# 2. Get your marketplace ID from Flex Console (Build → General, or in the URL)
#    It's a UUID like: a1b2c3d4-e5f6-7890-abcd-ef1234567890
#
# Usage:
#   ./scripts/push-sharetribe-process.sh <MARKETPLACE_ID>
#   # or set env:
#   SHARETRIBE_MARKETPLACE_ID=your-uuid ./scripts/push-sharetribe-process.sh

set -e

MARKETPLACE_ID="${1:-$SHARETRIBE_MARKETPLACE_ID}"
PROCESS_NAME="flex-product-default-process"
PROCESS_DIR="$(cd "$(dirname "$0")/.." && pwd)/process"

if [ -z "$MARKETPLACE_ID" ]; then
  echo "Error: Marketplace ID required."
  echo ""
  echo "Get it from Flex Console: https://flex-console.sharetribe.com"
  echo "  Build → General (or check the URL when logged in)"
  echo ""
  echo "Usage: $0 <MARKETPLACE_ID>"
  echo "   or: SHARETRIBE_MARKETPLACE_ID=<uuid> $0"
  exit 1
fi

echo "Pushing process to Sharetribe..."
echo "  Marketplace: $MARKETPLACE_ID"
echo "  Process: $PROCESS_NAME"
echo "  Path: $PROCESS_DIR"
echo ""

flex-cli process push \
  --path="$PROCESS_DIR" \
  --process="$PROCESS_NAME" \
  --marketplace="$MARKETPLACE_ID"

echo ""
echo "Done. Process and templates have been pushed."
