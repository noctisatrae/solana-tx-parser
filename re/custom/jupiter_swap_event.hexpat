import base58;

namespace solana {
    namespace jupiter_v6 {
        struct SwapEvent {
            u64 event_ix_tag;
            u64 event_discriminator;
            type::base58::Encoded<32> amm;
            type::base58::Encoded<32> input_mint;
            u64 input_amount;
            type::base58::Encoded<32> output_mint;
            u64 ouput_amount;
        };
    }
}

solana::jupiter_v6::SwapEvent swap_event @ 0x00;
