#!/bin/bash

BASE_DIR="src/emqx-webhook/dto"

# Create DTO directory
mkdir -p $BASE_DIR

# Create files
touch $BASE_DIR/base.dto.ts
touch $BASE_DIR/client-connected.dto.ts
touch $BASE_DIR/client-disconnected.dto.ts
touch $BASE_DIR/message-publish.dto.ts
touch $BASE_DIR/message-delivered.dto.ts
touch $BASE_DIR/message-acked.dto.ts
touch $BASE_DIR/subscription.dto.ts

echo "Created DTO files:"
echo " - $BASE_DIR/base.dto.ts"
echo " - $BASE_DIR/client-connected.dto.ts"
echo " - $BASE_DIR/client-disconnected.dto.ts"
echo " - $BASE_DIR/message-publish.dto.ts"
echo " - $BASE_DIR/message-delivered.dto.ts"
echo " - $BASE_DIR/message-acked.dto.ts"
echo " - $BASE_DIR/subscription.dto.ts"

echo "Done."
