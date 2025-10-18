enum TokenTransferTypes : u32 {
    TRANSFER = 0x03
};

struct TokenTransfer {
    TokenTransferTypes discriminator;
    le u64 amount;
};

TokenTransfer token_transfer @ 0x00;