#!/bin/bash

echo "Triggering import-invoice workflow..."
curl -X POST https://adti.api.markidiags.com/parse/functions/triggerImportInvoices \
  -H "X-Parse-Application-Id: adti-marki" \
  -H "X-Parse-Master-Key: e2f4e4e89056af61dd95a71226fa0e51917313e09b68aca8bf434e5eb9bd8aa9" \
  -H "Content-Type: application/json" \
  -d '{}'
