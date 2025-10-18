import base58;

namespace solana {
    namespace jupiter_v6 {
        struct RoutePlanStep<auto N> {
            u8 swap[N];
            u8 percentage;
            u8 input_idx;
            u8 output_idx;
        };
    
        struct SharedAccountRoute {
            u8 discriminator[8];
            RoutePlanStep<3> unknown[3];
            u64 in_amount;
            u64 quoted_out_amount;
            u16 slippage_bps;
            u8 platform_fee_bps;
        };
    }
}

solana::jupiter_v6::SharedAccountRoute swap @ 0x00;