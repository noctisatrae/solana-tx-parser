#pragma le
namespace solana {
    namespace jupiter_v6 {
        struct RoutePlanStep<auto N> {
            u8 swap[N];
            u8 percentage;
            u8 input_idx;
            u8 output_idx;
        };
        
        struct Route {
            // The discriminator is calculated by Anchor in two steps:
            // 
            // - 1. Make a hash by combining the function name and a prefix
            // sha256(fmt("global:%s", function_name))
            // 
            // - 2. Take only the first 8 bytes of that (little endian) to generate the discriminator.
            u8 discriminator[8] [[comment("todo(hector): I'm gonna write it with the actual formula so when I need more robust comparaison I will be able to use an enum")]];
            RoutePlanStep<5> route_plan[1] [[comment("the size of the array may varry depending on the route complexity")]];
            u64 in_amount;
            u64 quoted_out_amount;
            u16 slippage_bps;
            u8 platform_fee_bps;
        };
    }
}

solana::jupiter_v6::Route jupiter_swap @ 0x00;