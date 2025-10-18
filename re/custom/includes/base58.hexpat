import std.core;
import std.string;

namespace type {
    namespace base58 {
        const str ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

        struct Encoded<auto N> {
            u8 source[N];
        } [[sealed, format("type::base58::encode")]];

        fn encode(ref auto input) {
            u32 len = std::core::member_count(input.source);
            std::print("[DEBUG] len: {}", len);

            u8 digits[(len * 138 + 99) / 100 + 1];
            u32 digits_len = 0;

            u8 result[len * 237 / 100 + 1];

            for (u32 i = 0, i < len, i += 1) {
                u32 carry = input.source[i];
                for (u32 j = 0, j < digits_len, j += 1) {
                    carry += digits[j] << 8;
                    digits[j] = carry % 58;
                    carry /= 58;
                    std::print("[DEBUG] i: {} input: {:#x} carry: {}, digits: {}",i,input.source[i],carry, digits);
                }
                while (carry > 0) {
                    std::print("[DEBUG] digits_len: {}", digits_len);
                    digits[digits_len] = carry % 58;
                    digits_len += 1;
                    carry /= 58;
                }
            }

            for (u32 i = 0, i < digits_len, i += 1) {
                result[i] = std::string::at(ALPHABET, digits[digits_len - 1 - i]);
                std::print("[DEBUG] result[{}]: {}", i, result[i]);
            }

            str result_str;
            for (s32 i = 0, i < digits_len, i += 1)
                result_str += char(result[i]);
            return result_str;
        };
    }
}
