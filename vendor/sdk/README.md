# Plurel SDK preview packages

These two packages were built and packed from the clean SDK commit recorded in
`provenance.json`. Version 1.1.1 has not been published to npm. The storefront
uses checked-in tarballs so CI and reviewers install the same release without
access to a sibling checkout.

`pnpm verify:sdk` checks archive SHA-256 digests, archive package metadata,
dependency pins, installed package versions, and React's resolved core package.
The same verification runs before tests and builds. React's core dependency is
overridden to the same archive to prevent a registry fallback.

To update, build and test a clean SDK commit, run `pnpm pack --pack-destination`
for both packages, replace the dependency pins and provenance, and run
`pnpm install`, `pnpm verify:sdk`, and the storefront checks. Keep the source
commit and archive hashes in the review. Switch back to registry dependencies
only after the reviewed release is published.
