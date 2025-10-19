# solsauce

An easily-extendable parser for Solana transactions that demonstrates some of the techniques you can use to write minimalist & simple code. This might include some controversial way of interpreting binary data, namely deliberately avoiding the use of IDLs. There are two reasons for that:

- 1) As previously stayed, it was important to me that the code be minimalistic; IDLs will
often clutter you repository with a lot of junk you don't need. I understand that it might slow down iteration speed which is important in an industry like crypto, but in return you will get a better understanding of the contract you are working on, semantic precision and type safety while minimizing dependencies on top of that.
- 2) Not using IDLs or Anchor allows me to deep-dive into the inner-workings of Solana programs while being a good endeavour for teaching buffers, binary data types, discriminators and basic reverse-engineering. To go from scratch, I was required to read Solana's and Anchor's code to extract the discriminators manually and understand how some event selector hashes were computed; that work is roughly documented inside the [`re/doc.md`](./re/doc.md) file.

## Things left to do for completeness

> [!NOTE]
> I might get to them if there's enough interest; please ping me on mail (noctisatrae <at> pm.me - where I am the most likely to respond) or Farcaster (I might not get your message sorry).

### Jupiter v6

- [X] `route`
- [X] `shared_accounts_route`
- [ ] `route_v2`
- [ ] `shared_accounts_route_v2`

## Jupiter Order Engine

- [ ] `fill`

## OkDex: Aggregation Router V2

- [ ] `swap_tob_v3`

## Misc.

- [ ] Recursive traversal of the instruction tree (apply parsing to every instructions notwithstanding the stack height)
