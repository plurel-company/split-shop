/** Re-export SDK signing — stays aligned with splitante.com HMAC canonicalization. */
export {
  canonicalizeCart,
  createCartSignature,
  verifyCartSignature,
} from "@splitante/sdk/signing";
