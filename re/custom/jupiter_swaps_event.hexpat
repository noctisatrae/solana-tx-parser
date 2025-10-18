import base58;
 
 namespace solana {
    namespace jupiter_v6 {
        struct SwapEventV2 {
            type::base58::Encoded<32> input_mint;
            u64 input_amount;
            type::base58::Encoded<32> output_mint;
            u64 ouput_amount;
        };
        
        struct SwapsEvent {
            u8 event_ix_tag[8];
            u8 discriminator[8];
            u32 vec_len;
            SwapEventV2 swaps[vec_len];
        };
    }
}
 
solana::jupiter_v6::SwapsEvent swaps @ 0x00;