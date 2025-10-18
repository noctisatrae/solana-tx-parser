import base58;

namespace solana {
    namespace jupiter_v6 {
        struct FeeEvent {
            u64 event_ix_tag;
            u64 event_discriminator;
            type::base58::Encoded<32> account;
            type::base58::Encoded<32> mint;
            u64 amount;
        };
    }
}

solana::jupiter_v6::FeeEvent fee_event @ 0x00;