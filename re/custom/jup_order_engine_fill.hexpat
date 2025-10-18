namespace solana {
    namespace jupiter_v6 {
        enum SwapType: u8 {
            EXACT_IN = 0,
            EXACT_OUT = 1
        };
    
        struct Fill {
            u8 discriminator[8];
            u64 input_amount;
            u64 output_amount;
            s64 expires_at;
            u16 fee_bps;
            SwapType swap_type;
        };
    }
}

solana::jupiter_v6::Fill fill @ 0x00;