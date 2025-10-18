#pragma le

namespace solana {
    namespace okx {
        struct Route {
            // dexes: bytes (Vec<u8>)
            u32 dex_len;
            u8  dexes[dex_len];
        
            // weights: bytes (Vec<u8>)
            u32 weights_len;
            u8  weights[weights_len];
        };
        
        // Inner Vec<Route>
        struct RouteList {
            u32 len;
            Route items[len];
        };
        
        struct SwapArgs {
            u64 amount_in;
            u64 expect_amount_out;
            u64 min_return;
        
            // amounts: Vec<u64>
            u32 amount_len;
            u64 amounts[amount_len];
        
            // routes: Vec<Vec<Route>>
            u32 routes_outer_len;
            RouteList routes[routes_outer_len];
        };
        
        struct SwapTobV3 {
            u8  discriminator[8];
            SwapArgs args;
            u32 commission_info;
            u8 trim_rate;
            u16 platform_fee_rate;
            u64 order_id;
        };
    }
}

solana::okx::SwapTobV3 swap @ 0x00;